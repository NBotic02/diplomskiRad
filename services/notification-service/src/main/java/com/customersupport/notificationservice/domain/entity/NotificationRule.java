package com.customersupport.notificationservice.domain.entity;

import com.customersupport.notificationservice.domain.enums.CasePriority;
import com.customersupport.notificationservice.domain.enums.RuleAction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rule_id", updatable = false, nullable = false)
    private UUID ruleId;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CasePriority priority;

    @Column(name = "hours_after_creation", nullable = false)
    private Integer hoursAfterCreation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RuleAction action;

    @Column(name = "notification_type", nullable = false, length = 40)
    private String notificationType;

    @Column(name = "notify_assigned_agent", nullable = false)
    private Boolean notifyAssignedAgent;

    @Column(name = "notify_department_lead", nullable = false)
    private Boolean notifyDepartmentLead;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
