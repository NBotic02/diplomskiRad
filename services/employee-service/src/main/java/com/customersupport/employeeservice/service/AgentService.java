package com.customersupport.employeeservice.service;

import com.customersupport.employeeservice.auth.AuthenticatedUser;
import com.customersupport.employeeservice.domain.entity.Agent;
import com.customersupport.employeeservice.dto.request.CreateAgentRequest;
import com.customersupport.employeeservice.dto.request.UpdateAgentRequest;
import com.customersupport.employeeservice.dto.response.AgentResponse;
import com.customersupport.employeeservice.exception.BusinessException;
import com.customersupport.employeeservice.exception.ResourceNotFoundException;
import com.customersupport.employeeservice.repository.AgentRepository;
import com.customersupport.employeeservice.repository.DepartmentMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgentService {

    private final AgentRepository           repo;
    private final DepartmentMemberRepository membershipRepo;
    private final EntityMapper              mapper;

    public List<AgentResponse> listActive() {
        if (AuthenticatedUser.isAdmin()) {
            return repo.findAllByIsActiveTrueOrderByEmployeeNumberAsc().stream()
                    .map(mapper::toResponse).toList();
        }
        UUID departmentId = AuthenticatedUser.departmentId().orElse(null);
        if (departmentId == null) {
            return List.of();
        }
        return repo.findAllActiveByDepartmentId(departmentId).stream()
                .map(mapper::toResponse).toList();
    }

    /** Admin-only: list active agents within a specific department. */
    public List<AgentResponse> listActiveByDepartment(UUID departmentId) {
        return repo.findAllActiveByDepartmentId(departmentId).stream()
                .map(mapper::toResponse).toList();
    }

    public AgentResponse getById(UUID id) {
        return repo.findById(id).map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", id));
    }

    public List<AgentResponse> findAvailable(String skillName, int limit) {
        return repo.findAvailableBySkillName(skillName, limit).stream()
                .map(mapper::toResponse).toList();
    }

    /** Fallback: any on-shift available agents regardless of skill. */
    public List<AgentResponse> findAvailableAnyOnShift(int limit) {
        return repo.findAvailableAnyOnShift(limit).stream()
                .map(mapper::toResponse).toList();
    }

    @Transactional
    public AgentResponse create(CreateAgentRequest req) {
        if (repo.findByEmail(req.email()).isPresent()) {
            throw new BusinessException("AGENT_EXISTS",
                    "Agent with email %s already exists".formatted(req.email()));
        }
        if (repo.findByEmployeeNumber(req.employeeNumber()).isPresent()) {
            throw new BusinessException("AGENT_EXISTS",
                    "Agent with employee number %s already exists".formatted(req.employeeNumber()));
        }

        Agent agent = Agent.builder()
                .employeeNumber(req.employeeNumber())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .phone(req.phone())
                .role(req.roleOrDefault())
                .hireDate(req.hireDate())
                .isActive(true)
                .maxConcurrentCases(req.maxConcurrentCasesOrDefault())
                .build();

        Agent saved = repo.saveAndFlush(agent);
        saved = repo.findById(saved.getAgentId()).orElseThrow();
        return mapper.toResponse(saved);
    }

    @Transactional
    public AgentResponse update(UUID id, UpdateAgentRequest req) {
        Agent a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", id));

        if (AuthenticatedUser.isLead() && !AuthenticatedUser.isAdmin()) {
            UUID leadDept = AuthenticatedUser.departmentId().orElseThrow(() ->
                    new AccessDeniedException("Lead has no department on file"));
            boolean targetIsInLeadsDept = membershipRepo.findAllByAgentId(id).stream()
                    .anyMatch(m -> leadDept.equals(m.getDepartmentId()));
            if (!targetIsInLeadsDept) {
                throw new AccessDeniedException(
                        "Department leads can only edit agents within their own department");
            }
            if (req.role() != null && req.role() != a.getRole()) {
                throw new AccessDeniedException(
                        "Only administrators can change an agent's role");
            }
        }

        if (req.firstName()          != null) a.setFirstName(req.firstName());
        if (req.lastName()           != null) a.setLastName(req.lastName());
        if (req.email()              != null) a.setEmail(req.email());
        if (req.phone()              != null) a.setPhone(req.phone());
        if (req.role()               != null) a.setRole(req.role());
        if (req.isActive()           != null) a.setIsActive(req.isActive());
        if (req.maxConcurrentCases() != null) a.setMaxConcurrentCases(req.maxConcurrentCases());

        return mapper.toResponse(a);
    }

    @Transactional
    public void deactivate(UUID id) {
        Agent a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", id));
        a.setIsActive(false);
    }
}
