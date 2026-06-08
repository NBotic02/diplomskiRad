package com.customersupport.notificationservice.repository;

import com.customersupport.notificationservice.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByCaseIdOrderByCreatedAtDesc(UUID caseId);

    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
}
