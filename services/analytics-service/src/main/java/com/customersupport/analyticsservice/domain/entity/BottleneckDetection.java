package com.customersupport.analyticsservice.domain.entity;

import com.customersupport.analyticsservice.domain.enums.BottleneckSeverity;
import com.customersupport.analyticsservice.domain.enums.BottleneckType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bottleneck_detection")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BottleneckDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @CreationTimestamp
    @Column(name = "detected_at", nullable = false, updatable = false)
    private OffsetDateTime detectedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "bottleneck_type", nullable = false, length = 50)
    private BottleneckType bottleneckType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "affected_entity_type", length = 50)
    private String affectedEntityType;

    @Column(name = "affected_entity_id")
    private UUID affectedEntityId;

    @Column(name = "metric_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal metricValue;

    @Column(name = "threshold_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal thresholdValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BottleneckSeverity severity;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @PrePersist
    void prePersist() {
        if (isResolved == null) isResolved = false;
    }
}
