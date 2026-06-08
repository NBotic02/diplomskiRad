package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, UUID> {

    List<ScheduleException> findAllByAgentIdAndExceptionDateGreaterThanEqualOrderByExceptionDateAsc(
            UUID agentId, LocalDate from);

    /** Lead/admin approval queue — every pending exception across all agents. */
    List<ScheduleException> findAllByIsApprovedFalseOrderByExceptionDateAsc();

    /** Approved exceptions intersecting a window — for calendar overlays. */
    List<ScheduleException> findAllByIsApprovedTrueAndExceptionDateBetweenOrderByExceptionDateAsc(
            LocalDate from, LocalDate to);
}
