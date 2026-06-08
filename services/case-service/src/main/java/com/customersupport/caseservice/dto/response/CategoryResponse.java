package com.customersupport.caseservice.dto.response;

public record CategoryResponse(
        Integer categoryId,
        String  name,
        Integer parentCategoryId,
        String  description,
        Boolean isActive,
        Integer sortOrder
) {}
