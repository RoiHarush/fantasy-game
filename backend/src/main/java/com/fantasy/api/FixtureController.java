package com.fantasy.api;

import com.fantasy.dto.FixtureDto;
import com.fantasy.dto.FixtureSummaryDto;
import com.fantasy.infrastructure.mappers.FixtureMapper;
import com.fantasy.application.FixtureService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fixtures")
public class FixtureController {
    private final FixtureService fixtureService;

    public FixtureController(FixtureService fixtureService) {
        this.fixtureService = fixtureService;
    }

    @GetMapping
    public List<FixtureDto> getFixtures(@RequestParam(required = false) Integer gw) {
        return (gw == null ? fixtureService.getAllFixtures() : fixtureService.getFixturesByGameweek(gw))
                .stream()
                .map(FixtureMapper::toDto)
                .toList();
    }

    @GetMapping("/team/{teamId}")
    public Map<Integer, FixtureSummaryDto> getFixturesForTeam(@PathVariable int teamId) {
        return fixtureService.getFixturesForTeam(teamId);
    }

}
