package com.customersupport.caseservice.dto.request;

import com.customersupport.caseservice.domain.enums.SenderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateCommunicationRequest(
        @NotNull   SenderType senderType,
        @NotNull   UUID       senderId,
        @Size(max = 500) String subject,
        @NotBlank  String     body,
        String     to,
        List<String> cc
) {}
