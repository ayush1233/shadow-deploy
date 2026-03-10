package com.shadow.platform.ingestion.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;

public class TrafficEvent {

    // Optional: enrichEvent() in IngestionController generates these if missing
    @JsonProperty("request_id")
    private String requestId;

    // Optional: resolved from header, API key, or TenantFilter if missing
    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("timestamp")
    private Instant timestamp;

    @JsonProperty("traffic_type")
    @NotBlank(message = "traffic_type is required (production|shadow)")
    private String trafficType;

    @JsonProperty("method")
    @NotBlank
    private String method;

    @JsonProperty("endpoint")
    @NotBlank
    private String endpoint;

    @JsonProperty("request_headers")
    private Map<String, String> requestHeaders;

    @JsonProperty("request_body")
    private String requestBody;

    @JsonProperty("response_status")
    @NotNull
    private Integer responseStatus;

    @JsonProperty("response_headers")
    private Map<String, String> responseHeaders;

    @JsonProperty("response_body")
    private String responseBody;

    @JsonProperty("response_time_ms")
    private Long responseTimeMs;

    @JsonProperty("deployment_id")
    private String deploymentId;

    @JsonProperty("environment")
    private String environment;

    @JsonProperty("ingestion_mode")
    private String ingestionMode;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    public TrafficEvent() {
        this.timestamp = Instant.now();
    }

    // Getters and setters
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getTrafficType() { return trafficType; }
    public void setTrafficType(String trafficType) { this.trafficType = trafficType; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public Map<String, String> getRequestHeaders() { return requestHeaders; }
    public void setRequestHeaders(Map<String, String> requestHeaders) { this.requestHeaders = requestHeaders; }

    public String getRequestBody() { return requestBody; }
    public void setRequestBody(String requestBody) { this.requestBody = requestBody; }

    public Integer getResponseStatus() { return responseStatus; }
    public void setResponseStatus(Integer responseStatus) { this.responseStatus = responseStatus; }

    public Map<String, String> getResponseHeaders() { return responseHeaders; }
    public void setResponseHeaders(Map<String, String> responseHeaders) { this.responseHeaders = responseHeaders; }

    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }

    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }

    public String getDeploymentId() { return deploymentId; }
    public void setDeploymentId(String deploymentId) { this.deploymentId = deploymentId; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getIngestionMode() { return ingestionMode; }
    public void setIngestionMode(String ingestionMode) { this.ingestionMode = ingestionMode; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    /**
     * Generate the Kafka partition key: tenant_id + request_id
     */
    public String partitionKey() {
        return tenantId + ":" + requestId;
    }
}
