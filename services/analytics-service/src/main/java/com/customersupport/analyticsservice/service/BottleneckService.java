package com.customersupport.analyticsservice.service;

import com.customersupport.analyticsservice.domain.entity.BottleneckDetection;
import com.customersupport.analyticsservice.domain.enums.BottleneckSeverity;
import com.customersupport.analyticsservice.domain.enums.BottleneckType;
import com.customersupport.analyticsservice.dto.response.BottleneckResponse;
import com.customersupport.analyticsservice.exception.ResourceNotFoundException;
import com.customersupport.analyticsservice.repository.BottleneckDetectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BottleneckService {

    private final BottleneckDetectionRepository repo;
    private final EntityMapper                  mapper;

    public List<BottleneckResponse> listUnresolved() {
        return repo.findAllByIsResolvedFalseOrderByDetectedAtDesc().stream()
                .map(mapper::toResponse).toList();
    }

    public List<BottleneckResponse> listAll() {
        return repo.findAll().stream().map(mapper::toResponse).toList();
    }

    /** Records a bottleneck if no unresolved one of the same type already exists. */
    @Transactional
    public void record(BottleneckType type, BottleneckSeverity severity,
                       String description, BigDecimal metricValue, BigDecimal thresholdValue,
                       String entityType, UUID entityId) {
        if (repo.existsByBottleneckTypeAndIsResolvedFalse(type)) return;

        repo.save(BottleneckDetection.builder()
                .bottleneckType(type)
                .severity(severity)
                .description(description)
                .metricValue(metricValue)
                .thresholdValue(thresholdValue)
                .affectedEntityType(entityType)
                .affectedEntityId(entityId)
                .isResolved(false)
                .build());
    }

    @Transactional
    public BottleneckResponse resolve(UUID id) {
        BottleneckDetection b = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bottleneck", id));
        b.setIsResolved(true);
        b.setResolvedAt(OffsetDateTime.now());
        return mapper.toResponse(b);
    }
}
