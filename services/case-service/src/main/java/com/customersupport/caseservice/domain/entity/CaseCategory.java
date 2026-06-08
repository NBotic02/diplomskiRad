package com.customersupport.caseservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "case_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "parent_category_id")
    private Integer parentCategoryId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
