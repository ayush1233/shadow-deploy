package com.shadow.platform.comparison.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadow.platform.comparison.model.ComparisonResult;
import com.shadow.platform.comparison.service.AIComparisonClient;
import com.shadow.platform.comparison.service.AIExplanationService;
import com.shadow.platform.comparison.service.CorrelationService;
import com.shadow.platform.comparison.service.DeterministicComparator;
import com.shadow.platform.comparison.service.NoiseDetectionService;
import com.shadow.platform.comparison.service.ResponseFetcher;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Kafka consumer that processes both production and shadow traffic events,
 * correlates them, runs deterministic comparison, and triggers AI comparison
 * when mismatches are found.
 */
@Component
public class TrafficConsumer {

    private static final Logger log = LoggerFactory.getLogger(TrafficConsumer.class);

    private final CorrelationService correlationService;
    private final DeterministicComparator deterministicComparator;
    private final AIComparisonClient aiComparisonClient;
    private final AIExplanationService aiExplanationService;
    private final NoiseDetectionService noiseDetectionService;
    private final ResponseFetcher responseFetcher;
    private final KafkaTemplate<String, ComparisonResult> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Counter processedCounter;
    private final Counter correlatedCounter;

    @Value("${shadow.kafka.topics.comparison-results}")
    private String comparisonResultsTopic;

    @Value("${shadow.kafka.topics.alerts}")
    private String alertsTopic;

    public TrafficConsumer(CorrelationService correlationService,
            DeterministicComparator deterministicComparator,
            AIComparisonClient aiComparisonClient,
            AIExplanationService aiExplanationService,
            NoiseDetectionService noiseDetectionService,
            ResponseFetcher responseFetcher,
            KafkaTemplate<String, ComparisonResult> kafkaTemplate,
            MeterRegistry meterRegistry) {
        this.correlationService = correlationService;
        this.deterministicComparator = deterministicComparator;
        this.aiComparisonClient = aiComparisonClient;
        this.aiExplanationService = aiExplanationService;
        this.noiseDetectionService = noiseDetectionService;
        this.responseFetcher = responseFetcher;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
        this.processedCounter = Counter.builder("shadow.consumer.processed").register(meterRegistry);
        this.correlatedCounter = Counter.builder("shadow.consumer.correlated").register(meterRegistry);
    }

    @KafkaListener(topics = "${shadow.kafka.topics.prod-traffic}", groupId = "comparison-engine-group")
    public void consumeProductionTraffic(Map<String, Object> event) {
        processedCounter.increment();
        String requestId = getString(event, "request_id");

        log.debug("Received production event [request_id={}]", requestId);

        Map<String, Object> shadowData = correlationService.storeProductionAndGetPair(requestId, event);
        if (shadowData != null) {
            correlatedCounter.increment();
            processComparison(event, shadowData);
        }
    }

    @KafkaListener(topics = "${shadow.kafka.topics.shadow-traffic}", groupId = "comparison-engine-group")
    public void consumeShadowTraffic(Map<String, Object> event) {
        processedCounter.increment();
        String requestId = getString(event, "request_id");

        log.debug("Received shadow event [request_id={}]", requestId);

        Map<String, Object> prodData = correlationService.storeShadowAndGetPair(requestId, event);
        if (prodData != null) {
            correlatedCounter.increment();
            processComparison(prodData, event);
        }
    }

