package com.fantasy.domain.transfer;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/league-admin/draft")
@PreAuthorize("isAuthenticated()")
public class LeagueAdminDraftController {

    private final DraftService draftService;

    public LeagueAdminDraftController(DraftService draftService) {
        this.draftService = draftService;
    }

    @GetMapping("/config")
    public ResponseEntity<DraftConfig> getConfig(Authentication authentication) {
        return ResponseEntity.ok(draftService.getDraftConfig(userId(authentication)));
    }

    @PostMapping("/schedule")
    public ResponseEntity<String> schedule(@RequestBody DraftScheduleRequest request,
                                           Authentication authentication) {
        draftService.scheduleDraft(
                userId(authentication),
                request.scheduledTime(),
                request.orderSource(),
                request.order()
        );
        return ResponseEntity.ok("Draft scheduled");
    }

    @DeleteMapping("/config")
    public ResponseEntity<Void> deleteConfig(Authentication authentication) {
        draftService.deleteDraftConfig(userId(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/open-now")
    public ResponseEntity<String> openNow(
            @RequestBody(required = false) DraftOpenRequest request,
            Authentication authentication) {
        draftService.runDraftForUser(
                userId(authentication),
                request == null ? DraftOrderSource.TRANSFER_ORDER : request.orderSource(),
                request == null ? java.util.List.of() : request.order()
        );
        return ResponseEntity.ok("Draft started now!");
    }

    private int userId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }

    public record DraftScheduleRequest(LocalDateTime scheduledTime,
                                       DraftOrderSource orderSource,
                                       java.util.List<Integer> order) {}

    public record DraftOpenRequest(DraftOrderSource orderSource,
                                   java.util.List<Integer> order) {}
}
