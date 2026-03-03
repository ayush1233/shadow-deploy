package com.shadow.platform.ingestion.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantFilter.class);
    public static final String TENANT_CONTEXT_KEY = "tenant_id";

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = (String) request.getAttribute(TENANT_CONTEXT_KEY);
            if (tenantId == null) {
                tenantId = request.getHeader("X-Tenant-ID");
            }
            if (tenantId == null) {
                tenantId = "default";
            }

            CURRENT_TENANT.set(tenantId);
            MDC.put(TENANT_CONTEXT_KEY, tenantId);

            filterChain.doFilter(request, response);
        } finally {
            CURRENT_TENANT.remove();
            MDC.remove(TENANT_CONTEXT_KEY);
        }
    }

    public static String getCurrentTenant() {
        String tenant = CURRENT_TENANT.get();
        return tenant != null ? tenant : "default";
    }
}
