package com.customersupport.caseservice.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignAgentRequest(
        @NotNull UUID assignedAgentId,
        UUID          teamId
) {}
