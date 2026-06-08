package com.customersupport.notificationservice.repository;

import com.customersupport.notificationservice.domain.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByAgentIdAndNotificationType(UUID agentId, String notificationType);

    List<NotificationPreference> findAllByAgentId(UUID agentId);
}
