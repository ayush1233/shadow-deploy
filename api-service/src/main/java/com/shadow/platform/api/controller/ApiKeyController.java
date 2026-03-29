package com.shadow.platform.api.controller;

import com.shadow.platform.api.model.ApiKeyEntity;
import com.shadow.platform.api.repository.ApiKeyRepository;
import com.shadow.platform.api.security.JwtTokenProvider;
import com.shadow.platform.api.security.TenantAccess;
import com.shadow.platform.api.service.ApiKeySyncService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/api-keys")
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;
    private final JwtTokenProvider tokenProvider;
    private final ApiKeySyncService apiKeySyncService;

    public ApiKeyController(ApiKeyRepository apiKeyRepository,
                            JwtTokenProvider tokenProvider,
                            ApiKeySyncService apiKeySyncService) {
        this.apiKeyRepository = apiKeyRepository;
        this.tokenProvider = tokenProvider;
        this.apiKeySyncService = apiKeySyncService;
    }

    @GetMapping
    public ResponseEntity<?> listKeys(HttpServletRequest request) {
        String tenantId = TenantAccess.requireTenantId(request);

        List<Map<String, Object>> keys = apiKeyRepository.findByTenantId(tenantId).stream()
                .map(k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", k.getId());
                    m.put("name", k.getName());
                    m.put("key_prefix", k.getKeyPrefix());
                    m.put("scopes", k.getScopes());
                    m.put("is_active", k.getIsActive());
                    m.put("last_used_at", k.getLastUsedAt() != null ? k.getLastUsedAt().toString() : null);
                    m.put("expires_at", k.getExpiresAt() != null ? k.getExpiresAt().toString() : null);
                    m.put("created_at", k.getCreatedAt().toString());
                    m.put("created_by", k.getCreatedBy());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("api_keys", keys));
    }

    @PostMapping
    public ResponseEntity<?> createKey(@RequestBody Map<String, String> body,
                                       HttpServletRequest request) {
        String role = tokenProvider.getRoleFromRequest(request);
        if (!"admin".equals(role) && !"editor".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only admins and editors can create API keys"));
        }

        String tenantId = TenantAccess.requireTenantId(request);
        String name = body.get("name");
        String scopes = body.getOrDefault("scopes", "ingest");
        String expiresIn = body.get("expires_in_days");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "API key name is required"));
        }

        // Generate a secure random API key
        String rawKey = generateApiKey();
        String keyHash = sha256(rawKey);
        String keyPrefix = rawKey.substring(0, 12);

        Instant expiresAt = null;
        if (expiresIn != null && !expiresIn.isBlank()) {
            try {
                expiresAt = Instant.now().plusSeconds(Long.parseLong(expiresIn) * 86400);
            } catch (NumberFormatException ignored) {}
        }

        String username = tokenProvider.getUsernameFromRequest(request);

        ApiKeyEntity key = ApiKeyEntity.builder()
                .keyHash(keyHash)
                .keyPrefix(keyPrefix)
                .name(name)
                .tenantId(tenantId)
                .scopes(scopes)
                .isActive(true)
                .expiresAt(expiresAt)
                .createdBy(username)
                .build();

        apiKeyRepository.save(key);

        // Sync to Redis for ingestion service
        apiKeySyncService.syncKeyToRedis(keyHash, tenantId, scopes);

        // Return the raw key ONCE - it cannot be retrieved again
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", key.getId());
        response.put("key", rawKey);
        response.put("name", name);
        response.put("tenant_id", tenantId);
        response.put("scopes", scopes);
        response.put("expires_at", expiresAt != null ? expiresAt.toString() : null);
        response.put("warning", "Store this key securely. It cannot be retrieved again.");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> revokeKey(@PathVariable Long id, HttpServletRequest request) {
        String role = tokenProvider.getRoleFromRequest(request);
        if (!"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only admins can revoke API keys"));
        }

        String tenantId = TenantAccess.requireTenantId(request);
        var keyOpt = apiKeyRepository.findById(id);
        if (keyOpt.isEmpty() || !keyOpt.get().getTenantId().equals(tenantId)) {
            return ResponseEntity.notFound().build();
        }

        ApiKeyEntity key = keyOpt.get();
        key.setIsActive(false);
        apiKeyRepository.save(key);

        // Remove from Redis
        apiKeySyncService.removeKeyFromRedis(key.getKeyHash());

        return ResponseEntity.ok(Map.of("message", "API key revoked", "id", id));
    }

    private String generateApiKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String hex = bytesToHex(bytes);
        return "sk-sha-" + hex.substring(0, 40);
    }

    static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
