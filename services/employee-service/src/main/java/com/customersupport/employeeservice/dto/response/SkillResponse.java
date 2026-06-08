package com.customersupport.employeeservice.dto.response;

import java.util.UUID;

public record SkillResponse(
        UUID    skillId,
        String  name,
        String  category,
        String  description,
        Boolean isActive
) {}
