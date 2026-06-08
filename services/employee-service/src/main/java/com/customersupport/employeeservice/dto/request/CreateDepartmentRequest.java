package com.customersupport.employeeservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDepartmentRequest(
        @NotBlank @Size(max = 100) String name,
        UUID                       departmentLeadId,
        String                     description
) {}
