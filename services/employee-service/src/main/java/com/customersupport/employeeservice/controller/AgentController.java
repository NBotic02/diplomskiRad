package com.customersupport.employeeservice.controller;

import com.customersupport.employeeservice.auth.AuthenticatedUser;
import com.customersupport.employeeservice.auth.SecurityRoles;
import com.customersupport.employeeservice.dto.request.AssignSkillRequest;
import com.customersupport.employeeservice.dto.request.CreateAgentRequest;
import com.customersupport.employeeservice.dto.request.UpdateAgentRequest;
import com.customersupport.employeeservice.dto.response.AgentResponse;
import com.customersupport.employeeservice.dto.response.AgentSkillResponse;
import com.customersupport.employeeservice.service.AgentService;
import com.customersupport.employeeservice.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agents;
    private final SkillService skills;

    /** List active agents, optionally scoped by department for admins. */
    @GetMapping
    public List<AgentResponse> list(@RequestParam(required = false) UUID departmentId) {
        if (departmentId != null && AuthenticatedUser.isAdmin()) {
            return agents.listActiveByDepartment(departmentId);
        }
        return agents.listActive();
    }

    /** Find available agents for a given skill. */
    @GetMapping("/available")
    public List<AgentResponse> findAvailable(
            @RequestParam String skillName,
            @RequestParam(defaultValue = "5") int limit) {
        return agents.findAvailable(skillName, limit);
    }

    @GetMapping("/{id}")
    public AgentResponse getById(@PathVariable UUID id) {
        return agents.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('" + SecurityRoles.ADMIN + "')")
    public ResponseEntity<AgentResponse> create(@Valid @RequestBody CreateAgentRequest req) {
        AgentResponse created = agents.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.agentId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('" + SecurityRoles.ADMIN + "') or hasRole('" + SecurityRoles.LEAD + "')")
    public AgentResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAgentRequest req) {
        return agents.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + SecurityRoles.ADMIN + "')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        agents.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/skills")
    public List<AgentSkillResponse> listSkills(@PathVariable UUID id) {
        return skills.listAgentSkills(id);
    }

    @PostMapping("/{id}/skills")
    public ResponseEntity<AgentSkillResponse> assignSkill(@PathVariable UUID id,
                                                          @Valid @RequestBody AssignSkillRequest req) {
        return ResponseEntity.status(201).body(skills.assignSkill(id, req));
    }

    @DeleteMapping("/{id}/skills/{skillId}")
    public ResponseEntity<Void> unassignSkill(@PathVariable UUID id, @PathVariable UUID skillId) {
        skills.unassignSkill(id, skillId);
        return ResponseEntity.noContent().build();
    }
}
