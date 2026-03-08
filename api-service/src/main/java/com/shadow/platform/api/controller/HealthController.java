package com.shadow.platform.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    @GetMapping("/all")
    public ResponseEntity<?> checkAllHealth() {
        Map<String, Object> results = new LinkedHashMap<>();
        int healthyCount = 0;
        int totalServices = 3;

        // Check Ingestion Service
        Map<String, Object> ingestionStatus = checkService("http://ingestion-service:8081/actuator/health");
        results.put("ingestion-service", ingestionStatus);
        if ("healthy".equals(ingestionStatus.get("status")))
            healthyCount++;

        // Check Comparison Engine
        Map<String, Object> comparisonStatus = checkService("http://comparison-engine:8082/actuator/health");
        results.put("comparison-engine", comparisonStatus);
        if ("healthy".equals(comparisonStatus.get("status")))
            healthyCount++;

        // Check AI Service
        Map<String, Object> aiStatus = checkService("http://ai-service:8000/health");
        results.put("ai-service", aiStatus);
        if ("healthy".equals(aiStatus.get("status")))
            healthyCount++;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", healthyCount == totalServices ? "UP" : "DEGRADED");
        response.put("healthy_services", healthyCount + "/" + totalServices);
        response.put("services", results);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> checkService(String url) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                result.put("status", "healthy");
                result.put("code", response.statusCode());
            } else {
                result.put("status", "unhealthy");
                result.put("code", response.statusCode());
            }
        } catch (Exception e) {
            // Check fallback for local dev
            try {
                String localUrl = url.replace("ingestion-service", "localhost")
                        .replace("comparison-engine", "localhost")
                        .replace("ai-service", "localhost");
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(localUrl))
                        .GET()
                        .build();
                HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() >= 200 && response.statusCode() < 400) {
                    result.put("status", "healthy");
                    result.put("code", response.statusCode());
                } else {
                    result.put("status", "unhealthy");
                    result.put("code", response.statusCode());
                }
            } catch (Exception ignored) {
                result.put("status", "unreachable");
                result.put("error", e.getMessage());
            }
        }
        return result;
    }
}
