package com.shadow.platform.comparison.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.flipkart.zjsonpatch.DiffFlags;
import com.flipkart.zjsonpatch.JsonDiff;
import com.shadow.platform.comparison.model.ComparisonResult;
import com.shadow.platform.comparison.model.ComparisonResult.FieldDiff;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic comparison engine.
 * Compares status codes, headers, JSON structure, and field-level values.
 */
@Service
public class DeterministicComparator {

    private static final Logger log = LoggerFactory.getLogger(DeterministicComparator.class);

    private final ObjectMapper objectMapper;
    private final Set<String> ignoreFields;
    private final Set<String> ignoreHeaders;
    private final Counter matchCounter;
    private final Counter mismatchCounter;

    public DeterministicComparator(
            MeterRegistry meterRegistry,
            @Value("${shadow.comparison.ignore-fields:}") List<String> ignoreFields,
            @Value("${shadow.comparison.ignore-header-keys:}") List<String> ignoreHeaders) {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
        this.ignoreFields = new HashSet<>(ignoreFields);
        this.ignoreHeaders = ignoreHeaders.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        this.matchCounter = Counter.builder("shadow.comparison.deterministic")
                .tag("result", "match").register(meterRegistry);
        this.mismatchCounter = Counter.builder("shadow.comparison.deterministic")
                .tag("result", "mismatch").register(meterRegistry);
    }

    public ComparisonResult compare(Map<String, Object> prodData, Map<String, Object> shadowData) {
        return compare(prodData, shadowData, Collections.emptySet());
    }

    /**
     * Compare production vs shadow data, treating fields in noisyFields
     * as expected noise (tagged NOISE instead of CHANGED).
     */
    public ComparisonResult compare(Map<String, Object> prodData, Map<String, Object> shadowData,
                                    Set<String> noisyFields) {
        ComparisonResult result = new ComparisonResult();
        result.setTimestamp(Instant.now());

        result.setRequestId(getString(prodData, "request_id"));
        result.setTenantId(getString(prodData, "tenant_id"));
        result.setEndpoint(getString(prodData, "endpoint"));
        result.setMethod(getString(prodData, "method"));
        result.setDeploymentId(getString(shadowData, "deployment_id"));
        result.setEnvironment(getString(prodData, "environment"));

        // ── Status Code Comparison ──
        Integer prodStatus = getInt(prodData, "response_status");
        Integer shadowStatus = getInt(shadowData, "response_status");
        result.setProdStatusCode(prodStatus);
        result.setShadowStatusCode(shadowStatus);
        result.setStatusMatch(Objects.equals(prodStatus, shadowStatus));

        // ── Latency Comparison ──
        Long prodLatency = getLong(prodData, "response_time_ms");
        Long shadowLatency = getLong(shadowData, "response_time_ms");
        result.setProdResponseTimeMs(prodLatency);
        result.setShadowResponseTimeMs(shadowLatency);
        if (prodLatency != null && shadowLatency != null) {
            result.setLatencyDeltaMs(shadowLatency - prodLatency);
        }

        // ── Header Comparison ──
        Map<String, String> prodHeaders = filterHeaders(getMap(prodData, "response_headers"));
        Map<String, String> shadowHeaders = filterHeaders(getMap(shadowData, "response_headers"));
        result.setHeadersMatch(prodHeaders.equals(shadowHeaders));

        // ── Body Comparison ──
        String prodBody = getString(prodData, "response_body");
        String shadowBody = getString(shadowData, "response_body");
        result.setProdBodyHash(hash(prodBody));
        result.setShadowBodyHash(hash(shadowBody));

        List<FieldDiff> diffs = new ArrayList<>();
        boolean bodyMatch = true;
        boolean structureMatch = true;

        try {
            if (prodBody != null && shadowBody != null) {
                JsonNode prodJson = objectMapper.readTree(prodBody);
                JsonNode shadowJson = objectMapper.readTree(shadowBody);

                // Remove ignored fields before comparison
                removeIgnoredFields(prodJson);
                removeIgnoredFields(shadowJson);

                // JSON structural + value diff using zjsonpatch
                // ADD_ORIGINAL_VALUE_ON_REPLACE includes "fromValue" so we can show the old value in diffs
                JsonNode patchNode = JsonDiff.asJson(prodJson, shadowJson,
                        EnumSet.of(DiffFlags.ADD_ORIGINAL_VALUE_ON_REPLACE));

                if (patchNode.size() > 0) {
                    bodyMatch = false;

                    for (JsonNode op : patchNode) {
                        String operation = op.get("op").asText();
                        String path = op.get("path").asText();

                        // Check if this is a structural change
                        if ("add".equals(operation) || "remove".equals(operation)) {
                            structureMatch = false;
                        }

                        String prodVal = "";
                        String shadowVal = "";

                        if (op.has("value")) {
                            shadowVal = op.get("value").toString();
                        }
                        if (op.has("fromValue")) {
                            prodVal = op.get("fromValue").toString();
                        }

                        String diffType;
                        boolean isNoise = isNoisyPath(path, noisyFields);

                        if (isNoise) {
                            diffType = "NOISE";
                        } else {
                            diffType = switch (operation) {
                                case "add" -> "ADDED";
                                case "remove" -> "REMOVED";
                                case "replace" -> "CHANGED";
                                case "move" -> "MOVED";
                                default -> "UNKNOWN";
                            };
                        }

                        diffs.add(new FieldDiff(path, prodVal, shadowVal, diffType));
                    }
                }
            } else if (prodBody == null && shadowBody == null) {
                bodyMatch = true;
            } else {
                bodyMatch = false;
                structureMatch = false;
                diffs.add(new FieldDiff("/",
                        prodBody != null ? "(present)" : "(null)",
                        shadowBody != null ? "(present)" : "(null)",
                        "CHANGED"));
            }
        } catch (Exception e) {
            // If JSON parsing fails, do string comparison
            bodyMatch = Objects.equals(prodBody, shadowBody);
            if (!bodyMatch) {
                diffs.add(new FieldDiff("/", "(non-JSON)", "(non-JSON)", "CHANGED"));
            }
        }

        result.setFieldDiffs(diffs);

        // Count real (non-noise) diffs for bodyMatch
        long realDiffs = diffs.stream()
                .filter(d -> !"NOISE".equals(d.getDiffType()))
                .count();
        if (realDiffs == 0 && bodyMatch == false && !diffs.isEmpty()) {
            // All diffs were noise — treat as a match
            bodyMatch = true;
        }
        result.setBodyMatch(bodyMatch);
        result.setStructureMatch(structureMatch);

        // ── Overall deterministic result ──
        boolean pass = result.isStatusMatch() && result.isBodyMatch() && result.isHeadersMatch();
        result.setDeterministicPass(pass);

        if (pass) {
            matchCounter.increment();
        } else {
            mismatchCounter.increment();
        }

        log.debug("Deterministic comparison [request_id={}, pass={}, diffs={}]",
                result.getRequestId(), pass, diffs.size());

        return result;
    }

