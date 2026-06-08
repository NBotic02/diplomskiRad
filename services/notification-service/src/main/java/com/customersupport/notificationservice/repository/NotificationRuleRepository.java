package com.customersupport.notificationservice.repository;

import com.customersupport.notificationservice.domain.entity.NotificationRule;
import com.customersupport.notificationservice.domain.enums.CasePriority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRuleRepository extends JpaRepository<NotificationRule, UUID> {

    List<NotificationRule> findAllByIsActiveTrueOrderByPriorityAscHoursAfterCreationAsc();

    List<NotificationRule> findAllByPriorityAndIsActiveTrue(CasePriority priority);
}
