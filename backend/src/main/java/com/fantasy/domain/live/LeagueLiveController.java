package com.fantasy.domain.live;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/live")
public class LeagueLiveController {

    private final LeagueLiveService liveService;

    public LeagueLiveController(LeagueLiveService liveService) {
        this.liveService = liveService;
    }

    @GetMapping
    public LeagueLiveDto current(Authentication authentication) {
        return liveService.getForUser(Integer.parseInt(authentication.getName()));
    }
}
