package com.customersupport.notificationservice.domain.entity;

import com.customersupport.notificationservice.domain.enums.NotificationChannel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences",
       uniqueConstraints = @UniqueConstraint(columnNames = {"agent_id", "notification_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "preference_id", updatable = false, nullable = false)
    private UUID preferenceId;

    @Column(name = "agent_id", nullable = false)
    private UUID agentId;

    @Column(name = "notification_type", nullable = false, length = 40)
    private String notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_channel", nullable = false, length = 20)
    private NotificationChannel preferredChannel;

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
