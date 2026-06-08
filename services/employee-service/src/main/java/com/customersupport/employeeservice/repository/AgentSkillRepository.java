package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.AgentSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentSkillRepository extends JpaRepository<AgentSkill, AgentSkill.AgentSkillId> {

    List<AgentSkill> findAllByAgentId(UUID agentId);

    List<AgentSkill> findAllBySkillId(UUID skillId);
}
