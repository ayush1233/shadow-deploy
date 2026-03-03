package com.shadow.platform.api.controller;

import com.shadow.platform.api.repository.ComparisonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    @Autowired
    private ComparisonRepository comparisonRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> getMetricsSummary(
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "1h") String timeRange) {

        Instant since = parseTimeRange(timeRange);

        long totalRequests = comparisonRepository.countRequestsSince(since);
        long totalMismatches = comparisonRepository.countMismatchesSince(since);
        
        double mismatchRate = totalRequests > 0 ? ((double) totalMismatches / totalRequests) * 100.0 : 0.0;
        
        Double avgRisk = comparisonRepository.averageRiskScoreSince(since);
        Double avgProdLat = comparisonRepository.averageProdLatencySince(since);
        Double avgShadowLat = comparisonRepository.averageShadowLatencySince(since);

        List<Map<String, Object>> severityRaw = comparisonRepository.getSeverityBreakdownSince(since);
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

        return ResponseEntity.ok(Map.of(
                "time_range", timeRange,
                "timestamp", Instant.now().toString(),
                "overview", Map.of(
                        "total_requests", totalRequests,
                        "total_comparisons", totalRequests, // Assuming 1:1 for now
                        "total_mismatches", totalMismatches,
                        "mismatch_rate_percent", Math.round(mismatchRate * 100.0) / 100.0,
                        "deployment_risk_score", avgRisk != null ? Math.round(avgRisk * 10.0) / 10.0 : 0.0,
                        "avg_latency_prod_ms", avgProdLat != null ? Math.round(avgProdLat) : 0,
                        "avg_latency_shadow_ms", avgShadowLat != null ? Math.round(avgShadowLat) : 0),
                "severity_breakdown", severityBreakdown,
                "top_endpoints", Map.of(), // To be implemented with Pageable query
                "latency", Map.of(
                        "p50_delta_ms", 0,
                        "p95_delta_ms", 0,
                        "p99_delta_ms", 0,
                        "regression_count", 0)));
    }

    private Instant parseTimeRange(String timeRange) {
        if (timeRange == null) return Instant.now().minus(1, ChronoUnit.HOURS);
        if (timeRange.endsWith("h")) {
            long hours = Long.parseLong(timeRange.replace("h", ""));
            return Instant.now().minus(hours, ChronoUnit.HOURS);
        } else if (timeRange.endsWith("d")) {
            long days = Long.parseLong(timeRange.replace("d", ""));
            return Instant.now().minus(days, ChronoUnit.DAYS);
        } else if (timeRange.endsWith("m")) {
            long mins = Long.parseLong(timeRange.replace("m", ""));
            return Instant.now().minus(mins, ChronoUnit.MINUTES);
        }
        return Instant.now().minus(1, ChronoUnit.HOURS);
    }
}
