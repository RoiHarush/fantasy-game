package com.fantasy.api;

import com.fantasy.application.PlayerDataService;
import com.fantasy.application.PlayerMatchStatsService;
import com.fantasy.dto.*;
import com.fantasy.application.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/player-assisted/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerAssistedDto>> getPlayersAssistForGameWeek(@PathVariable int gwId){
        List<PlayerAssistedDto> result = playerService.getPlayersAssistForGameWeek(gwId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/update-assist")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerAssistedDto> updatePlayerAssist(@RequestBody UpdateAssistRequest request) {
        if (request.getPlayerId() == 0 || request.getGameweek() == 0 || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }

        PlayerAssistedDto updated = playerService.updatePlayerAssist(request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/player-penalties/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerPenaltyDto>> getPlayersPenaltiesForGameWeek(@PathVariable int gwId){
        List<PlayerPenaltyDto> result = playerService.getPlayersPenaltiesForGameWeek(gwId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/update-penalty")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerPenaltyDto> updatePlayerPenalty(@RequestBody UpdatePenaltyRequest request) {
        if (request.getPlayerId() == 0 || request.getGameweek() == 0 || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }

        PlayerPenaltyDto updated = playerService.updatePlayerPenalty(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/toggle-lock")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerDto> togglePlayerLock(@RequestParam int playerId, @RequestParam boolean lock) {
        PlayerDto updated = playerService.togglePlayerLock(playerId, lock);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/locked-players")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerDto>> getLockedPlayers() {
        return ResponseEntity.ok(playerService.getLockedPlayers());
    }
}
