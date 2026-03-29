package com.shadow.platform.api.controller;

import com.shadow.platform.api.repository.ComparisonRepository;
import com.shadow.platform.api.security.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    @Autowired
    private ComparisonRepository comparisonRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> getMetricsSummary(
            HttpServletRequest request,
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "1h") String timeRange) {

        String authenticatedTenantId = TenantAccess.requireTenantId(request);
        TenantAccess.validateTenantOverride(tenantId, authenticatedTenantId);
        Instant since = parseTimeRange(timeRange);

        long totalRequests = comparisonRepository.countRequestsSinceForTenant(authenticatedTenantId, since);
        long totalMismatches = comparisonRepository.countMismatchesSinceForTenant(authenticatedTenantId, since);

        double mismatchRate = totalRequests > 0 ? ((double) totalMismatches / totalRequests) * 100.0 : 0.0;

        Double avgRisk = comparisonRepository.averageRiskScoreSinceForTenant(authenticatedTenantId, since);
        Double avgProdLat = comparisonRepository.averageProdLatencySinceForTenant(authenticatedTenantId, since);
        Double avgShadowLat = comparisonRepository.averageShadowLatencySinceForTenant(authenticatedTenantId, since);

        List<Map<String, Object>> severityRaw = comparisonRepository.getSeverityBreakdownSinceForTenant(authenticatedTenantId, since);
        Map<String, Long> severityBreakdown = new HashMap<>();
        severityBreakdown.put("critical", 0L);
        severityBreakdown.put("high", 0L);
        severityBreakdown.put("medium", 0L);
        severityBreakdown.put("low", 0L);

        for (Map<String, Object> map : severityRaw) {
            String severity = String.valueOf(map.get("severity")).toLowerCase();
            Long count = ((Number) map.get("count")).longValue();
            severityBreakdown.put(severity, count);
        }

        // Top endpoints by mismatch count
        List<Map<String, Object>> topEndpointsRaw = comparisonRepository.getTopEndpointsSinceForTenant(authenticatedTenantId, since);
        List<Map<String, Object>> topEndpoints = new ArrayList<>();
        int limit = Math.min(topEndpointsRaw.size(), 10);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> row = topEndpointsRaw.get(i);
            topEndpoints.add(Map.of(
                    "endpoint", String.valueOf(row.get("endpoint")),
                    "total", ((Number) row.get("total")).longValue(),
                    "mismatches", ((Number) row.get("mismatches")).longValue()));
        }

        // Latency percentiles from sorted deltas
        List<Long> deltas = comparisonRepository.getLatencyDeltasSinceForTenant(authenticatedTenantId, since);
        long p50 = percentile(deltas, 50);
        long p95 = percentile(deltas, 95);
        long p99 = percentile(deltas, 99);
        long regressionCount = deltas.stream().filter(d -> d > 100).count();

        return ResponseEntity.ok(Map.of(
                "tenant_id", authenticatedTenantId,
                "time_range", timeRange,
                "timestamp", Instant.now().toString(),
                "overview", Map.of(
                        "total_requests", totalRequests,
                        "total_comparisons", totalRequests,
                        "total_mismatches", totalMismatches,
                        "mismatch_rate_percent", Math.round(mismatchRate * 100.0) / 100.0,
                        "deployment_risk_score", avgRisk != null ? Math.round(avgRisk * 10.0) / 10.0 : 0.0,
                        "avg_latency_prod_ms", avgProdLat != null ? Math.round(avgProdLat) : 0,
                        "avg_latency_shadow_ms", avgShadowLat != null ? Math.round(avgShadowLat) : 0),
                "severity_breakdown", severityBreakdown,
                "top_endpoints", topEndpoints,
                "latency", Map.of(
                        "p50_delta_ms", p50,
                        "p95_delta_ms", p95,
                        "p99_delta_ms", p99,
                        "regression_count", regressionCount)));
    }

    private long percentile(List<Long> sorted, int p) {
        if (sorted.isEmpty()) return 0;
        int idx = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(idx, sorted.size() - 1)));
    }

    private Instant parseTimeRange(String timeRange) {
        if (timeRange == null) return Instant.now().minus(1, ChronoUnit.HOURS);
        try {
            if (timeRange.endsWith("h")) {
                return Instant.now().minus(Long.parseLong(timeRange.replace("h", "")), ChronoUnit.HOURS);
            } else if (timeRange.endsWith("d")) {
                return Instant.now().minus(Long.parseLong(timeRange.replace("d", "")), ChronoUnit.DAYS);
            } else if (timeRange.endsWith("m")) {
                return Instant.now().minus(Long.parseLong(timeRange.replace("m", "")), ChronoUnit.MINUTES);
            }
        } catch (NumberFormatException ignored) {}
        return Instant.now().minus(1, ChronoUnit.HOURS);
    }
}