    private void processComparison(Map<String, Object> prodData, Map<String, Object> shadowData) {
        String requestId = getString(prodData, "request_id");

        try {
            // ── Step 0: Fetch actual response bodies if missing (NGINX mirror limitation) ──
            String endpoint = getString(prodData, "endpoint");
            String method = getString(prodData, "method");
            String prodBody = getString(prodData, "response_body");
            String shadowBody = getString(shadowData, "response_body");

            if ((prodBody == null || prodBody.isBlank()) && endpoint != null) {
                log.debug("Fetching actual response bodies for request_id={} [endpoint={}]", requestId, endpoint);
                ResponseFetcher.FetchResult prodResult = responseFetcher.fetchProd(endpoint, method);
                ResponseFetcher.FetchResult shadowResult = responseFetcher.fetchShadow(endpoint, method);

                if (prodResult != null) {
                    prodData.put("response_body", prodResult.body());
                    if (prodData.get("response_status") == null) {
                        prodData.put("response_status", prodResult.statusCode());
                    }
                    if (prodData.get("response_time_ms") == null) {
                        prodData.put("response_time_ms", prodResult.elapsedMs());
                    }
                }
                if (shadowResult != null) {
                    shadowData.put("response_body", shadowResult.body());
                    if (shadowData.get("response_status") == null) {
                        shadowData.put("response_status", shadowResult.statusCode());
                    }
                    if (shadowData.get("response_time_ms") == null) {
                        shadowData.put("response_time_ms", shadowResult.elapsedMs());
                    }
                }
            }

            // ── Step 1: Get noisy fields for this tenant/endpoint ──
            String tenantId = getString(prodData, "tenant_id");
            Set<String> noisyFields = noiseDetectionService.getNoisyFields(tenantId, endpoint);

            // ── Step 2: Deterministic Comparison (with noise awareness) ──
            ComparisonResult result = deterministicComparator.compare(prodData, shadowData, noisyFields);

            // ── Step 2.5: Feed diffs back for noise learning ──
            if (result.getFieldDiffs() != null && !result.getFieldDiffs().isEmpty()) {
                List<String> diffPaths = result.getFieldDiffs().stream()
                        .map(ComparisonResult.FieldDiff::getPath)
                        .collect(Collectors.toList());
                noiseDetectionService.recordDiffs(tenantId, endpoint, diffPaths);
            }

            // ── Step 3: AI Comparison (only if deterministic detected mismatch) ──
            if (!result.isDeterministicPass()) {
                prodBody = getString(prodData, "response_body");
                shadowBody = getString(shadowData, "response_body");
                result = aiComparisonClient.enrichWithAI(result, prodBody, shadowBody);

                // ── Step 3.5: AI Explanation ──
                if (!result.isDeterministicPass()
                        || (result.getSimilarityScore() != null && result.getSimilarityScore() < 0.95)) {
                    try {
                        ComparisonResult.AIExplanation explanation = aiExplanationService.generateExplanation(
                                requestId, prodBody, shadowBody, result.getFieldDiffs()).get();
                        result.setExplanation(explanation);
                    } catch (Exception e) {
                        log.error("Failed to generate AI explanation: {}", e.getMessage());
                    }
                }
            } else {
                result.setAiCompared(false);
                result.setSimilarityScore(1.0);
                result.setSeverity("none");
                result.setRiskScore(0.0);
            }

            result.setProdBody(getString(prodData, "response_body"));
            result.setShadowBody(getString(shadowData, "response_body"));

            // ── Step 4: Publish result to Kafka ──
            String key = result.getTenantId() + ":" + result.getRequestId();
            kafkaTemplate.send(comparisonResultsTopic, key, result);

            // ── Step 5: Alert if critical ──
            if ("critical".equalsIgnoreCase(result.getSeverity()) ||
                    "high".equalsIgnoreCase(result.getSeverity())) {
                kafkaTemplate.send(alertsTopic, key, result);
                log.warn("ALERT: {} severity mismatch [request_id={}, endpoint={}, risk={}]",
                        result.getSeverity(), requestId, result.getEndpoint(), result.getRiskScore());
            }

            log.info("Comparison complete [request_id={}, pass={}, severity={}, risk={}]",
                    requestId, result.isDeterministicPass(),
                    result.getSeverity(), result.getRiskScore());

        } catch (Exception e) {
            log.error("Failed to process comparison for request_id={}: {}", requestId, e.getMessage(), e);
        }
    }

    private String getString(Map<String, Object> data, String key) {
        Object val = data.get(key);
        return val != null ? val.toString() : null;
    }
}
