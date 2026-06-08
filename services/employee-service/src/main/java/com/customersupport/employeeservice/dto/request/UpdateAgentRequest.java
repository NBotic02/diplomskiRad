package com.customersupport.employeeservice.dto.request;

import com.customersupport.employeeservice.domain.enums.AgentRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateAgentRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Email           String email,
        @Size(max = 30)  String phone,
        AgentRole        role,
        Boolean          isActive,
        @Min(0)          Integer maxConcurrentCases
) {}
