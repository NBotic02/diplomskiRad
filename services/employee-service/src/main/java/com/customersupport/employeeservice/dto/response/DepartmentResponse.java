package com.customersupport.employeeservice.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DepartmentResponse(
        UUID            departmentId,
        String          name,
        UUID            departmentLeadId,
        String          description,
        Boolean         isActive,
        OffsetDateTime  createdAt
) {}
