package com.fantasy.api;

import com.fantasy.domain.league.League;
import com.fantasy.dto.LeagueDto;
import com.fantasy.dto.UserSummaryDto;
import com.fantasy.main.InMemoryData;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/league")
public class LeagueController {

    @GetMapping
    public LeagueDto getLiveLeague() {
        League liveLeague = InMemoryData.getActiveLeague();
        if (liveLeague == null) {
            throw new RuntimeException("No active league loaded in memory");
        }

        liveLeague.sortUsers();

        List<UserSummaryDto> summaries = liveLeague.getUsers().stream()
                .map(u -> new UserSummaryDto(
                        u.getId(),
                        u.getName(),
                        u.getFantasyTeamName(),
                        u.getTotalPoints(),
                        u.getPointsByGameweek().getOrDefault(liveLeague.getCurrentGameweek(), 0),
                        liveLeague.getUsers().indexOf(u) + 1
                ))
                .toList();

        return new LeagueDto(liveLeague.getName(), summaries);
    }
}
