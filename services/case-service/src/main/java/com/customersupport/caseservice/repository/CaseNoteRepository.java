package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.CaseNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CaseNoteRepository extends JpaRepository<CaseNote, UUID> {

    List<CaseNote> findAllByCaseIdOrderByIsPinnedDescCreatedAtDesc(UUID caseId);
}
