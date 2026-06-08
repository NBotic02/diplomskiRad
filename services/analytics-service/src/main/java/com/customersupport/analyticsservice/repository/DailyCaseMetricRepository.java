package com.customersupport.analyticsservice.repository;

import com.customersupport.analyticsservice.domain.entity.DailyCaseMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyCaseMetricRepository extends JpaRepository<DailyCaseMetric, UUID> {

    Optional<DailyCaseMetric> findByMetricDate(LocalDate metricDate);

    List<DailyCaseMetric> findAllByMetricDateBetweenOrderByMetricDateAsc(LocalDate from, LocalDate to);
}
