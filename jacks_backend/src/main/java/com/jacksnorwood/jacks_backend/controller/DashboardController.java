package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.DashboardStatsDTO;
import com.jacksnorwood.jacks_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }
}
