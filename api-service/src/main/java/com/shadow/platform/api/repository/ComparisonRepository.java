package com.shadow.platform.api.repository;

import com.shadow.platform.api.model.ComparisonResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComparisonRepository extends JpaRepository<ComparisonResultEntity, String>, JpaSpecificationExecutor<ComparisonResultEntity> {

    Optional<ComparisonResultEntity> findByRequestIdAndTenantId(String requestId, String tenantId);

    @Query("SELECT COUNT(c) FROM ComparisonResultEntity c WHERE c.timestamp >= :since")
    long countRequestsSince(@Param("since") Instant since);

    @Query("SELECT COUNT(c) FROM ComparisonResultEntity c WHERE c.timestamp >= :since AND c.deterministicPass = false")
    long countMismatchesSince(@Param("since") Instant since);

    @Query("SELECT AVG(c.riskScore) FROM ComparisonResultEntity c WHERE c.timestamp >= :since AND c.riskScore IS NOT NULL")
    Double averageRiskScoreSince(@Param("since") Instant since);

    @Query("SELECT AVG(c.prodResponseTimeMs) FROM ComparisonResultEntity c WHERE c.timestamp >= :since")
    Double averageProdLatencySince(@Param("since") Instant since);

    @Query("SELECT AVG(c.shadowResponseTimeMs) FROM ComparisonResultEntity c WHERE c.timestamp >= :since")
    Double averageShadowLatencySince(@Param("since") Instant since);
    
    @Query("SELECT c.severity AS severity, COUNT(c) AS count FROM ComparisonResultEntity c WHERE c.timestamp >= :since AND c.severity IS NOT NULL GROUP BY c.severity")
    List<Map<String, Object>> getSeverityBreakdownSince(@Param("since") Instant since);

    @Query("SELECT c.endpoint AS endpoint, COUNT(c) AS total, " +
           "SUM(CASE WHEN c.deterministicPass = false THEN 1 ELSE 0 END) AS mismatches " +
           "FROM ComparisonResultEntity c WHERE c.timestamp >= :since AND c.endpoint IS NOT NULL " +
           "GROUP BY c.endpoint ORDER BY mismatches DESC")
    List<Map<String, Object>> getTopEndpointsSince(@Param("since") Instant since);

    @Query("SELECT c.latencyDeltaMs FROM ComparisonResultEntity c WHERE c.timestamp >= :since AND c.latencyDeltaMs IS NOT NULL ORDER BY c.latencyDeltaMs")
    List<Long> getLatencyDeltasSince(@Param("since") Instant since);

    @Query("SELECT COUNT(c) FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since")
    long countRequestsSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT COUNT(c) FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since AND c.deterministicPass = false")
    long countMismatchesSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT AVG(c.riskScore) FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since AND c.riskScore IS NOT NULL")
    Double averageRiskScoreSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT AVG(c.prodResponseTimeMs) FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since")
    Double averageProdLatencySinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT AVG(c.shadowResponseTimeMs) FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since")
    Double averageShadowLatencySinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT c.severity AS severity, COUNT(c) AS count FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since AND c.severity IS NOT NULL GROUP BY c.severity")
    List<Map<String, Object>> getSeverityBreakdownSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT c.endpoint AS endpoint, COUNT(c) AS total, " +
           "SUM(CASE WHEN c.deterministicPass = false THEN 1 ELSE 0 END) AS mismatches " +
           "FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since AND c.endpoint IS NOT NULL " +
           "GROUP BY c.endpoint ORDER BY mismatches DESC")
    List<Map<String, Object>> getTopEndpointsSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT c.latencyDeltaMs FROM ComparisonResultEntity c WHERE c.tenantId = :tenantId AND c.timestamp >= :since AND c.latencyDeltaMs IS NOT NULL ORDER BY c.latencyDeltaMs")
    List<Long> getLatencyDeltasSinceForTenant(@Param("tenantId") String tenantId, @Param("since") Instant since);
}
