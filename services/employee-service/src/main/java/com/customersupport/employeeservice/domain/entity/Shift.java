package com.customersupport.employeeservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "shift_id", updatable = false, nullable = false)
    private UUID shiftId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** ISO day-of-week numbers (1 = Monday … 7 = Sunday). PostgreSQL int[]. */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "days_of_week", nullable = false, columnDefinition = "int[]")
    private Integer[] daysOfWeek;

    @Column(nullable = false, length = 50)
    private String timezone;

    @Column(name = "is_overnight", nullable = false)
    private Boolean isOvernight;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
