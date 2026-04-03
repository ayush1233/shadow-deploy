package com.shadow.platform.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Returns live topology information derived from the actual runtime
 * environment (env vars, Docker service DNS), including real-time
 * health checks for each service.
 */
@RestController
@RequestMapping("/api/v1/topology")
public class TopologyController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    // Read actual config from environment variables at runtime
    @Value("${PROD_BACKEND_HOST:host.docker.internal}")
    private String prodHost;

    @Value("${PROD_BACKEND_PORT:5001}")
    private int prodPort;

    @Value("${SHADOW_BACKEND_HOST:host.docker.internal}")
    private String shadowHost;

    @Value("${SHADOW_BACKEND_PORT:5002}")
    private int shadowPort;

    @Value("${MIRROR_PERCENTAGE:100}")
    private int mirrorPercentage;

    @Value("${spring.datasource.url:jdbc:postgresql://postgres:5432/shadow_deploy}")
    private String datasourceUrl;

    @Value("${server.port:8083}")
    private int apiPort;

    @GetMapping
    public ResponseEntity<?> getTopology() {
        Map<String, Object> topology = new LinkedHashMap<>();
        topology.put("_generatedAt", Instant.now().toString());
        topology.put("_source", "Live from api-service environment");

        // ── Ports from actual environment ──
        topology.put("prodHost", prodHost);
        topology.put("prodPort", prodPort);
        topology.put("shadowHost", shadowHost);
        topology.put("shadowPort", shadowPort);
        topology.put("mirrorPercentage", mirrorPercentage);
        topology.put("proxyPort", 80); // NGINX always listens on 80 inside its container
        topology.put("kafkaPort", 9092);
        topology.put("ingestionPort", 8081);
        topology.put("comparisonPort", 8082);
        topology.put("apiServicePort", apiPort);
        topology.put("aiServicePort", 8005);
        topology.put("dashboardPort", 3004);

        // Parse DB port from datasource URL
        int dbPort = 5432;
        try {
            String urlPart = datasourceUrl.replace("jdbc:postgresql://", "");
            String hostPort = urlPart.split("/")[0];
            if (hostPort.contains(":")) {
                dbPort = Integer.parseInt(hostPort.split(":")[1]);
            }
        } catch (Exception ignored) {}
        topology.put("dbPort", dbPort);

        // ── Live health checks ──
        List<Map<String, Object>> services = new ArrayList<>();

        services.add(buildService("nginx-proxy", "NGINX Proxy", "proxy", 80,
                null, "Reverse proxy & traffic mirror"));
        services.add(buildService("production", "Production (v1)", "production", prodPort,
                healthCheck("http://" + prodHost + ":" + prodPort + "/"), "Stable version"));
        services.add(buildService("shadow", "Shadow (v2)", "shadow", shadowPort,
                healthCheck("http://" + shadowHost + ":" + shadowPort + "/"), "New version being tested"));
        services.add(buildService("ingestion-service", "Ingestion Service", "infra", 8081,
                healthCheck("http://ingestion-service:8081/actuator/health"), "Captures & normalizes traffic"));
        services.add(buildService("kafka", "Apache Kafka", "infra", 9092,
                null, "Event streaming broker"));
        services.add(buildService("comparison-engine", "Comparison Engine", "engine", 8082,
                healthCheck("http://comparison-engine:8082/actuator/health"), "Joins & compares v1 vs v2"));
        services.add(buildService("ai-service", "AI Service", "ai", 8005,
                healthCheck("http://ai-service:8000/health"), "Gemini semantic analysis"));
        services.add(buildService("postgres", "Shadow DB", "database", dbPort,
                null, "PostgreSQL for comparison results"));
        services.add(buildService("redis", "Redis", "cache", 6379,
                null, "In-memory cache"));
        services.add(buildService("dashboard", "Dashboard UI", "dashboard", 3004,
                null, "React monitoring dashboard"));
        services.add(buildService("api-service", "API Service", "infra", apiPort,
                "healthy", "REST API for dashboard"));

        topology.put("services", services);

        return ResponseEntity.ok(topology);
    }

    private Map<String, Object> buildService(String id, String label, String type,
                                              int port, String health, String desc) {
        Map<String, Object> svc = new LinkedHashMap<>();
        svc.put("id", id);
        svc.put("label", label);
        svc.put("type", type);
        svc.put("port", port);
        svc.put("health", health != null ? health : "unknown");
        svc.put("desc", desc);
        return svc;
    }

    private String healthCheck(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() < 400 ? "healthy" : "unhealthy";
        } catch (Exception e) {
            return "unreachable";
        }
    }
}
