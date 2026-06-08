package com.customersupport.employeeservice.dto.request;

import com.customersupport.employeeservice.domain.enums.AgentRole;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreateAgentRequest(
        @NotBlank @Size(max = 20)  String employeeNumber,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email           String email,
        @Size(max = 30)            String phone,
        AgentRole                  role,
        LocalDate                  hireDate,
        @Min(0)                    Integer maxConcurrentCases
) {
    public AgentRole roleOrDefault()                  { return role               == null ? AgentRole.AGENT : role; }
    public Integer   maxConcurrentCasesOrDefault()    { return maxConcurrentCases == null ? 10 : maxConcurrentCases; }
}
