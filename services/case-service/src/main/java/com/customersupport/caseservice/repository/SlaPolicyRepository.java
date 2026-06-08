package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.SlaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Integer> {

    List<SlaPolicy> findAllByIsActiveTrueOrderByPolicyIdAsc();
}
