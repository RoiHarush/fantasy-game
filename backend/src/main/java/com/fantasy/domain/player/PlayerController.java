package com.fantasy.domain.player;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import com.fantasy.domain.league.LeagueAccessService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;
    private final LeagueAccessService leagueAccessService;

    public PlayerController(PlayerService playerService,
                            LeagueAccessService leagueAccessService) {
        this.playerService = playerService;
        this.leagueAccessService = leagueAccessService;
    }


    @GetMapping
    public List<PlayerDto> getPlayers(Authentication authentication) {
        Integer userId = authentication != null ? Integer.parseInt(authentication.getName()) : null;
        return playerService.getAllPlayers(userId);
    }

    @GetMapping("/{playerId}/match-stats")
    public PlayerMatchStatsDto getMatchStats(
            @PathVariable int playerId,
            @RequestParam int gw,
            @RequestParam(required = false) Integer userId,
            Authentication authentication
    ) {
        if (userId != null) {
            if (authentication == null) {
                userId = null;
            } else {
                leagueAccessService.requireSameLeague(Integer.parseInt(authentication.getName()), userId);
            }
        }
        return playerService.getMatchStats(playerId, gw, userId);
    }

    @GetMapping("/{playerId}/all-stats")
    public List<PlayerMatchStatsDto> getAllMatchStats(@PathVariable int playerId) {
        return playerService.getAllMatchStats(playerId);
    }

    @GetMapping("/squad-data")
    public ResponseEntity<List<PlayerDataDto>> getSquadData(
            @RequestParam int userId,
            @RequestParam int gw,
            Authentication authentication) {
        leagueAccessService.requireSameLeague(Integer.parseInt(authentication.getName()), userId);
        List<PlayerDataDto> result = playerService.getSquadDataForGameweek(userId, gw);
        return ResponseEntity.ok(result);
    }

}
