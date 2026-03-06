package com.shadow.platform.ingestion.controller;

import com.shadow.platform.ingestion.filter.TenantFilter;
import com.shadow.platform.ingestion.model.TrafficEvent;
import com.shadow.platform.ingestion.service.KafkaProducerService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingest")
public class IngestionController {

    private static final Logger log = LoggerFactory.getLogger(IngestionController.class);

    private final KafkaProducerService kafkaProducerService;

    public IngestionController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * SDK / Gateway Plugin ingestion endpoint.
     * Accepts a normalized traffic event from any ingestion mode.
     */
    @PostMapping("/event")
    public ResponseEntity<Map<String, Object>> ingestEvent(
            @Valid @RequestBody TrafficEvent event,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {

        enrichEvent(event, tenantIdHeader, "sdk");

        kafkaProducerService.publishTrafficEvent(event);

        log.info("Ingested {} event [request_id={}, tenant={}, endpoint={}]",
                event.getTrafficType(), event.getRequestId(),
                event.getTenantId(), event.getEndpoint());

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "status", "accepted",
                        "request_id", event.getRequestId(),
                        "timestamp", Instant.now().toString()));
    }

    /**
     * Batch ingestion for SDKs that buffer events.
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> ingestBatch(
            @Valid @RequestBody List<TrafficEvent> events,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {

        int count = 0;
        for (TrafficEvent event : events) {
            enrichEvent(event, tenantIdHeader, "sdk-batch");
            kafkaProducerService.publishTrafficEvent(event);
            count++;
        }

        log.info("Ingested batch of {} events [tenant={}]", count, tenantIdHeader);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "status", "accepted",
                        "count", count,
                        "timestamp", Instant.now().toString()));
    }

    /**
     * Production traffic ingestion (from NGINX mirror).
     */
    @RequestMapping("/production")
    public ResponseEntity<Map<String, Object>> ingestProduction(
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-request-id", required = false) String requestId,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader Map<String, String> headers) {

        log.info("Production Traffic Incoming - x-request-id: {}, Headers: {}", requestId, headers);

        TrafficEvent event = buildProxyEvent(requestId, tenantId, "production", body, headers);
        kafkaProducerService.publishTrafficEvent(event);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "accepted", "request_id", event.getRequestId()));
    }

    /**
     * Shadow traffic ingestion (from NGINX mirror).
     */
    @RequestMapping("/shadow")
    public ResponseEntity<Map<String, Object>> ingestShadow(
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-request-id", required = false) String requestId,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader Map<String, String> headers) {

        log.info("Shadow Traffic Incoming - x-request-id: {}, Headers: {}", requestId, headers);

        TrafficEvent event = buildProxyEvent(requestId, tenantId, "shadow", body, headers);
        kafkaProducerService.publishTrafficEvent(event);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "accepted", "request_id", event.getRequestId()));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "healthy", "service", "ingestion-service"));
    }

    // ─────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────

    private void enrichEvent(TrafficEvent event, String tenantIdHeader, String ingestionMode) {
        if (event.getRequestId() == null || event.getRequestId().isBlank()) {
            event.setRequestId(UUID.randomUUID().toString());
        }

        String tenantId = event.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = tenantIdHeader;
        }
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = TenantFilter.getCurrentTenant();
        }
        event.setTenantId(tenantId);

        if (event.getTimestamp() == null) {
            event.setTimestamp(Instant.now());
        }

        if (event.getIngestionMode() == null) {
            event.setIngestionMode(ingestionMode);
        }
    }

    private TrafficEvent buildProxyEvent(String requestId, String tenantId,
            String trafficType, String body,
            Map<String, String> headers) {
        TrafficEvent event = new TrafficEvent();
        event.setRequestId(requestId != null ? requestId : UUID.randomUUID().toString());
        event.setTenantId(tenantId != null ? tenantId : "default");
        event.setTrafficType(trafficType);
        event.setResponseBody(body);
        event.setResponseHeaders(headers);
        event.setIngestionMode("reverse-proxy");
        event.setTimestamp(Instant.now());
        event.setEndpoint(headers.getOrDefault("x-original-uri", "/unknown"));
        event.setMethod(headers.getOrDefault("x-original-method", "GET"));
        return event;
    }
}
