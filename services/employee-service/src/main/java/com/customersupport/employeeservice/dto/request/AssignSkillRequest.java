package com.customersupport.employeeservice.dto.request;

import com.customersupport.employeeservice.domain.enums.ProficiencyLevel;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AssignSkillRequest(
        @NotNull UUID             skillId,
        ProficiencyLevel          proficiency,
        LocalDate                 certifiedAt
) {
    public ProficiencyLevel proficiencyOrDefault() {
        return proficiency == null ? ProficiencyLevel.BEGINNER : proficiency;
    }
}
