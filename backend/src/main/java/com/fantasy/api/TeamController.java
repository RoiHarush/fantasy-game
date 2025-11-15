package com.fantasy.api;

import com.fantasy.application.TeamService;
import com.fantasy.domain.realWorldData.TeamEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {
    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<TeamEntity> getTeams() {
        return teamService.getAllTeams();
    }
}
