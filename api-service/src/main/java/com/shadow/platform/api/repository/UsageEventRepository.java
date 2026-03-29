package com.shadow.platform.api.repository;

import com.shadow.platform.api.model.UsageEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Repository
public interface UsageEventRepository extends JpaRepository<UsageEventEntity, Long> {

    @Query("SELECT u.eventType AS eventType, SUM(u.count) AS total " +
           "FROM UsageEventEntity u " +
           "WHERE u.tenantId = :tenantId AND u.recordedAt >= :since " +
           "GROUP BY u.eventType")
    List<Map<String, Object>> getUsageSummary(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT SUM(u.count) FROM UsageEventEntity u " +
           "WHERE u.tenantId = :tenantId AND u.eventType = :eventType AND u.recordedAt >= :since")
    Long countByTenantAndType(@Param("tenantId") String tenantId,
                              @Param("eventType") String eventType,
                              @Param("since") Instant since);
}
