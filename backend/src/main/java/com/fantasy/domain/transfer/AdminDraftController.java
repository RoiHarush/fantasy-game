package com.fantasy.domain.transfer;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/draft")
public class AdminDraftController {

    private final DraftService draftService;

    public AdminDraftController(DraftService draftService) {
        this.draftService = draftService;
    }

    @GetMapping("/config")
    public ResponseEntity<DraftConfig> getConfig() {
        return ResponseEntity.ok(draftService.getDraftConfig());
    }

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<String> schedule(@RequestBody DraftScheduleRequest request) {
        draftService.scheduleDraft(request.getScheduledTime());
        return ResponseEntity.ok("Draft scheduled");
    }

    @DeleteMapping("/config")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteConfig() {
        draftService.deleteDraftConfig();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/open-now")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<String> openNow() {
        draftService.runSnakeDraft();
        return ResponseEntity.ok("Draft started now!");
    }
}

class DraftScheduleRequest {
    private LocalDateTime scheduledTime;
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
}