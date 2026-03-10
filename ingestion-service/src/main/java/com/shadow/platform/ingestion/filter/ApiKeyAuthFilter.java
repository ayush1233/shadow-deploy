package com.shadow.platform.ingestion.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthFilter.class);
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final Map<String, String> apiKeyToTenant = new ConcurrentHashMap<>();

    public ApiKeyAuthFilter(
        @Value("#{${shadow.security.api-keys:{}}}") List<Map<String, String>> apiKeys
    ) {
        if (apiKeys != null) {
            for (Map<String, String> entry : apiKeys) {
                String key = entry.get("key");
                String tenantId = entry.get("tenant-id");
                if (key != null && tenantId != null) {
                    apiKeyToTenant.put(key, tenantId);
                }
            }
        }
        // Dev-only default keys — configure real keys via shadow.security.api-keys in production
        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (profile == null || !profile.contains("prod")) {
            apiKeyToTenant.putIfAbsent("sk-shadow-default-key-change-me", "default");
            apiKeyToTenant.putIfAbsent("sk-shadow-demo-key-change-me", "demo");
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            // Check for internal traffic (from NGINX proxy)
            String internalHeader = request.getHeader("X-Traffic-Type");
            if (internalHeader != null) {
                String tenantId = request.getHeader(TENANT_HEADER);
                if (tenantId == null || tenantId.isBlank()) tenantId = "default";
                setAuthentication(tenantId);
                filterChain.doFilter(request, response);
                return;
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing API key\",\"message\":\"Include X-API-Key header\"}");
            return;
        }

        String tenantId = apiKeyToTenant.get(apiKey);
        if (tenantId == null) {
            log.warn("Invalid API key attempt from IP: {}", request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid API key\"}");
            return;
        }

        setAuthentication(tenantId);
        request.setAttribute("tenant_id", tenantId);
        filterChain.doFilter(request, response);
    }

    private void setAuthentication(String tenantId) {
        var auth = new UsernamePasswordAuthenticationToken(
            tenantId, null, List.of(new SimpleGrantedAuthority("ROLE_TENANT"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/health")
                || path.equals("/api/v1/ingest/health");
    }
}
