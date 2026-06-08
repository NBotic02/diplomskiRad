package com.customersupport.employeeservice.service;

import com.customersupport.employeeservice.auth.AuthenticatedUser;
import com.customersupport.employeeservice.domain.entity.AgentSchedule;
import com.customersupport.employeeservice.domain.entity.ScheduleException;
import com.customersupport.employeeservice.domain.entity.Shift;
import com.customersupport.employeeservice.dto.request.CreateExceptionRangeRequest;
import com.customersupport.employeeservice.dto.request.CreateExceptionRequest;
import com.customersupport.employeeservice.dto.request.CreateScheduleRequest;
import com.customersupport.employeeservice.dto.response.AgentScheduleResponse;
import com.customersupport.employeeservice.dto.response.ScheduleExceptionResponse;
import com.customersupport.employeeservice.dto.response.ShiftResponse;
import com.customersupport.employeeservice.exception.ResourceNotFoundException;
import com.customersupport.employeeservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private final AgentRepository             agentRepo;
    private final ShiftRepository             shiftRepo;
    private final AgentScheduleRepository     scheduleRepo;
    private final ScheduleExceptionRepository exceptionRepo;
    private final EntityMapper                mapper;

    public List<ShiftResponse> listShifts() {
        return shiftRepo.findAllByIsActiveTrueOrderByStartTimeAsc().stream()
                .map(mapper::toResponse).toList();
    }

    public List<AgentScheduleResponse> listSchedulesFor(UUID agentId) {
        ensureAgent(agentId);
        return scheduleRepo.findAllByAgentIdOrderByEffectiveFromDesc(agentId).stream()
                .map(mapper::toResponse).toList();
    }

    public List<ScheduleExceptionResponse> listUpcomingExceptionsFor(UUID agentId) {
        ensureAgent(agentId);
        return exceptionRepo
                .findAllByAgentIdAndExceptionDateGreaterThanEqualOrderByExceptionDateAsc(agentId, LocalDate.now())
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    /** Lead/admin approval queue — everything still awaiting a decision. */
    public List<ScheduleExceptionResponse> listPendingExceptions() {
        return exceptionRepo.findAllByIsApprovedFalseOrderByExceptionDateAsc().stream()
                .map(mapper::toResponse)
                .toList();
    }

    /** Approved exceptions overlapping the inclusive window. */
    public List<ScheduleExceptionResponse> listApprovedBetween(LocalDate from, LocalDate to) {
        return exceptionRepo
                .findAllByIsApprovedTrueAndExceptionDateBetweenOrderByExceptionDateAsc(from, to)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public ScheduleExceptionResponse approveException(UUID exceptionId, UUID approverAgentId) {
        ScheduleException e = exceptionRepo.findById(exceptionId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleException", exceptionId));
        e.setIsApproved(true);
        e.setApprovedBy(approverAgentId);
        return mapper.toResponse(exceptionRepo.saveAndFlush(e));
    }

    @Transactional
    public void deleteException(UUID exceptionId) {
        if (!exceptionRepo.existsById(exceptionId)) {
            throw new ResourceNotFoundException("ScheduleException", exceptionId);
        }
        exceptionRepo.deleteById(exceptionId);
    }

    @Transactional
    public AgentScheduleResponse addSchedule(UUID agentId, CreateScheduleRequest req) {
        ensureAgent(agentId);
        Shift shift = shiftRepo.findById(req.shiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift", req.shiftId()));

        AgentSchedule s = AgentSchedule.builder()
                .agentId(agentId)
                .shiftId(shift.getShiftId())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .isActive(true)
                .build();

        AgentSchedule saved = scheduleRepo.saveAndFlush(s);
        saved = scheduleRepo.findById(saved.getScheduleId()).orElseThrow();
        return mapper.toResponse(saved);
    }

    @Transactional
    public ScheduleExceptionResponse addException(UUID agentId, CreateExceptionRequest req) {
        ensureAgent(agentId);

        ScheduleException e = ScheduleException.builder()
                .agentId(agentId)
                .exceptionDate(req.exceptionDate())
                .exceptionType(req.exceptionType())
                .reason(req.reason())
                .isApproved(autoApprove(req.approvedOrFalse()))
                .build();

        ScheduleException saved = exceptionRepo.saveAndFlush(e);
        saved = exceptionRepo.findById(saved.getExceptionId()).orElseThrow();
        return mapper.toResponse(saved);
    }

    /** Create one exception row per day in the inclusive range. */
    @Transactional
    public List<ScheduleExceptionResponse> addExceptionRange(UUID agentId,
                                                             CreateExceptionRangeRequest req) {
        ensureAgent(agentId);
        if (req.toDate().isBefore(req.fromDate())) {
            throw new IllegalArgumentException("toDate must be on or after fromDate");
        }

        List<ScheduleExceptionResponse> created = new java.util.ArrayList<>();
        LocalDate cursor = req.fromDate();
        while (!cursor.isAfter(req.toDate())) {
            final LocalDate day = cursor;
            // Skip days already on file (idempotent).
            boolean exists = exceptionRepo
                    .findAllByAgentIdAndExceptionDateGreaterThanEqualOrderByExceptionDateAsc(agentId, day)
                    .stream()
                    .anyMatch(e -> e.getExceptionDate().isEqual(day));
            if (!exists) {
                ScheduleException e = ScheduleException.builder()
                        .agentId(agentId)
                        .exceptionDate(day)
                        .exceptionType(req.exceptionType())
                        .reason(req.reason())
                        .isApproved(autoApprove(req.approvedOrFalse()))
                        .build();
                ScheduleException saved = exceptionRepo.saveAndFlush(e);
                created.add(mapper.toResponse(saved));
            }
            cursor = cursor.plusDays(1);
        }
        return created;
    }

    private void ensureAgent(UUID agentId) {
        if (!agentRepo.existsById(agentId)) {
            throw new ResourceNotFoundException("Agent", agentId);
        }
    }

    private boolean autoApprove(boolean requestedFlag) {
        return requestedFlag || AuthenticatedUser.isLead() || AuthenticatedUser.isAdmin();
    }
}
