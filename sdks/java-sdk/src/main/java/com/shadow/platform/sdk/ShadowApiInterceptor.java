package com.shadow.platform.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Shadow API Java SDK — Spring Boot Integration
 *
 * Intercepts HTTP requests and responses asynchronously,
 * forwards them to the Shadow API ingestion service with
 * minimal performance impact.
 *
 * Usage with Spring Boot:
 * 
 * @Bean
 *       public ShadowApiInterceptor shadowInterceptor() {
 *       return ShadowApiInterceptor.builder()
 *       .ingestionUrl("http://shadow-proxy:8080/ingest/event")
 *       .apiKey("sk-shadow-your-key")
 *       .tenantId("your-tenant")
 *       .build();
 *       }
 *
 * @Bean
 *       public FilterRegistrationBean<ShadowApiFilter>
 *       shadowFilter(ShadowApiInterceptor interceptor) {
 *       FilterRegistrationBean<ShadowApiFilter> bean = new
 *       FilterRegistrationBean<>();
 *       bean.setFilter(new ShadowApiFilter(interceptor));
 *       bean.addUrlPatterns("/api/*");
 *       return bean;
 *       }
 */
public class ShadowApiInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ShadowApiInterceptor.class);

    private final String ingestionUrl;
    private final String apiKey;
    private final String tenantId;
    private final String trafficType;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor;
    private final BlockingQueue<Map<String, Object>> eventQueue;
    private final int batchSize;
    private final Duration flushInterval;
    private volatile boolean running = true;

    private ShadowApiInterceptor(Builder builder) {
        this.ingestionUrl = builder.ingestionUrl;
        this.apiKey = builder.apiKey;
        this.tenantId = builder.tenantId;
        this.trafficType = builder.trafficType;
        this.batchSize = builder.batchSize;
        this.flushInterval = builder.flushInterval;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
        this.eventQueue = new LinkedBlockingQueue<>(10000);

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .executor(Executors.newFixedThreadPool(2))
                .build();

        this.executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "shadow-sdk-flusher");
            t.setDaemon(true);
            return t;
        });

        // Start background flusher
        this.executor.submit(this::flushLoop);
        log.info("Shadow API SDK initialized [ingestion={}, tenant={}]", ingestionUrl, tenantId);
    }

    /**
     * Capture a request/response pair asynchronously.
     * Non-blocking — always returns immediately.
     */
    public void capture(String requestId, String method, String endpoint,
            Map<String, String> requestHeaders, String requestBody,
            int responseStatus, Map<String, String> responseHeaders,
            String responseBody, long responseTimeMs) {
        Map<String, Object> event = new HashMap<>();
        event.put("request_id", requestId != null ? requestId : UUID.randomUUID().toString());
        event.put("tenant_id", tenantId);
        event.put("timestamp", Instant.now().toString());
        event.put("traffic_type", trafficType);
        event.put("method", method);
        event.put("endpoint", endpoint);
        event.put("request_headers", requestHeaders);
        event.put("request_body", requestBody);
        event.put("response_status", responseStatus);
        event.put("response_headers", responseHeaders);
        event.put("response_body", responseBody);
        event.put("response_time_ms", responseTimeMs);
        event.put("ingestion_mode", "sdk-java");

        if (!eventQueue.offer(event)) {
            log.warn("Shadow SDK event queue full — dropping event [request_id={}]", requestId);
        }
    }

    private void flushLoop() {
        List<Map<String, Object>> batch = new ArrayList<>();
        while (running) {
            try {
                Map<String, Object> event = eventQueue.poll(flushInterval.toMillis(), TimeUnit.MILLISECONDS);
                if (event != null) {
                    batch.add(event);
                    eventQueue.drainTo(batch, batchSize - 1);
                }

                if (!batch.isEmpty()) {
                    sendBatch(batch);
                    batch.clear();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Shadow SDK flush error: {}", e.getMessage());
                batch.clear();
            }
        }
    }

    private void sendBatch(List<Map<String, Object>> batch) {
        try {
            String body = objectMapper.writeValueAsString(batch);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ingestionUrl.replace("/event", "/batch")))
                    .header("Content-Type", "application/json")
                    .header("X-API-Key", apiKey)
                    .header("X-Tenant-ID", tenantId)
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(resp -> {
                        if (resp.statusCode() >= 400) {
                            log.warn("Shadow SDK batch send failed [status={}, count={}]",
                                    resp.statusCode(), batch.size());
                        } else {
                            log.debug("Shadow SDK batch sent [count={}]", batch.size());
                        }
                    })
                    .exceptionally(ex -> {
                        log.warn("Shadow SDK batch send error: {}", ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            log.error("Shadow SDK serialization error: {}", e.getMessage());
        }
    }

    public void shutdown() {
        running = false;
        executor.shutdown();
        log.info("Shadow API SDK shutdown");
    }

    // ── Builder ──

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String ingestionUrl = "http://localhost:8080/ingest/event";
        private String apiKey = "";
        private String tenantId = "default";
        private String trafficType = "production";
        private int batchSize = 50;
        private Duration flushInterval = Duration.ofSeconds(5);

        public Builder ingestionUrl(String url) {
            this.ingestionUrl = url;
            return this;
        }

        public Builder apiKey(String key) {
            this.apiKey = key;
            return this;
        }

        public Builder tenantId(String id) {
            this.tenantId = id;
            return this;
        }

        public Builder trafficType(String type) {
            this.trafficType = type;
            return this;
        }

        public Builder batchSize(int size) {
            this.batchSize = size;
            return this;
        }

        public Builder flushInterval(Duration interval) {
            this.flushInterval = interval;
            return this;
        }

        public ShadowApiInterceptor build() {
            return new ShadowApiInterceptor(this);
        }
    }
}
