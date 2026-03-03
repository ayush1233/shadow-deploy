package com.shadow.platform.comparison.service;

import com.shadow.platform.comparison.model.ComparisonResult;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

/**
 * Client for the Python FastAPI AI Comparison Service.
 * Calls the /compare endpoint with prod/shadow response bodies
 * and enriches the ComparisonResult with AI analysis.
 */
@Service
public class AIComparisonClient {

    private static final Logger log = LoggerFactory.getLogger(AIComparisonClient.class);

    private final WebClient webClient;
    private final boolean aiEnabled;
    private final Duration timeout;
    private final Counter aiCallCounter;
    private final Counter aiErrorCounter;
    private final Timer aiLatencyTimer;

    public AIComparisonClient(
            @Value("${shadow.ai.service-url:http://localhost:8000}") String aiServiceUrl,
            @Value("${shadow.ai.enabled:true}") boolean aiEnabled,
            @Value("${shadow.ai.timeout-ms:30000}") long timeoutMs,
            MeterRegistry meterRegistry) {
        this.webClient = WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
        this.aiEnabled = aiEnabled;
        this.timeout = Duration.ofMillis(timeoutMs);
        this.aiCallCounter = Counter.builder("shadow.ai.calls").register(meterRegistry);
        this.aiErrorCounter = Counter.builder("shadow.ai.errors").register(meterRegistry);
        this.aiLatencyTimer = Timer.builder("shadow.ai.latency").register(meterRegistry);
    }

    /**
     * Calls the AI comparison service and enriches the result.
     * Returns the enriched result, or the original if AI is disabled/fails.
     */
    public ComparisonResult enrichWithAI(ComparisonResult result,
            String prodBody, String shadowBody) {
        if (!aiEnabled) {
            log.debug("AI comparison disabled, skipping for request_id={}", result.getRequestId());
            result.setAiCompared(false);
            return result;
        }

        try {
            aiCallCounter.increment();

            Map<String, Object> requestPayload = Map.of(
                    "request_id", result.getRequestId(),
                    "tenant_id", result.getTenantId() != null ? result.getTenantId() : "default",
                    "endpoint", result.getEndpoint() != null ? result.getEndpoint() : "/unknown",
                    "prod_body", prodBody != null ? prodBody : "",
                    "shadow_body", shadowBody != null ? shadowBody : "",
                    "field_diffs", result.getFieldDiffs() != null ? result.getFieldDiffs() : java.util.List.of(),
                    "status_match", result.isStatusMatch(),
                    "latency_delta_ms", result.getLatencyDeltaMs() != null ? result.getLatencyDeltaMs() : 0);

            Map<String, Object> aiResponse = aiLatencyTimer.record(() -> webClient.post()
                    .uri("/api/v1/compare")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(timeout)
                    .block());

            if (aiResponse != null) {
                result.setAiCompared(true);
                result.setSimilarityScore(getDouble(aiResponse, "similarity_score"));
                result.setSeverity(getString(aiResponse, "severity"));
                result.setRiskScore(getDouble(aiResponse, "risk_score"));
                result.setAiExplanation(getString(aiResponse, "explanation"));
                result.setRecommendedAction(getString(aiResponse, "recommended_action"));

                log.info("AI comparison complete [request_id={}, similarity={}, severity={}, risk={}]",
                        result.getRequestId(), result.getSimilarityScore(),
                        result.getSeverity(), result.getRiskScore());
            }

        } catch (Exception e) {
            aiErrorCounter.increment();
            log.error("AI comparison failed for request_id={}: {}", result.getRequestId(), e.getMessage());
            result.setAiCompared(false);
            result.setAiExplanation("AI comparison unavailable: " + e.getMessage());
        }

        return result;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        return null;
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}
