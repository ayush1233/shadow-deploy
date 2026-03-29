package com.shadow.platform.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantAccessTest {

    @Test
    void requireTenantIdReturnsRequestTenant() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        assertThat(TenantAccess.requireTenantId(request)).isEqualTo("team-a");
    }

    @Test
    void requireTenantIdRejectsMissingTenant() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> TenantAccess.requireTenantId(request));

        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void validateTenantOverrideRejectsCrossTenantRequests() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> TenantAccess.validateTenantOverride("team-b", "team-a"));

        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
