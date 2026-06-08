package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.CaseCommunication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CaseCommunicationRepository extends JpaRepository<CaseCommunication, UUID> {

    List<CaseCommunication> findAllByCaseIdOrderByCreatedAtAsc(UUID caseId);
}
