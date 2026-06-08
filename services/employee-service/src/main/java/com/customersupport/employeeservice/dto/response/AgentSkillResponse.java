package com.customersupport.employeeservice.dto.response;

import com.customersupport.employeeservice.domain.enums.ProficiencyLevel;

import java.time.LocalDate;
import java.util.UUID;

public record AgentSkillResponse(
        UUID             agentId,
        UUID             skillId,
        String           skillName,
        ProficiencyLevel proficiency,
        LocalDate        certifiedAt
) {}
