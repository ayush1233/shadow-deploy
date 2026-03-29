package com.shadow.platform.api.service;

import com.shadow.platform.api.model.ApiKeyEntity;
import com.shadow.platform.api.repository.ApiKeyRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Syncs API keys from PostgreSQL to Redis so that the ingestion service
 * can validate keys without a direct DB connection.
 *
 * Redis key pattern: apikey:{sha256hash} -> {tenantId}:{scopes}
 */
@Service
public class ApiKeySyncService {

    private static final Logger log = LoggerFactory.getLogger(ApiKeySyncService.class);
    private static final String REDIS_KEY_PREFIX = "apikey:";

    private final ApiKeyRepository apiKeyRepository;
    private final StringRedisTemplate redisTemplate;

    public ApiKeySyncService(ApiKeyRepository apiKeyRepository,
                             StringRedisTemplate redisTemplate) {
        this.apiKeyRepository = apiKeyRepository;
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void initialSync() {
        syncAllKeysToRedis();
    }

    @Scheduled(fixedRate = 300_000) // Re-sync every 5 minutes
    public void periodicSync() {
        syncAllKeysToRedis();
    }

    public void syncAllKeysToRedis() {
        try {
            List<ApiKeyEntity> activeKeys = apiKeyRepository.findByIsActiveTrue();
            int synced = 0;
            for (ApiKeyEntity key : activeKeys) {
                if (!key.isExpired()) {
                    syncKeyToRedis(key.getKeyHash(), key.getTenantId(), key.getScopes());
                    synced++;
                }
            }
            log.info("Synced {} active API keys to Redis", synced);
        } catch (Exception e) {
            log.error("Failed to sync API keys to Redis", e);
        }
    }

    public void syncKeyToRedis(String keyHash, String tenantId, String scopes) {
        String redisKey = REDIS_KEY_PREFIX + keyHash;
        String value = tenantId + ":" + scopes;
        redisTemplate.opsForValue().set(redisKey, value);
    }

    public void removeKeyFromRedis(String keyHash) {
        String redisKey = REDIS_KEY_PREFIX + keyHash;
        redisTemplate.delete(redisKey);
    }
}
