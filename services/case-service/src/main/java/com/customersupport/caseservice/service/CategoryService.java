package com.customersupport.caseservice.service;

import com.customersupport.caseservice.dto.response.CategoryResponse;
import com.customersupport.caseservice.repository.CaseCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CaseCategoryRepository repo;
    private final EntityMapper           mapper;

    public List<CategoryResponse> listActive() {
        return repo.findAllByIsActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(mapper::toResponse)
                .toList();
    }
}
