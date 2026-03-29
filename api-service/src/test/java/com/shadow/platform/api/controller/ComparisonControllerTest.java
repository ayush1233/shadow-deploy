package com.shadow.platform.api.controller;

import com.shadow.platform.api.model.ComparisonResultEntity;
import com.shadow.platform.api.repository.ComparisonRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComparisonControllerTest {

    @Mock
    private ComparisonRepository comparisonRepository;

    @InjectMocks
    private ComparisonController comparisonController;

    @Test
    void getComparisonUsesAuthenticatedTenant() {
        ComparisonResultEntity entity = ComparisonResultEntity.builder()
                .requestId("req-1")
                .tenantId("team-a")
                .endpoint("/api/users")
                .method("GET")
                .timestamp(Instant.parse("2026-03-26T00:00:00Z"))
                .prodStatusCode(200)
                .shadowStatusCode(200)
                .build();

        when(comparisonRepository.findByRequestIdAndTenantId("req-1", "team-a"))
                .thenReturn(Optional.of(entity));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        ResponseEntity<?> response = comparisonController.getComparison("req-1", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(comparisonRepository).findByRequestIdAndTenantId("req-1", "team-a");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("tenant_id", "team-a");
        assertThat(body).containsEntry("request_id", "req-1");
    }

    @Test
    void getComparisonReturnsNotFoundWhenTenantCannotAccessRecord() {
        when(comparisonRepository.findByRequestIdAndTenantId("req-1", "team-a"))
                .thenReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        ResponseEntity<?> response = comparisonController.getComparison("req-1", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void listComparisonsAlwaysAddsTenantPredicate() {
        when(comparisonRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(Page.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("tenant_id", "team-a");

        comparisonController.listComparisons(0, 20, null, null, null, null, request);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Specification<ComparisonResultEntity>> specCaptor = ArgumentCaptor.forClass((Class) Specification.class);
        verify(comparisonRepository).findAll(specCaptor.capture(), any(org.springframework.data.domain.Pageable.class));

        Specification<ComparisonResultEntity> specification = specCaptor.getValue();
        @SuppressWarnings("unchecked")
        Root<ComparisonResultEntity> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder criteriaBuilder = mock(CriteriaBuilder.class);
        @SuppressWarnings("unchecked")
        Path<Object> tenantPath = mock(Path.class);
        Predicate tenantPredicate = mock(Predicate.class);
        Predicate combinedPredicate = mock(Predicate.class);

        when(root.get("tenantId")).thenReturn((Path) tenantPath);
        when(criteriaBuilder.equal(tenantPath, "team-a")).thenReturn(tenantPredicate);
        when(criteriaBuilder.and(any(Predicate[].class))).thenReturn(combinedPredicate);

        specification.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder).equal(tenantPath, "team-a");
    }
}
