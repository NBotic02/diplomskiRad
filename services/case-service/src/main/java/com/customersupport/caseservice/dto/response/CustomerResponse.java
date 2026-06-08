package com.customersupport.caseservice.dto.response;

import com.customersupport.caseservice.domain.enums.CustomerTier;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerResponse(
        UUID            customerId,
        String          externalId,
        String          firstName,
        String          lastName,
        String          email,
        String          phone,
        String          company,
        CustomerTier    tier,
        OffsetDateTime  createdAt,
        OffsetDateTime  updatedAt
) {}
