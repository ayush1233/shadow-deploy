package com.shadow.platform.api.service;

import com.shadow.platform.api.model.UsageEventEntity;
import com.shadow.platform.api.repository.UsageEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Records usage events per tenant for billing/metering.
 * Events are written asynchronously to avoid impacting request latency.
 */
@Service
public class UsageMeteringService {

    private static final Logger log = LoggerFactory.getLogger(UsageMeteringService.class);

    private final UsageEventRepository usageEventRepository;

    public UsageMeteringService(UsageEventRepository usageEventRepository) {
        this.usageEventRepository = usageEventRepository;
    }

    @Async
    public void recordEvent(String tenantId, String eventType, String endpoint) {
        try {
            UsageEventEntity event = UsageEventEntity.builder()
                    .tenantId(tenantId)
                    .eventType(eventType)
                    .endpoint(endpoint)
                    .count(1)
                    .recordedAt(Instant.now())
                    .build();
            usageEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record usage event for tenant={}, type={}: {}",
                    tenantId, eventType, e.getMessage());
        }
    }

    @Async
    public void recordBatchEvent(String tenantId, String eventType, int count) {
        try {
            UsageEventEntity event = UsageEventEntity.builder()
                    .tenantId(tenantId)
                    .eventType(eventType)
                    .count(count)
                    .recordedAt(Instant.now())
                    .build();
            usageEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to record batch usage event for tenant={}: {}", tenantId, e.getMessage());
        }
    }
}
