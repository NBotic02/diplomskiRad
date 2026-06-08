package com.customersupport.employeeservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSkillRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 50)            String category,
        String                     description
) {}
