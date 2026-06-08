package com.customersupport.employeeservice.service;

import com.customersupport.employeeservice.domain.entity.AgentSkill;
import com.customersupport.employeeservice.domain.entity.Skill;
import com.customersupport.employeeservice.dto.request.AssignSkillRequest;
import com.customersupport.employeeservice.dto.request.CreateSkillRequest;
import com.customersupport.employeeservice.dto.response.AgentSkillResponse;
import com.customersupport.employeeservice.dto.response.SkillResponse;
import com.customersupport.employeeservice.exception.BusinessException;
import com.customersupport.employeeservice.exception.ResourceNotFoundException;
import com.customersupport.employeeservice.repository.AgentRepository;
import com.customersupport.employeeservice.repository.AgentSkillRepository;
import com.customersupport.employeeservice.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillService {

    private final SkillRepository      skillRepo;
    private final AgentSkillRepository agentSkillRepo;
    private final AgentRepository      agentRepo;
    private final EntityMapper         mapper;

    public List<SkillResponse> listActive() {
        return skillRepo.findAllByIsActiveTrueOrderByCategoryAscNameAsc().stream()
                .map(mapper::toResponse).toList();
    }

    public List<AgentSkillResponse> listAgentSkills(UUID agentId) {
        if (!agentRepo.existsById(agentId)) {
            throw new ResourceNotFoundException("Agent", agentId);
        }
        return agentSkillRepo.findAllByAgentId(agentId).stream()
                .map(as -> {
                    String name = skillRepo.findById(as.getSkillId())
                            .map(Skill::getName).orElse("(unknown)");
                    return mapper.toResponse(as, name);
                })
                .toList();
    }

    @Transactional
    public SkillResponse createSkill(CreateSkillRequest req) {
        if (skillRepo.findByName(req.name()).isPresent()) {
            throw new BusinessException("SKILL_EXISTS",
                    "Skill named %s already exists".formatted(req.name()));
        }
        Skill skill = Skill.builder()
                .name(req.name())
                .category(req.category())
                .description(req.description())
                .isActive(true)
                .build();
        return mapper.toResponse(skillRepo.save(skill));
    }

    @Transactional
    public AgentSkillResponse assignSkill(UUID agentId, AssignSkillRequest req) {
        if (!agentRepo.existsById(agentId)) {
            throw new ResourceNotFoundException("Agent", agentId);
        }
        Skill skill = skillRepo.findById(req.skillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", req.skillId()));

        AgentSkill as = AgentSkill.builder()
                .agentId(agentId)
                .skillId(skill.getSkillId())
                .proficiency(req.proficiencyOrDefault())
                .certifiedAt(req.certifiedAt())
                .build();

        AgentSkill saved = agentSkillRepo.save(as);
        return mapper.toResponse(saved, skill.getName());
    }

    @Transactional
    public void unassignSkill(UUID agentId, UUID skillId) {
        AgentSkill.AgentSkillId id = new AgentSkill.AgentSkillId(agentId, skillId);
        if (!agentSkillRepo.existsById(id)) {
            throw new ResourceNotFoundException("AgentSkill", agentId + "/" + skillId);
        }
        agentSkillRepo.deleteById(id);
    }
}
