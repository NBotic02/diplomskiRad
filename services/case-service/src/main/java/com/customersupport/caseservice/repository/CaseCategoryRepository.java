package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.CaseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseCategoryRepository extends JpaRepository<CaseCategory, Integer> {

    List<CaseCategory> findAllByIsActiveTrueOrderBySortOrderAscNameAsc();
}
