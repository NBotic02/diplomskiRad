package com.customersupport.notificationservice.service;

import com.customersupport.notificationservice.domain.entity.Notification;
import com.customersupport.notificationservice.domain.entity.NotificationPreference;
import com.customersupport.notificationservice.domain.enums.NotificationChannel;
import com.customersupport.notificationservice.domain.enums.NotificationStatus;
import com.customersupport.notificationservice.dto.request.SendNotificationRequest;
import com.customersupport.notificationservice.dto.response.NotificationResponse;
import com.customersupport.notificationservice.repository.NotificationPreferenceRepository;
import com.customersupport.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** Persists each notification attempt and dispatches via the chosen channel. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class NotificationService {

    private final NotificationRepository           repo;
    private final NotificationPreferenceRepository prefRepo;
    private final EmailSender                      emailSender;
    private final EntityMapper                     mapper;

    public List<NotificationResponse> listForCase(UUID caseId) {
        return repo.findAllByCaseIdOrderByCreatedAtDesc(caseId).stream()
                .map(mapper::toResponse).toList();
    }

    public List<NotificationResponse> listForRecipient(UUID recipientId) {
        return repo.findAllByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .map(mapper::toResponse).toList();
    }

    @Transactional
    public NotificationResponse send(SendNotificationRequest req) {
        NotificationChannel channel = pickChannel(req);

        Notification n = Notification.builder()
                .ruleId(req.ruleId())
                .caseId(req.caseId())
                .recipientId(req.recipientId())
                .recipientEmail(req.recipientEmail())
                .recipientPhone(req.recipientPhone())
                .channel(channel)
                .subject(req.subject())
                .body(req.body())
                .status(NotificationStatus.PENDING)
                .build();
        n = repo.saveAndFlush(n);

        try {
            dispatch(channel, req, n);
            n.setStatus(NotificationStatus.SENT);
            n.setSentAt(OffsetDateTime.now());
        } catch (Exception ex) {
            log.warn("Notification {} failed: {}", n.getNotificationId(), ex.getMessage());
            n.setStatus(NotificationStatus.FAILED);
            n.setErrorMessage(ex.getMessage());
        }

        return mapper.toResponse(repo.findById(n.getNotificationId()).orElseThrow());
    }

    private void dispatch(NotificationChannel channel, SendNotificationRequest req, Notification n) {
        switch (channel) {
            case EMAIL -> {
                if (req.recipientEmail() == null || req.recipientEmail().isBlank()) {
                    throw new IllegalArgumentException("recipientEmail is required for EMAIL channel");
                }
                emailSender.send(req.recipientEmail(), req.subject(), req.body());
            }
            case SMS, SLACK ->
                log.info("[{}-stub] would deliver notification {} to {}",
                        channel, n.getNotificationId(), req.recipientId());
        }
    }

    private NotificationChannel pickChannel(SendNotificationRequest req) {
        if (req.preferredChannel() != null) return req.preferredChannel();
        return prefRepo.findByAgentIdAndNotificationType(req.recipientId(), req.notificationType())
                .filter(NotificationPreference::getIsEnabled)
                .map(NotificationPreference::getPreferredChannel)
                .orElse(NotificationChannel.EMAIL);
    }
}
