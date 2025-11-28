package com.fantasy.api;

import com.fantasy.application.SystemStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemStatusController {

    private final SystemStatusService statusService;

    public SystemStatusController(SystemStatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getSystemStatus() {
        return ResponseEntity.ok(Map.of("isRolloverInProgress", statusService.isRolloverInProgress()));
    }
}