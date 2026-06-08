package com.customersupport.caseservice.service;

import com.customersupport.caseservice.dto.response.SlaTrackingResponse;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.repository.SlaTrackingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SlaTrackingService {

    private final SlaTrackingRepository repo;
    private final EntityMapper          mapper;

    public SlaTrackingResponse getByCaseId(UUID caseId) {
        return repo.findByCaseId(caseId)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("SlaTracking for case", caseId));
    }
}
