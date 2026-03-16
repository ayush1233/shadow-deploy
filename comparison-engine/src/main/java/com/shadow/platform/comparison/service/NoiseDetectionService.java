package com.shadow.platform.comparison.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

/**
 * Auto-detects noisy fields by tracking which JSON paths differ
 * frequently for the same endpoint.  If a field changes in more
 * than {@code threshold}% of comparisons it is flagged as noise.
 *
 * Data is scoped per tenant so that noise profiles remain isolated.
 *
 * Redis keys used:
 *   noise:count:{tenant}:{endpoint}          — total comparisons
 *   noise:fields:{tenant}:{endpoint}         — hash: field → diff-count
 *   noise:auto:{tenant}:{endpoint}           — set of auto-detected noisy fields
 *   noise:manual                             — set of user-configured noisy fields
 */
@Service
public class NoiseDetectionService {

    private static final Logger log = LoggerFactory.getLogger(NoiseDetectionService.class);

    private final StringRedisTemplate redis;

    /** Minimum comparisons before noise detection kicks in. */
    @Value("${shadow.noise.min-samples:10}")
    private int minSamples;

    /** A field is "noisy" if it differs in more than this % of comparisons. */
    @Value("${shadow.noise.threshold-percent:80}")
    private int thresholdPercent;

    /** TTL for noise tracking counters (re-learns periodically). */
    @Value("${shadow.noise.ttl-hours:24}")
    private int ttlHours;

    public NoiseDetectionService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    // ── Learning ────────────────────────────────────────────────

    /**
     * Called after every comparison.  Records which fields had diffs
     * and (re-)evaluates the noise profile for this endpoint.
     */
    public void recordDiffs(String tenantId, String endpoint,
                            List<String> diffPaths) {

        String tenant = tenantId != null ? tenantId : "default";
        String countKey = "noise:count:" + tenant + ":" + endpoint;
        String fieldsKey = "noise:fields:" + tenant + ":" + endpoint;

        // Increment total-comparison counter
        Long total = redis.opsForValue().increment(countKey);
        if (total != null && total == 1L) {
            redis.expire(countKey, Duration.ofHours(ttlHours));
            redis.expire(fieldsKey, Duration.ofHours(ttlHours));
        }

        // Increment per-field diff counter
        for (String path : diffPaths) {
            redis.opsForHash().increment(fieldsKey, path, 1);
        }

        // Evaluate after enough samples
        if (total != null && total >= minSamples && total % 5 == 0) {
            evaluateNoise(tenant, endpoint, total);
        }
    }

    private void evaluateNoise(String tenant, String endpoint, long total) {
        String fieldsKey = "noise:fields:" + tenant + ":" + endpoint;
        String autoKey = "noise:auto:" + tenant + ":" + endpoint;

        Map<Object, Object> fieldCounts = redis.opsForHash().entries(fieldsKey);
        Set<String> newNoisy = new HashSet<>();

        for (Map.Entry<Object, Object> entry : fieldCounts.entrySet()) {
            String field = entry.getKey().toString();
            long count = Long.parseLong(entry.getValue().toString());
            double pct = (count * 100.0) / total;

            if (pct >= thresholdPercent) {
                newNoisy.add(field);
            }
        }

        // Update auto-detected set (replace entirely)
        redis.delete(autoKey);
        if (!newNoisy.isEmpty()) {
            redis.opsForSet().add(autoKey, newNoisy.toArray(String[]::new));
            redis.expire(autoKey, Duration.ofHours(ttlHours));
            log.info("Auto-detected {} noisy field(s) for [tenant={}, endpoint={}]: {}",
                    newNoisy.size(), tenant, endpoint, newNoisy);
        }
    }

    // ── Retrieval ───────────────────────────────────────────────

    /**
     * Returns the combined set of noisy fields (auto-detected + manual)
     * for a given tenant and endpoint.
     */
    public Set<String> getNoisyFields(String tenantId, String endpoint) {
        String tenant = tenantId != null ? tenantId : "default";
        Set<String> result = new HashSet<>();

        // Auto-detected (per tenant:endpoint)
        Set<String> autoFields = redis.opsForSet()
                .members("noise:auto:" + tenant + ":" + endpoint);
        if (autoFields != null) result.addAll(autoFields);

        // Manually configured (global)
        Set<String> manualFields = redis.opsForSet()
                .members("noise:manual");
        if (manualFields != null) result.addAll(manualFields);

        return result;
    }

    // ── Manual Field Management ─────────────────────────────────

    public Set<String> getManualNoiseFields() {
        Set<String> fields = redis.opsForSet().members("noise:manual");
        return fields != null ? fields : Collections.emptySet();
    }

    public void addManualNoiseField(String field) {
        redis.opsForSet().add("noise:manual", field);
        log.info("Manually added noise field: {}", field);
    }

    public void removeManualNoiseField(String field) {
        redis.opsForSet().remove("noise:manual", field);
        log.info("Manually removed noise field: {}", field);
    }

    /**
     * Returns the auto-detected noisy fields for a specific endpoint.
     */
    public Set<String> getAutoDetectedFields(String tenantId, String endpoint) {
        String tenant = tenantId != null ? tenantId : "default";
        Set<String> fields = redis.opsForSet()
                .members("noise:auto:" + tenant + ":" + endpoint);
        return fields != null ? fields : Collections.emptySet();
    }
}
