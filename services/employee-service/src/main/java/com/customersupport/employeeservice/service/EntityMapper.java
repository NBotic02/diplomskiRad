package com.customersupport.employeeservice.service;

import com.customersupport.employeeservice.domain.entity.*;
import com.customersupport.employeeservice.dto.response.*;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class EntityMapper {

    public AgentResponse toResponse(Agent a) {
        return new AgentResponse(
                a.getAgentId(), a.getEmployeeNumber(),
                a.getFirstName(), a.getLastName(), a.getEmail(), a.getPhone(),
                a.getRole(), a.getHireDate(),
                a.getIsActive(), a.getMaxConcurrentCases(),
                a.getCreatedAt(), a.getUpdatedAt()
        );
    }

    public SkillResponse toResponse(Skill s) {
        return new SkillResponse(s.getSkillId(), s.getName(), s.getCategory(),
                s.getDescription(), s.getIsActive());
    }

    public AgentSkillResponse toResponse(AgentSkill as, String skillName) {
        return new AgentSkillResponse(as.getAgentId(), as.getSkillId(), skillName,
                as.getProficiency(), as.getCertifiedAt());
    }

    public DepartmentResponse toResponse(Department d) {
        return new DepartmentResponse(d.getDepartmentId(), d.getName(),
                d.getDepartmentLeadId(), d.getDescription(), d.getIsActive(), d.getCreatedAt());
    }

    public ShiftResponse toResponse(Shift sh) {
        List<Integer> days = sh.getDaysOfWeek() == null ? List.of() : Arrays.asList(sh.getDaysOfWeek());
        return new ShiftResponse(sh.getShiftId(), sh.getName(),
                sh.getStartTime(), sh.getEndTime(),
                days, sh.getTimezone(), sh.getIsOvernight(), sh.getIsActive());
    }

    public AgentScheduleResponse toResponse(AgentSchedule s) {
        return new AgentScheduleResponse(s.getScheduleId(), s.getAgentId(), s.getShiftId(),
                s.getEffectiveFrom(), s.getEffectiveTo(), s.getIsActive(), s.getCreatedAt());
    }

    public ScheduleExceptionResponse toResponse(ScheduleException e) {
        return new ScheduleExceptionResponse(e.getExceptionId(), e.getAgentId(),
                e.getExceptionDate(), e.getExceptionType(),
                e.getReason(), e.getIsApproved(), e.getApprovedBy(), e.getCreatedAt());
    }
}
