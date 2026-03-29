package com.shadow.platform.api.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class TenantAccess {

    private TenantAccess() {
    }

    public static String requireTenantId(HttpServletRequest request) {
        Object tenant = request.getAttribute("tenant_id");
        if (tenant instanceof String tenantId && !tenantId.isBlank()) {
            return tenantId;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
    }

    public static void validateTenantOverride(String requestedTenantId, String authenticatedTenantId) {
        if (requestedTenantId != null &&
                !requestedTenantId.isBlank() &&
                !requestedTenantId.equals(authenticatedTenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant access is not allowed");
        }
    }
}
