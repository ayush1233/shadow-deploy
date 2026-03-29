package com.shadow.platform.ingestion.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

/**
 * Validates API keys by looking up SHA-256(key) in Redis.
 * Redis key pattern: apikey:{sha256hash} -> {tenantId}:{scopes}
 *
 * For internal NGINX traffic (X-Traffic-Type header), validates
 * a shared secret to prevent external bypass.
 */
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthFilter.class);
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String REDIS_KEY_PREFIX = "apikey:";

    private final StringRedisTemplate redisTemplate;
    private final String internalSecret;

    public ApiKeyAuthFilter(
            StringRedisTemplate redisTemplate,
            @Value("${shadow.security.internal-secret:shadow-internal-dev-secret}") String internalSecret
    ) {
        this.redisTemplate = redisTemplate;
        this.internalSecret = internalSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            // Check for internal traffic from NGINX proxy
            String trafficType = request.getHeader("X-Traffic-Type");
            if (trafficType != null) {
                // Validate shared secret to prevent external bypass
                String secret = request.getHeader("X-Internal-Secret");
                if (secret == null || !secret.equals(internalSecret)) {
                    log.warn("Internal traffic request with invalid/missing shared secret from IP: {}",
                            request.getRemoteAddr());
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Invalid internal secret\"}");
                    return;
                }

                String tenantId = request.getHeader(TENANT_HEADER);
                if (tenantId == null || tenantId.isBlank()) tenantId = "default";
                setAuthentication(tenantId);
                request.setAttribute("tenant_id", tenantId);
                filterChain.doFilter(request, response);
                return;
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing API key\",\"message\":\"Include X-API-Key header\"}");
            return;
        }

        // Validate API key via Redis
        String keyHash = sha256(apiKey);
        String redisKey = REDIS_KEY_PREFIX + keyHash;
        String value = redisTemplate.opsForValue().get(redisKey);

        if (value == null) {
            log.warn("Invalid API key attempt from IP: {}", request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid API key\"}");
            return;
        }

        // value format: tenantId:scopes
        String[] parts = value.split(":", 2);
        String tenantId = parts[0];

        setAuthentication(tenantId);
        request.setAttribute("tenant_id", tenantId);
        if (parts.length > 1) {
            request.setAttribute("scopes", parts[1]);
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(String tenantId) {
        var auth = new UsernamePasswordAuthenticationToken(
            tenantId, null, List.of(new SimpleGrantedAuthority("ROLE_TENANT"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/health")
                || path.equals("/api/v1/ingest/health");
    }
}
