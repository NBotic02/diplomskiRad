package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.AgentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentScheduleRepository extends JpaRepository<AgentSchedule, UUID> {

    List<AgentSchedule> findAllByAgentIdOrderByEffectiveFromDesc(UUID agentId);
}