    /**
     * Checks if a JSON path matches any known noisy field.
     * Matches both exact paths (e.g., "/timestamp") and
     * leaf field names (e.g., path "/data/created_at" matches noisy field "created_at").
     */
    private boolean isNoisyPath(String path, Set<String> noisyFields) {
        if (noisyFields.isEmpty()) return false;

        // Exact match: "/timestamp"
        if (noisyFields.contains(path)) return true;

        // Leaf-name match: "/data/0/created_at" → "created_at"
        String leaf = path.contains("/")
                ? path.substring(path.lastIndexOf('/') + 1)
                : path;
        return noisyFields.contains(leaf) || noisyFields.contains("/" + leaf);
    }

    private void removeIgnoredFields(JsonNode node) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            for (String field : ignoreFields) {
                obj.remove(field);
            }
            obj.fields().forEachRemaining(entry -> removeIgnoredFields(entry.getValue()));
        } else if (node.isArray()) {
            node.forEach(this::removeIgnoredFields);
        }
    }

    private Map<String, String> filterHeaders(Map<String, String> headers) {
        if (headers == null)
            return Map.of();
        return headers.entrySet().stream()
                .filter(e -> !ignoreHeaders.contains(e.getKey().toLowerCase()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private String hash(String content) {
        if (content == null)
            return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return null;
        }
    }

    private String getString(Map<String, Object> data, String key) {
        Object val = data.get(key);
        return val != null ? val.toString() : null;
    }

    private Integer getInt(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof Number)
            return ((Number) val).intValue();
        if (val instanceof String)
            try {
                return Integer.parseInt((String) val);
            } catch (Exception e) {
            }
        return null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof Number)
            return ((Number) val).longValue();
        if (val instanceof String)
            try {
                return Long.parseLong((String) val);
            } catch (Exception e) {
            }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> getMap(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof Map)
            return (Map<String, String>) val;
        return null;
    }
}
