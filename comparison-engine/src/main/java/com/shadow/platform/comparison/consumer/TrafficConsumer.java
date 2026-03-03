package com.shadow.platform.comparison.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadow.platform.comparison.model.ComparisonResult;
import com.shadow.platform.comparison.service.AIComparisonClient;
import com.shadow.platform.comparison.service.CorrelationService;
import com.shadow.platform.comparison.service.DeterministicComparator;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

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
            KafkaTemplate<String, ComparisonResult> kafkaTemplate,
            MeterRegistry meterRegistry) {
        this.correlationService = correlationService;
        this.deterministicComparator = deterministicComparator;
        this.aiComparisonClient = aiComparisonClient;
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
            // ── Step 1: Deterministic Comparison ──
            ComparisonResult result = deterministicComparator.compare(prodData, shadowData);

            // ── Step 2: AI Comparison (only if deterministic detected mismatch) ──
            if (!result.isDeterministicPass()) {
                String prodBody = getString(prodData, "response_body");
                String shadowBody = getString(shadowData, "response_body");
                result = aiComparisonClient.enrichWithAI(result, prodBody, shadowBody);
            } else {
                result.setAiCompared(false);
                result.setSimilarityScore(1.0);
                result.setSeverity("none");
                result.setRiskScore(0.0);
            }

            // ── Step 3: Publish result to Kafka ──
            String key = result.getTenantId() + ":" + result.getRequestId();
            kafkaTemplate.send(comparisonResultsTopic, key, result);

            // ── Step 4: Alert if critical ──
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
