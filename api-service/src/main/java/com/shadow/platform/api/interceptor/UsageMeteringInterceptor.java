package com.shadow.platform.api.interceptor;

import com.shadow.platform.api.service.UsageMeteringService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Records an 'api_call' usage event for every authenticated API request.
 * Fires asynchronously after the response is committed.
 */
@Component
public class UsageMeteringInterceptor implements HandlerInterceptor {

    private final UsageMeteringService meteringService;

    public UsageMeteringInterceptor(UsageMeteringService meteringService) {
        this.meteringService = meteringService;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        String tenantId = (String) request.getAttribute("tenant_id");
        if (tenantId == null || tenantId.isBlank()) {
            return; // unauthenticated request (e.g. /health), skip metering
        }

        String endpoint = request.getRequestURI();
        meteringService.recordEvent(tenantId, "api_call", endpoint);
    }
}
