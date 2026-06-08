package com.customersupport.analyticsservice.repository;

import com.customersupport.analyticsservice.domain.entity.BottleneckDetection;
import com.customersupport.analyticsservice.domain.enums.BottleneckType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BottleneckDetectionRepository extends JpaRepository<BottleneckDetection, UUID> {

    List<BottleneckDetection> findAllByIsResolvedFalseOrderByDetectedAtDesc();

    boolean existsByBottleneckTypeAndIsResolvedFalse(BottleneckType type);
}
