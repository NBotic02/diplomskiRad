package com.customersupport.notificationservice.service;

import com.customersupport.notificationservice.domain.entity.NotificationRule;
import com.customersupport.notificationservice.dto.request.CreateRuleRequest;
import com.customersupport.notificationservice.dto.response.NotificationRuleResponse;
import com.customersupport.notificationservice.exception.ResourceNotFoundException;
import com.customersupport.notificationservice.repository.NotificationRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationRuleService {

    private final NotificationRuleRepository repo;
    private final EntityMapper                mapper;

    public List<NotificationRuleResponse> listActive() {
        return repo.findAllByIsActiveTrueOrderByPriorityAscHoursAfterCreationAsc().stream()
                .map(mapper::toResponse).toList();
    }

    @Transactional
    public NotificationRuleResponse create(CreateRuleRequest req) {
        NotificationRule rule = NotificationRule.builder()
                .name(req.name())
                .priority(req.priority())
                .hoursAfterCreation(req.hoursAfterCreation())
                .action(req.action())
                .notificationType(req.notificationType())
                .notifyAssignedAgent(req.notifyAssignedAgent() == null ? Boolean.TRUE : req.notifyAssignedAgent())
                .notifyDepartmentLead(req.notifyDepartmentLead() == null ? Boolean.FALSE : req.notifyDepartmentLead())
                .isActive(true)
                .build();
        NotificationRule saved = repo.saveAndFlush(rule);
        saved = repo.findById(saved.getRuleId()).orElseThrow();
        return mapper.toResponse(saved);
    }

    @Transactional
    public void deactivate(UUID id) {
        NotificationRule r = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NotificationRule", id));
        r.setIsActive(false);
    }
}
