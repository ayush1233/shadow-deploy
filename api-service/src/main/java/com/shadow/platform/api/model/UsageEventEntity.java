package com.shadow.platform.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Entity
@Table(name = "usage_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column
    private String endpoint;

    @Column(nullable = false)
    private Integer count;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = Instant.now();
        if (count == null) count = 1;
    }
}
