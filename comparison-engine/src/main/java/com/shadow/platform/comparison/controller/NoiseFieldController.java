package com.shadow.platform.comparison.controller;

import com.shadow.platform.comparison.service.NoiseDetectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API for managing noise detection fields.
 * Allows users to view, add, and remove ignored fields
 * without restarting the comparison engine.
 */
@RestController
@RequestMapping("/api/v1/noise-fields")
@CrossOrigin(origins = "*")
public class NoiseFieldController {

    private final NoiseDetectionService noiseDetectionService;

    public NoiseFieldController(NoiseDetectionService noiseDetectionService) {
        this.noiseDetectionService = noiseDetectionService;
    }

    /**
     * GET /api/v1/noise-fields
     * Lists all manually configured noise fields.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getManualFields() {
        Set<String> fields = noiseDetectionService.getManualNoiseFields();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("type", "manual");
        response.put("fields", fields);
        response.put("count", fields.size());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/noise-fields/auto?tenant=X&endpoint=/api/users
     * Lists auto-detected noisy fields for a given endpoint.
     */
    @GetMapping("/auto")
    public ResponseEntity<Map<String, Object>> getAutoDetectedFields(
            @RequestParam(defaultValue = "default") String tenant,
            @RequestParam String endpoint) {

        Set<String> fields = noiseDetectionService.getAutoDetectedFields(tenant, endpoint);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("type", "auto-detected");
        response.put("tenant", tenant);
        response.put("endpoint", endpoint);
        response.put("fields", fields);
        response.put("count", fields.size());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/noise-fields/all?tenant=X&endpoint=/api/users
     * Lists all noisy fields (manual + auto) merged.
     */
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllFields(
            @RequestParam(defaultValue = "default") String tenant,
            @RequestParam String endpoint) {

        Set<String> combined = noiseDetectionService.getNoisyFields(tenant, endpoint);
        Set<String> manual = noiseDetectionService.getManualNoiseFields();
        Set<String> auto = noiseDetectionService.getAutoDetectedFields(tenant, endpoint);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("manual_fields", manual);
        response.put("auto_detected_fields", auto);
        response.put("combined_fields", combined);
        response.put("total_count", combined.size());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/noise-fields
     * Body: { "field": "/timestamp" }
     * Adds a field to the manual noise list.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> addField(@RequestBody Map<String, String> body) {
        String field = body.get("field");
        if (field == null || field.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Field name is required",
                    "example", Map.of("field", "/timestamp")));
        }
        noiseDetectionService.addManualNoiseField(field);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "added");
        response.put("field", field);
        response.put("all_manual_fields", noiseDetectionService.getManualNoiseFields());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/noise-fields/{field}
     * Removes a field from the manual noise list.
     */
    @DeleteMapping("/{field}")
    public ResponseEntity<Map<String, Object>> removeField(@PathVariable String field) {
        noiseDetectionService.removeManualNoiseField(field);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "removed");
        response.put("field", field);
        response.put("remaining_fields", noiseDetectionService.getManualNoiseFields());
        return ResponseEntity.ok(response);
    }
}
