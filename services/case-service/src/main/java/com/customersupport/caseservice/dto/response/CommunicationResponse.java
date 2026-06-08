package com.customersupport.caseservice.dto.response;

import com.customersupport.caseservice.domain.enums.SenderType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommunicationResponse(
        UUID            communicationId,
        UUID            caseId,
        SenderType      senderType,
        UUID            senderId,
        String          subject,
        String          body,
        OffsetDateTime  createdAt
) {}
