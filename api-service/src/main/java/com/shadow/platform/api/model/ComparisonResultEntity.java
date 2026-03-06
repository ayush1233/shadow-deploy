package com.shadow.platform.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "comparisons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonResultEntity {

    @Id
    @Column(name = "request_id")
    private String requestId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "endpoint")
    private String endpoint;

    @Column(name = "method")
    private String method;

    @Column(name = "deployment_id")
    private String deploymentId;

    // ── Production Response ──
    @Column(name = "prod_status_code")
    private Integer prodStatusCode;

    @Column(name = "prod_response_time_ms")
    private Long prodResponseTimeMs;

    @Column(name = "prod_body_hash")
    private String prodBodyHash;

    // ── Shadow Response ──
    @Column(name = "shadow_status_code")
    private Integer shadowStatusCode;

    @Column(name = "shadow_response_time_ms")
    private Long shadowResponseTimeMs;

    @Column(name = "shadow_body_hash")
    private String shadowBodyHash;

    // ── Deterministic Comparison ──
    @Column(name = "status_match")
    private Boolean statusMatch;

    @Column(name = "headers_match")
    private Boolean headersMatch;

    @Column(name = "body_match")
    private Boolean bodyMatch;

    @Column(name = "structure_match")
    private Boolean structureMatch;

    @Column(name = "latency_delta_ms")
    private Long latencyDeltaMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_diffs", columnDefinition = "jsonb")
    private List<Map<String, Object>> fieldDiffs;

    @Column(name = "deterministic_pass")
    private Boolean deterministicPass;

    // ── AI Comparison ──
    @Column(name = "ai_compared")
    private Boolean aiCompared;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "severity")
    private String severity;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "ai_explanation", columnDefinition = "text")
    private String aiExplanation;

    @Column(name = "recommended_action", columnDefinition = "text")
    private String recommendedAction;

    @Column(name = "explanation_summary", columnDefinition = "text")
    private String explanationSummary;

    @Column(name = "explanation_details", columnDefinition = "text")
    private String explanationDetails;

    @Column(name = "explanation_impact", columnDefinition = "text")
    private String explanationImpact;

    @Column(name = "explanation_confidence")
    private Double explanationConfidence;

    // ── Metadata ──
    @Column(name = "environment")
    private String environment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    // Store exact bodies for frontend comparison view
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "prod_body", columnDefinition = "jsonb")
    private Map<String, Object> prodBody;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "shadow_body", columnDefinition = "jsonb")
    private Map<String, Object> shadowBody;
}
