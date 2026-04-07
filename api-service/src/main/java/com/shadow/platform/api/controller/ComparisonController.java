package com.shadow.platform.api.controller;

import com.shadow.platform.api.model.ComparisonResultEntity;
import com.shadow.platform.api.repository.ComparisonRepository;
import com.shadow.platform.api.security.TenantAccess;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/comparisons")
public class ComparisonController {

    @Autowired
    private ComparisonRepository comparisonRepository;

    @GetMapping("/{requestId}")
    public ResponseEntity<?> getComparison(@PathVariable String requestId,
            HttpServletRequest request) {

        String tenantId = TenantAccess.requireTenantId(request);

        Optional<ComparisonResultEntity> entityOpt = comparisonRepository.findByRequestIdAndTenantId(requestId, tenantId);
        if (entityOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ComparisonResultEntity entity = entityOpt.get();

        Map<String, Object> comparisonData = new LinkedHashMap<>();
        comparisonData.put("status_match", entity.getStatusMatch());
        comparisonData.put("headers_match", entity.getHeadersMatch());
        comparisonData.put("body_match", entity.getBodyMatch());
        comparisonData.put("structure_match", entity.getStructureMatch());
        comparisonData.put("latency_delta_ms", entity.getLatencyDeltaMs());
        comparisonData.put("similarity_score", entity.getSimilarityScore());
        comparisonData.put("risk_score", entity.getRiskScore());
        comparisonData.put("severity", entity.getSeverity());
        comparisonData.put("deterministic_pass", entity.getDeterministicPass());
        comparisonData.put("ai_compared", entity.getAiCompared());
        comparisonData.put("ai_explanation", entity.getAiExplanation());
        comparisonData.put("recommended_action", entity.getRecommendedAction());
        comparisonData.put("field_diffs", entity.getFieldDiffs());

        if (entity.getExplanationSummary() != null || entity.getExplanationDetails() != null) {
            Map<String, Object> explanation = new LinkedHashMap<>();
            explanation.put("summary", entity.getExplanationSummary());
            explanation.put("details", entity.getExplanationDetails());
            explanation.put("impact", entity.getExplanationImpact());
            explanation.put("confidence", entity.getExplanationConfidence());
            comparisonData.put("explanation", explanation);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("request_id", entity.getRequestId());
        result.put("tenant_id", entity.getTenantId());
        result.put("timestamp",
                entity.getTimestamp() != null ? entity.getTimestamp().toString() : Instant.now().toString());
        result.put("endpoint", entity.getEndpoint());
        result.put("method", entity.getMethod());

        Map<String, Object> prod = new LinkedHashMap<>();
        prod.put("status_code", entity.getProdStatusCode());
        prod.put("response_time_ms", entity.getProdResponseTimeMs());
        prod.put("body", entity.getProdBody());
        result.put("production", prod);

        Map<String, Object> shadow = new LinkedHashMap<>();
        shadow.put("status_code", entity.getShadowStatusCode());
        shadow.put("response_time_ms", entity.getShadowResponseTimeMs());
        shadow.put("body", entity.getShadowBody());
        result.put("shadow", shadow);

        result.put("comparison", comparisonData);

        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<?> listComparisons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String endpoint,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        String tenantId = TenantAccess.requireTenantId(request);

        Specification<ComparisonResultEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (endpoint != null && !endpoint.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("endpoint")), "%" + endpoint.toLowerCase() + "%"));
            }
            if (severity != null && !severity.isEmpty() && !severity.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(cb.lower(root.get("severity")), severity.toLowerCase()));
            }
            if (from != null && !from.isEmpty()) {
                try {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), Instant.parse(from)));
                } catch (Exception e) {
                }
            }
            if (to != null && !to.isEmpty()) {
                try {
                    predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), Instant.parse(to)));
                } catch (Exception e) {
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ComparisonResultEntity> resultPage = comparisonRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp")));

        List<Map<String, Object>> comparisons = new ArrayList<>();
        for (ComparisonResultEntity entity : resultPage.getContent()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("request_id", entity.getRequestId());
            map.put("endpoint", entity.getEndpoint());
            map.put("method", entity.getMethod());
            map.put("severity", entity.getSeverity());
            map.put("similarity_score", entity.getSimilarityScore());
            map.put("risk_score", entity.getRiskScore());
            map.put("timestamp",
                    entity.getTimestamp() != null ? entity.getTimestamp().toString() : Instant.now().toString());
            map.put("deterministic_pass", entity.getDeterministicPass());
            map.put("body_match", entity.getBodyMatch());
            map.put("prod_response_time_ms", entity.getProdResponseTimeMs());
            map.put("shadow_response_time_ms", entity.getShadowResponseTimeMs());
            map.put("latency_delta_ms", entity.getLatencyDeltaMs());
            comparisons.add(map);
        }

        return ResponseEntity.ok(Map.of(
                "data", comparisons,
                "page", resultPage.getNumber(),
                "size", resultPage.getSize(),
                "total", resultPage.getTotalElements(),
                "total_pages", resultPage.getTotalPages()));
    }
}
