package com.customersupport.employeeservice.dto.response;

import com.customersupport.employeeservice.domain.enums.AgentRole;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AgentResponse(
        UUID            agentId,
        String          employeeNumber,
        String          firstName,
        String          lastName,
        String          email,
        String          phone,
        AgentRole       role,
        LocalDate       hireDate,
        Boolean         isActive,
        Integer         maxConcurrentCases,
        OffsetDateTime  createdAt,
        OffsetDateTime  updatedAt
) {}
