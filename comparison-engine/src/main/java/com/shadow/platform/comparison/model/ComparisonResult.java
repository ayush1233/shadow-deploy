package com.shadow.platform.comparison.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class ComparisonResult {

    @JsonProperty("request_id")
    private String requestId;

    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("timestamp")
    private Instant timestamp;

    @JsonProperty("endpoint")
    private String endpoint;

    @JsonProperty("method")
    private String method;

    @JsonProperty("deployment_id")
    private String deploymentId;

    // ── Production Response ──
    @JsonProperty("prod_status_code")
    private Integer prodStatusCode;

    @JsonProperty("prod_response_time_ms")
    private Long prodResponseTimeMs;

    @JsonProperty("prod_body_hash")
    private String prodBodyHash;

    // ── Shadow Response ──
    @JsonProperty("shadow_status_code")
    private Integer shadowStatusCode;

    @JsonProperty("shadow_response_time_ms")
    private Long shadowResponseTimeMs;

    @JsonProperty("shadow_body_hash")
    private String shadowBodyHash;

    // ── Deterministic Comparison ──
    @JsonProperty("status_match")
    private boolean statusMatch;

    @JsonProperty("headers_match")
    private boolean headersMatch;

    @JsonProperty("body_match")
    private boolean bodyMatch;

    @JsonProperty("structure_match")
    private boolean structureMatch;

    @JsonProperty("latency_delta_ms")
    private Long latencyDeltaMs;

    @JsonProperty("field_diffs")
    private List<FieldDiff> fieldDiffs;

    @JsonProperty("deterministic_pass")
    private boolean deterministicPass;

    // ── AI Comparison ──
    @JsonProperty("ai_compared")
    private boolean aiCompared;

    @JsonProperty("similarity_score")
    private Double similarityScore;

    @JsonProperty("severity")
    private String severity;

    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("ai_explanation")
    private String aiExplanation;

    @JsonProperty("recommended_action")
    private String recommendedAction;

    @JsonProperty("explanation")
    private AIExplanation explanation;

    // ── Metadata ──
    @JsonProperty("environment")
    private String environment;

    @JsonProperty("tags")
    private List<String> tags;

    // Getters and setters
    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getDeploymentId() {
        return deploymentId;
    }

    public void setDeploymentId(String deploymentId) {
        this.deploymentId = deploymentId;
    }

    public Integer getProdStatusCode() {
        return prodStatusCode;
    }

    public void setProdStatusCode(Integer s) {
        this.prodStatusCode = s;
    }

    public Long getProdResponseTimeMs() {
        return prodResponseTimeMs;
    }

    public void setProdResponseTimeMs(Long t) {
        this.prodResponseTimeMs = t;
    }

    public String getProdBodyHash() {
        return prodBodyHash;
    }

    public void setProdBodyHash(String h) {
        this.prodBodyHash = h;
    }

    public Integer getShadowStatusCode() {
        return shadowStatusCode;
    }

    public void setShadowStatusCode(Integer s) {
        this.shadowStatusCode = s;
    }

    public Long getShadowResponseTimeMs() {
        return shadowResponseTimeMs;
    }

    public void setShadowResponseTimeMs(Long t) {
        this.shadowResponseTimeMs = t;
    }

    public String getShadowBodyHash() {
        return shadowBodyHash;
    }

    public void setShadowBodyHash(String h) {
        this.shadowBodyHash = h;
    }

    public boolean isStatusMatch() {
        return statusMatch;
    }

    public void setStatusMatch(boolean m) {
        this.statusMatch = m;
    }

    public boolean isHeadersMatch() {
        return headersMatch;
    }

    public void setHeadersMatch(boolean m) {
        this.headersMatch = m;
    }

    public boolean isBodyMatch() {
        return bodyMatch;
    }

    public void setBodyMatch(boolean m) {
        this.bodyMatch = m;
    }

    public boolean isStructureMatch() {
        return structureMatch;
    }

    public void setStructureMatch(boolean m) {
        this.structureMatch = m;
    }

    public Long getLatencyDeltaMs() {
        return latencyDeltaMs;
    }

    public void setLatencyDeltaMs(Long d) {
        this.latencyDeltaMs = d;
    }

    public List<FieldDiff> getFieldDiffs() {
        return fieldDiffs;
    }

    public void setFieldDiffs(List<FieldDiff> d) {
        this.fieldDiffs = d;
    }

    public boolean isDeterministicPass() {
        return deterministicPass;
    }

    public void setDeterministicPass(boolean p) {
        this.deterministicPass = p;
    }

    public boolean isAiCompared() {
        return aiCompared;
    }

    public void setAiCompared(boolean c) {
        this.aiCompared = c;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double s) {
        this.similarityScore = s;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String s) {
        this.severity = s;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double r) {
        this.riskScore = r;
    }

    public String getAiExplanation() {
        return aiExplanation;
    }

    public void setAiExplanation(String e) {
        this.aiExplanation = e;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String a) {
        this.recommendedAction = a;
    }

    public AIExplanation getExplanation() {
        return explanation;
    }

    public void setExplanation(AIExplanation explanation) {
        this.explanation = explanation;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String e) {
        this.environment = e;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> t) {
        this.tags = t;
    }

    // ── Inner classes ──

    public static class AIExplanation {
        @JsonProperty("summary")
        private String summary;

        @JsonProperty("details")
        private String details;

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("confidence")
        private Double confidence;

        public AIExplanation() {
        }

        public AIExplanation(String summary, String details, String impact, Double confidence) {
            this.summary = summary;
            this.details = details;
            this.impact = impact;
            this.confidence = confidence;
        }

        public String getSummary() {
            return summary;
        }

        public void setSummary(String summary) {
            this.summary = summary;
        }

        public String getDetails() {
            return details;
        }

        public void setDetails(String details) {
            this.details = details;
        }

        public String getImpact() {
            return impact;
        }

        public void setImpact(String impact) {
            this.impact = impact;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }
    }

    public static class FieldDiff {
        @JsonProperty("path")
        private String path;

        @JsonProperty("prod_value")
        private String prodValue;

        @JsonProperty("shadow_value")
        private String shadowValue;

        @JsonProperty("diff_type")
        private String diffType; // ADDED, REMOVED, CHANGED, TYPE_CHANGED

        public FieldDiff() {
        }

        public FieldDiff(String path, String prodValue, String shadowValue, String diffType) {
            this.path = path;
            this.prodValue = prodValue;
            this.shadowValue = shadowValue;
            this.diffType = diffType;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String p) {
            this.path = p;
        }

        public String getProdValue() {
            return prodValue;
        }

        public void setProdValue(String v) {
            this.prodValue = v;
        }

        public String getShadowValue() {
            return shadowValue;
        }

        public void setShadowValue(String v) {
            this.shadowValue = v;
        }

        public String getDiffType() {
            return diffType;
        }

        public void setDiffType(String t) {
            this.diffType = t;
        }
    }
}
