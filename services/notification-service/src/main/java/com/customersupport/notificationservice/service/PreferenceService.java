package com.customersupport.notificationservice.service;

import com.customersupport.notificationservice.domain.entity.NotificationPreference;
import com.customersupport.notificationservice.dto.request.UpsertPreferenceRequest;
import com.customersupport.notificationservice.dto.response.NotificationPreferenceResponse;
import com.customersupport.notificationservice.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PreferenceService {

    private final NotificationPreferenceRepository repo;
    private final EntityMapper                     mapper;

    public List<NotificationPreferenceResponse> listForAgent(UUID agentId) {
        return repo.findAllByAgentId(agentId).stream()
                .map(mapper::toResponse).toList();
    }

    /** Upserts: creates a new preference or updates the existing one. */
    @Transactional
    public NotificationPreferenceResponse upsert(UUID agentId, UpsertPreferenceRequest req) {
        NotificationPreference pref = repo.findByAgentIdAndNotificationType(agentId, req.notificationType())
                .orElseGet(() -> NotificationPreference.builder()
                        .agentId(agentId)
                        .notificationType(req.notificationType())
                        .build());

        pref.setPreferredChannel(req.preferredChannel());
        pref.setIsEnabled(req.enabledOrTrue());

        NotificationPreference saved = repo.saveAndFlush(pref);
        saved = repo.findById(saved.getPreferenceId()).orElseThrow();
        return mapper.toResponse(saved);
    }
}
