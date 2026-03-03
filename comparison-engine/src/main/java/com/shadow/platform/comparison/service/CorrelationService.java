package com.shadow.platform.comparison.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Correlates production and shadow responses by request_id using Redis.
 * When both sides arrive, returns the paired data for comparison.
 */
@Service
public class CorrelationService {

    private static final Logger log = LoggerFactory.getLogger(CorrelationService.class);
    private static final String PROD_PREFIX = "correlation:prod:";
    private static final String SHADOW_PREFIX = "correlation:shadow:";
    private static final Duration TTL = Duration.ofSeconds(120);

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public CorrelationService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
    }

    /**
     * Store production response data and check if shadow already arrived.
     * 
     * @return The shadow data if already present, null otherwise.
     */
    public Map<String, Object> storeProductionAndGetPair(String requestId, Map<String, Object> prodData) {
        try {
            String prodKey = PROD_PREFIX + requestId;
            String shadowKey = SHADOW_PREFIX + requestId;

            String serialized = objectMapper.writeValueAsString(prodData);
            redisTemplate.opsForValue().set(prodKey, serialized, TTL);

            String shadowData = redisTemplate.opsForValue().get(shadowKey);
            if (shadowData != null) {
                log.debug("Correlation match found for request_id={} (prod arrived after shadow)", requestId);
                redisTemplate.delete(prodKey);
                redisTemplate.delete(shadowKey);
                return objectMapper.readValue(shadowData, Map.class);
            }

            return null;
        } catch (Exception e) {
            log.error("Error storing production data for request_id={}: {}", requestId, e.getMessage());
            return null;
        }
    }

    /**
     * Store shadow response data and check if production already arrived.
     * 
     * @return The production data if already present, null otherwise.
     */
    public Map<String, Object> storeShadowAndGetPair(String requestId, Map<String, Object> shadowData) {
        try {
            String prodKey = PROD_PREFIX + requestId;
            String shadowKey = SHADOW_PREFIX + requestId;

            String serialized = objectMapper.writeValueAsString(shadowData);
            redisTemplate.opsForValue().set(shadowKey, serialized, TTL);

            String prodDataStr = redisTemplate.opsForValue().get(prodKey);
            if (prodDataStr != null) {
                log.debug("Correlation match found for request_id={} (shadow arrived after prod)", requestId);
                redisTemplate.delete(prodKey);
                redisTemplate.delete(shadowKey);
                return objectMapper.readValue(prodDataStr, Map.class);
            }

            return null;
        } catch (Exception e) {
            log.error("Error storing shadow data for request_id={}: {}", requestId, e.getMessage());
            return null;
        }
    }

    /**
     * Get the number of pending correlations (approximate).
     */
    public long getPendingCount() {
        try {
            Long prodCount = redisTemplate.keys(PROD_PREFIX + "*") != null
                    ? redisTemplate.keys(PROD_PREFIX + "*").size()
                    : 0L;
            Long shadowCount = redisTemplate.keys(SHADOW_PREFIX + "*") != null
                    ? redisTemplate.keys(SHADOW_PREFIX + "*").size()
                    : 0L;
            return prodCount + shadowCount;
        } catch (Exception e) {
            return -1;
        }
    }
}
