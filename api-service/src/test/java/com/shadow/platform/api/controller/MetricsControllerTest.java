package com.shadow.platform.api.controller;

import com.shadow.platform.api.repository.ComparisonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MetricsControllerTest {

    @Mock
    private ComparisonRepository comparisonRepository;

    @InjectMocks
    private MetricsController metricsController;

    @Test
    void getMetricsSummaryUsesAuthenticatedTenant() {
        when(comparisonRepository.countRequestsSinceForTenant(eq("team-a"), any(Instant.class))).thenReturn(10L);
        when(comparisonRepository.countMismatchesSinceForTenant(eq("team-a"), any(Instant.class))).thenReturn(2L);
        when(comparisonRepository.averageRiskScoreSinceForTenant(eq("team-a"), any(Instant.class))).thenReturn(3.4);
        when(comparisonRepository.averageProdLatencySinceForTenant(eq("team-a"), any(Instant.class))).thenReturn(42.0);
        when(comparisonRepository.averageShadowLatencySinceForTenant(eq("team-a"), any(Instant.class))).thenReturn(55.0);
        when(comparisonRepository.getSeverityBreakdownSinceForTenant(eq("team-a"), any(Instant.class)))
                .thenReturn(List.of(Map.of("severity", "high", "count", 2L)));
        when(comparisonRepository.getTopEndpointsSinceForTenant(eq("team-a"), any(Instant.class)))
                .thenReturn(List.of(Map.of("endpoint", "/api/users", "total", 10L, "mismatches", 2L)));
        when(comparisonRepository.getLatencyDeltasSinceForTenant(eq("team-a"), any(Instant.class)))
                .thenReturn(List.of(10L, 20L, 30L));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        ResponseEntity<?> response = metricsController.getMetricsSummary(request, null, "1h");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(comparisonRepository).countRequestsSinceForTenant(eq("team-a"), any(Instant.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("tenant_id", "team-a");
        assertThat(body).containsEntry("time_range", "1h");
    }

    @Test
    void getMetricsSummaryRejectsCrossTenantOverride() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> metricsController.getMetricsSummary(request, "team-b", "1h"));

        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(comparisonRepository);
    }
}
