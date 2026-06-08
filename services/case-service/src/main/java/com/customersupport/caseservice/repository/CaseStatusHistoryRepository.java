package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.CaseStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CaseStatusHistoryRepository extends JpaRepository<CaseStatusHistory, Long> {

    List<CaseStatusHistory> findAllByCaseIdOrderByCreatedAtAsc(UUID caseId);
}
