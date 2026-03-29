package com.shadow.platform.api.controller;

import com.shadow.platform.api.security.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/deployments")
public class DeploymentController {

    @Value("${shadow.deployment.risk-threshold:5.0}")
    private double riskThreshold;

    @GetMapping("/{id}/report")
    public ResponseEntity<?> getDeploymentReport(@PathVariable String id,
            HttpServletRequest request) {
        String tenantId = TenantAccess.requireTenantId(request);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("deployment_id", id);
        report.put("tenant_id", tenantId);
        report.put("status", "analyzing");
        report.put("risk_score", 3.2);
        report.put("total_requests", 15420);
        report.put("mismatches", 127);
        report.put("mismatch_rate", 0.82);
        report.put("critical_count", 3);
        report.put("high_count", 12);
        report.put("medium_count", 45);
        report.put("low_count", 67);
        report.put("latency_p95_delta_ms", 23);
        report.put("started_at", Instant.now().minusSeconds(3600).toString());
        report.put("approval_status", "PENDING");
        report.put("threshold", riskThreshold);
        report.put("safe_to_promote", true);
        report.put("top_mismatched_endpoints", List.of(
                Map.of("endpoint", "/api/users", "mismatch_count", 45, "severity", "medium"),
                Map.of("endpoint", "/api/orders", "mismatch_count", 32, "severity", "high"),
                Map.of("endpoint", "/api/products", "mismatch_count", 28, "severity", "low")));

        return ResponseEntity.ok(report);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveDeployment(@PathVariable String id,
            HttpServletRequest request) {
        String tenantId = TenantAccess.requireTenantId(request);
        return ResponseEntity.ok(Map.of(
                "deployment_id", id,
                "tenant_id", tenantId,
                "status", "APPROVED",
                "approved_at", Instant.now().toString(),
                "message", "Deployment approved for promotion"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectDeployment(@PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        String tenantId = TenantAccess.requireTenantId(request);
        String reason = body != null ? body.getOrDefault("reason", "Manual rejection") : "Manual rejection";
        return ResponseEntity.ok(Map.of(
                "deployment_id", id,
                "tenant_id", tenantId,
                "status", "REJECTED",
                "rejected_at", Instant.now().toString(),
                "reason", reason));
    }
}
