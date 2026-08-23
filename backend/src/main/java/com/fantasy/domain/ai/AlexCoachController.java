package com.fantasy.domain.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/coach")
public class AlexCoachController {
    private final AlexCoachService service;
    public AlexCoachController(AlexCoachService service) { this.service = service; }

    @GetMapping("/gameweeks/{gameweek}")
    public ResponseEntity<CoachAnalysisDto> get(@PathVariable int gameweek, Authentication authentication) {
        return service.find(userId(authentication), gameweek).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/gameweeks/{gameweek}/analyze")
    public CoachAnalysisDto analyze(@PathVariable int gameweek,
                                    @RequestBody(required = false) CoachAnalyzeRequest request,
                                    Authentication authentication) {
        return service.analyze(userId(authentication), gameweek, request);
    }

    @PostMapping("/gameweeks/{gameweek}/messages")
    public CoachAnalysisDto ask(@PathVariable int gameweek,
                                @RequestBody CoachMessageRequest request,
                                Authentication authentication) {
        return service.ask(userId(authentication), gameweek, request);
    }

    private int userId(Authentication authentication) { return Integer.parseInt(authentication.getName()); }
}
