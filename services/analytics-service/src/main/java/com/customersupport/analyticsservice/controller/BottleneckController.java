package com.customersupport.analyticsservice.controller;

import com.customersupport.analyticsservice.dto.response.BottleneckResponse;
import com.customersupport.analyticsservice.service.BottleneckService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bottlenecks")
@RequiredArgsConstructor
public class BottleneckController {

    private final BottleneckService service;

    @GetMapping
    public List<BottleneckResponse> list(@RequestParam(defaultValue = "true") boolean unresolvedOnly) {
        return unresolvedOnly ? service.listUnresolved() : service.listAll();
    }

    @PostMapping("/{id}/resolve")
    public BottleneckResponse resolve(@PathVariable UUID id) {
        return service.resolve(id);
    }
}
