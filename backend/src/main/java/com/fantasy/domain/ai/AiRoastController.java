package com.fantasy.domain.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/roasts")
public class AiRoastController {

    private final AiRoastService roastService;

    public AiRoastController(AiRoastService roastService) {
        this.roastService = roastService;
    }

    @GetMapping("/gameweeks/{gameweek}")
    public ResponseEntity<AiRoastDto> get(@PathVariable int gameweek, Authentication authentication) {
        return roastService.find(actualUserId(authentication), gameweek)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/gameweeks/{gameweek}")
    public ResponseEntity<AiRoastDto> generate(@PathVariable int gameweek, Authentication authentication) {
        return ResponseEntity.ok(roastService.generate(actualUserId(authentication), gameweek));
    }

    private int actualUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}

