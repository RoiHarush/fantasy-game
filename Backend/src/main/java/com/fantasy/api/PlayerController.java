package com.fantasy.api;

import com.fantasy.application.PlayerDataService;
import com.fantasy.application.PlayerMatchStatsService;
import com.fantasy.dto.PlayerDataDto;
import com.fantasy.dto.PlayerDto;
import com.fantasy.dto.PlayerMatchStatsDto;
import com.fantasy.application.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;
    private final PlayerMatchStatsService matchStatsService;
    private final PlayerDataService playerDataService;

    public PlayerController(PlayerService playerService,
                            PlayerMatchStatsService matchStatsService,
                            PlayerDataService playerDataService) {
        this.playerService = playerService;
        this.matchStatsService = matchStatsService;
        this.playerDataService = playerDataService;
    }

    @GetMapping
    public List<PlayerDto> getPlayers() {
        return playerService.getAllPlayers();
    }

    @GetMapping("/{playerId}/match-stats")
    public PlayerMatchStatsDto getMatchStats(
            @PathVariable int playerId,
            @RequestParam int gw,
            @RequestParam(required = false) Integer userId
    ) {
        return matchStatsService.getMatchStats(playerId, gw, userId);
    }

    @GetMapping("/{playerId}/all-stats")
    public List<PlayerMatchStatsDto> getAllMatchStats(@PathVariable int playerId) {
        return matchStatsService.getAllMatchStats(playerId);
    }

    @GetMapping("/user/{userId}/gameweek/{gwId}")
    public ResponseEntity<List<PlayerDataDto>> getSquadData(
            @PathVariable int userId,
            @PathVariable int gwId) {
        List<PlayerDataDto> result = playerDataService.getSquadDataForGameweek(userId, gwId);
        return ResponseEntity.ok(result);
    }
}
