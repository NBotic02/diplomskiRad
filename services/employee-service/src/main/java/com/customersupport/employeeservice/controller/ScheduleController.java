package com.customersupport.employeeservice.controller;

import com.customersupport.employeeservice.dto.request.CreateExceptionRangeRequest;
import com.customersupport.employeeservice.dto.request.CreateExceptionRequest;
import com.customersupport.employeeservice.dto.request.CreateScheduleRequest;
import com.customersupport.employeeservice.dto.response.AgentScheduleResponse;
import com.customersupport.employeeservice.dto.response.ScheduleExceptionResponse;
import com.customersupport.employeeservice.dto.response.ShiftResponse;
import com.customersupport.employeeservice.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService service;

    @GetMapping("/api/v1/shifts")
    public List<ShiftResponse> listShifts() {
        return service.listShifts();
    }

    @GetMapping("/api/v1/agents/{id}/schedules")
    public List<AgentScheduleResponse> listSchedules(@PathVariable UUID id) {
        return service.listSchedulesFor(id);
    }

    @PostMapping("/api/v1/agents/{id}/schedules")
    public ResponseEntity<AgentScheduleResponse> addSchedule(@PathVariable UUID id,
                                                             @Valid @RequestBody CreateScheduleRequest req) {
        return ResponseEntity.status(201).body(service.addSchedule(id, req));
    }

    @GetMapping("/api/v1/agents/{id}/exceptions")
    public List<ScheduleExceptionResponse> listExceptions(@PathVariable UUID id) {
        return service.listUpcomingExceptionsFor(id);
    }

    @PostMapping("/api/v1/agents/{id}/exceptions")
    public ResponseEntity<ScheduleExceptionResponse> addException(@PathVariable UUID id,
                                                                  @Valid @RequestBody CreateExceptionRequest req) {
        return ResponseEntity.status(201).body(service.addException(id, req));
    }

    /** Submit a multi-day time-off request (one row per day). */
    @PostMapping("/api/v1/agents/{id}/exceptions/range")
    public ResponseEntity<List<ScheduleExceptionResponse>> addExceptionRange(
            @PathVariable UUID id,
            @Valid @RequestBody CreateExceptionRangeRequest req) {
        return ResponseEntity.status(201).body(service.addExceptionRange(id, req));
    }

    /** Approval queue: every pending exception across all agents. */
    @GetMapping("/api/v1/exceptions/pending")
    public List<ScheduleExceptionResponse> listPending() {
        return service.listPendingExceptions();
    }

    /** Approved exceptions overlapping a window — calendar overlay feed. */
    @GetMapping("/api/v1/exceptions/approved")
    public List<ScheduleExceptionResponse> listApproved(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.listApprovedBetween(from, to);
    }

    /** Approve a single exception. */
    @PatchMapping("/api/v1/exceptions/{exceptionId}/approve")
    public ScheduleExceptionResponse approve(
            @PathVariable UUID exceptionId,
            @RequestBody ApproveExceptionRequest req) {
        return service.approveException(exceptionId, req.approverAgentId());
    }

    /** Reject an exception by deleting the row. */
    @DeleteMapping("/api/v1/exceptions/{exceptionId}")
    public ResponseEntity<Void> reject(@PathVariable UUID exceptionId) {
        service.deleteException(exceptionId);
        return ResponseEntity.noContent().build();
    }

    /** Inline request body for the approve endpoint. */
    public record ApproveExceptionRequest(UUID approverAgentId) {}
}
