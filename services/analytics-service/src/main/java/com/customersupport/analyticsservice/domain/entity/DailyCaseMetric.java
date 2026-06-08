package com.customersupport.analyticsservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "daily_case_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCaseMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "metric_date", nullable = false, unique = true)
    private LocalDate metricDate;

    @Column(name = "total_created",   nullable = false) private Integer totalCreated;
    @Column(name = "total_resolved",  nullable = false) private Integer totalResolved;
    @Column(name = "total_escalated", nullable = false) private Integer totalEscalated;
    @Column(name = "total_reopened",  nullable = false) private Integer totalReopened;
    @Column(name = "auto_resolved",   nullable = false) private Integer autoResolved;

    @Column(name = "avg_first_response_minutes", precision = 10, scale = 2)
    private BigDecimal avgFirstResponseMinutes;

    @Column(name = "avg_resolution_minutes", precision = 10, scale = 2)
    private BigDecimal avgResolutionMinutes;

    @Column(name = "sla_compliance_rate", precision = 5, scale = 2)
    private BigDecimal slaComplianceRate;

    @Column(name = "customer_satisfaction_avg", precision = 3, scale = 2)
    private BigDecimal customerSatisfactionAvg;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cases_by_priority", nullable = false, columnDefinition = "jsonb")
    private Map<String, Integer> casesByPriority;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cases_by_category", nullable = false, columnDefinition = "jsonb")
    private Map<String, Integer> casesByCategory;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (totalCreated   == null) totalCreated   = 0;
        if (totalResolved  == null) totalResolved  = 0;
        if (totalEscalated == null) totalEscalated = 0;
        if (totalReopened  == null) totalReopened  = 0;
        if (autoResolved   == null) autoResolved   = 0;
        if (casesByPriority == null) casesByPriority = new HashMap<>();
        if (casesByCategory == null) casesByCategory = new HashMap<>();
    }
}
