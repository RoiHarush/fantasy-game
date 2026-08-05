package com.fantasy.domain.league;


import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/league")
public class LeagueController {

    private final LeagueService leagueService;

    public LeagueController(LeagueService leagueService) {
        this.leagueService = leagueService;
    }

    @GetMapping
    public LeagueDto getLiveLeague(Authentication authentication) {
        return leagueService.getLiveLeagueDto(Integer.parseInt(authentication.getName()));
    }
}
