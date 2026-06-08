package com.customersupport.analyticsservice.domain.entity;

import com.customersupport.analyticsservice.domain.enums.PeriodType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "agent_performance_metrics",
       uniqueConstraints = @UniqueConstraint(columnNames = {"agent_id", "period_start", "period_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentPerformanceMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "agent_id", nullable = false)
    private UUID agentId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 10)
    private PeriodType periodType;

    @Column(name = "cases_assigned",  nullable = false) private Integer casesAssigned;
    @Column(name = "cases_resolved",  nullable = false) private Integer casesResolved;
    @Column(name = "cases_escalated", nullable = false) private Integer casesEscalated;

    @Column(name = "avg_resolution_minutes", precision = 10, scale = 2)
    private BigDecimal avgResolutionMinutes;

    @Column(name = "avg_first_response_minutes", precision = 10, scale = 2)
    private BigDecimal avgFirstResponseMinutes;

    @Column(name = "sla_compliance_rate", precision = 5, scale = 2)
    private BigDecimal slaComplianceRate;

    @Column(name = "customer_satisfaction_avg", precision = 3, scale = 2)
    private BigDecimal customerSatisfactionAvg;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (casesAssigned  == null) casesAssigned  = 0;
        if (casesResolved  == null) casesResolved  = 0;
        if (casesEscalated == null) casesEscalated = 0;
    }
}
