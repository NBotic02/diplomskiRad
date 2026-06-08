package com.customersupport.caseservice.dto.response;

import java.util.Map;

/** Case breakdown by category and priority. */
public record CaseBreakdownResponse(
        Map<String, Integer> casesByCategory,
        Map<String, Integer> casesByPriority
) {}
