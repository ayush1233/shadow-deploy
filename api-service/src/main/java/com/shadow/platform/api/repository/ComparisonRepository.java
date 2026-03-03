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

@Repository
public interface ComparisonRepository extends JpaRepository<ComparisonResultEntity, String>, JpaSpecificationExecutor<ComparisonResultEntity> {

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
}
