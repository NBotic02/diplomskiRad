package com.customersupport.notificationservice.service;

import com.customersupport.notificationservice.domain.entity.*;
import com.customersupport.notificationservice.dto.response.*;
import org.springframework.stereotype.Component;

@Component
public class EntityMapper {

    public NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getNotificationId(), n.getRuleId(), n.getCaseId(),
                n.getRecipientId(), n.getRecipientEmail(), n.getRecipientPhone(),
                n.getChannel(), n.getSubject(), n.getBody(),
                n.getStatus(), n.getSentAt(), n.getErrorMessage(), n.getCreatedAt()
        );
    }

    public NotificationRuleResponse toResponse(NotificationRule r) {
        return new NotificationRuleResponse(
                r.getRuleId(), r.getName(), r.getPriority(),
                r.getHoursAfterCreation(), r.getAction(), r.getNotificationType(),
                r.getNotifyAssignedAgent(), r.getNotifyDepartmentLead(),
                r.getIsActive(), r.getCreatedAt()
        );
    }

    public NotificationPreferenceResponse toResponse(NotificationPreference p) {
        return new NotificationPreferenceResponse(
                p.getPreferenceId(), p.getAgentId(), p.getNotificationType(),
                p.getPreferredChannel(), p.getIsEnabled(),
                p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
