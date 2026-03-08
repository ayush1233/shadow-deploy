package com.shadow.platform.api.service;

import com.shadow.platform.api.model.ComparisonResultEntity;
import com.shadow.platform.api.repository.ComparisonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.Map;

@Service
public class ComparisonConsumer {

    private static final Logger log = LoggerFactory.getLogger(ComparisonConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ComparisonRepository comparisonRepository;

    public ComparisonConsumer(ComparisonRepository comparisonRepository) {
        this.comparisonRepository = comparisonRepository;
    }

    @KafkaListener(topics = "${shadow.kafka.topics.comparison-results:comparison-results}", groupId = "${spring.kafka.consumer.group-id:api-service-group}")
    public void consumeComparisonResult(Map<String, Object> result) {
        try {
            String requestId = getString(result, "request_id");
            if (requestId == null) {
                log.warn("Received comparison result without request_id, ignoring.");
                return;
            }

            log.info("Saving comparison result [request_id={}]", requestId);

            ComparisonResultEntity entity = new ComparisonResultEntity();
            entity.setRequestId(requestId);
            entity.setTenantId(getString(result, "tenant_id"));

            // Try to parse timestamp, otherwise it will be left null
            try {
                if (result.get("timestamp") != null) {
                    entity.setTimestamp(java.time.Instant.parse(getString(result, "timestamp")));
                }
            } catch (Exception e) {
            }

            entity.setEndpoint(getString(result, "endpoint"));
            entity.setMethod(getString(result, "method"));
            entity.setDeploymentId(getString(result, "deployment_id"));
            entity.setEnvironment(getString(result, "environment"));

            entity.setProdStatusCode(getInteger(result, "prod_status_code"));
            entity.setProdResponseTimeMs(getLong(result, "prod_response_time_ms"));
            entity.setProdBodyHash(getString(result, "prod_body_hash"));
            try {
                String prodBodyStr = getString(result, "prod_body");
                if (prodBodyStr != null) {
                    entity.setProdBody(objectMapper.readValue(prodBodyStr, new TypeReference<Map<String, Object>>() {
                    }));
                }
            } catch (Exception e) {
                log.debug("Failed to parse prod_body");
            }

            entity.setShadowStatusCode(getInteger(result, "shadow_status_code"));
            entity.setShadowResponseTimeMs(getLong(result, "shadow_response_time_ms"));
            entity.setShadowBodyHash(getString(result, "shadow_body_hash"));
            try {
                String shadowBodyStr = getString(result, "shadow_body");
                if (shadowBodyStr != null) {
                    entity.setShadowBody(
                            objectMapper.readValue(shadowBodyStr, new TypeReference<Map<String, Object>>() {
                            }));
                }
            } catch (Exception e) {
                log.debug("Failed to parse shadow_body");
            }

            entity.setStatusMatch(getBoolean(result, "status_match"));
            entity.setHeadersMatch(getBoolean(result, "headers_match"));
            entity.setBodyMatch(getBoolean(result, "body_match"));
            entity.setStructureMatch(getBoolean(result, "structure_match"));
            entity.setLatencyDeltaMs(getLong(result, "latency_delta_ms"));
            entity.setDeterministicPass(getBoolean(result, "deterministic_pass"));

            entity.setAiCompared(getBoolean(result, "ai_compared"));
            entity.setSimilarityScore(getDouble(result, "similarity_score"));
            entity.setSeverity(getString(result, "severity"));
            entity.setRiskScore(getDouble(result, "risk_score"));
            entity.setAiExplanation(getString(result, "ai_explanation"));
            entity.setRecommendedAction(getString(result, "recommended_action"));

            // Parse field_diffs
            if (result.get("field_diffs") instanceof java.util.List) {
                entity.setFieldDiffs((java.util.List<Map<String, Object>>) result.get("field_diffs"));
            }
            if (result.get("tags") instanceof java.util.List) {
                entity.setTags((java.util.List<String>) result.get("tags"));
            }

            // Parse explanation nested object
            Object explanationObj = result.get("explanation");
            if (explanationObj instanceof Map) {
                Map<String, Object> explanation = (Map<String, Object>) explanationObj;
                entity.setExplanationSummary(getString(explanation, "summary"));
                entity.setExplanationDetails(getString(explanation, "details"));
                entity.setExplanationImpact(getString(explanation, "impact"));
                entity.setExplanationConfidence(getDouble(explanation, "confidence"));
            }

            comparisonRepository.save(entity);
            log.debug("Successfully saved comparison result [request_id={}]", requestId);

        } catch (Exception e) {
            log.error("Failed to process comparison result", e);
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number)
            return ((Number) val).intValue();
        if (val instanceof String) {
            try {
                return Integer.parseInt((String) val);
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number)
            return ((Number) val).longValue();
        if (val instanceof String) {
            try {
                return Long.parseLong((String) val);
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        if (val instanceof String) {
            try {
                return Double.parseDouble((String) val);
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Boolean getBoolean(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Boolean)
            return (Boolean) val;
        if (val instanceof String)
            return Boolean.parseBoolean((String) val);
        return null;
    }
}
