package com.fantasy.api;


import com.fantasy.application.LeagueService;
import com.fantasy.dto.LeagueDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/league")
public class LeagueController {

    private final LeagueService leagueService;

    public LeagueController(LeagueService leagueService) {
        this.leagueService = leagueService;
    }

    @GetMapping
    public LeagueDto getLiveLeague() {
        return leagueService.getLiveLeagueDto();
    }
}