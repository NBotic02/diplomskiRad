package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.SlaTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SlaTrackingRepository extends JpaRepository<SlaTracking, Long> {

    Optional<SlaTracking> findByCaseId(UUID caseId);
}
