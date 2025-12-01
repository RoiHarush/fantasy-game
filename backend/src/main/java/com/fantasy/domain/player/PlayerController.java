package com.fantasy.domain.player;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;
    private final PlayerSyncService playerSyncService;

    public PlayerController(PlayerService playerService,
                            PlayerSyncService playerSyncService) {
        this.playerService = playerService;
        this.playerSyncService = playerSyncService;
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
        return playerService.getMatchStats(playerId, gw, userId);
    }

    @GetMapping("/{playerId}/all-stats")
    public List<PlayerMatchStatsDto> getAllMatchStats(@PathVariable int playerId) {
        return playerService.getAllMatchStats(playerId);
    }

    @GetMapping("/squad-data")
    public ResponseEntity<List<PlayerDataDto>> getSquadData(
            @RequestParam int userId,
            @RequestParam int gw) {
        List<PlayerDataDto> result = playerService.getSquadDataForGameweek(userId, gw);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/player-assisted/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerAssistedDto>> getPlayersAssistForGameWeek(@PathVariable int gwId){
        List<PlayerAssistedDto> result = playerService.getPlayersAssistForGameWeek(gwId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/player-penalties/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerPenaltyDto>> getPlayersPenaltiesForGameWeek(@PathVariable int gwId){
        List<PlayerPenaltyDto> result = playerService.getPlayersPenaltiesForGameWeek(gwId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/locked-players")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PlayerDto>> getLockedPlayers() {
        return ResponseEntity.ok(playerService.getLockedPlayers());
    }


    @PostMapping("/admin/update-assist")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerAssistedDto> updatePlayerAssist(@RequestBody UpdateAssistRequest request) {
        if (request.getPlayerId() == 0 || request.getGameweek() == 0 || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        PlayerAssistedDto updated = playerSyncService.updatePlayerAssist(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/admin/update-penalty")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerPenaltyDto> updatePlayerPenalty(@RequestBody UpdatePenaltyRequest request) {
        if (request.getPlayerId() == 0 || request.getGameweek() == 0 || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        PlayerPenaltyDto updated = playerSyncService.updatePlayerPenalty(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/toggle-lock")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PlayerDto> togglePlayerLock(@RequestParam int playerId, @RequestParam boolean lock) {
        PlayerDto updated = playerSyncService.togglePlayerLock(playerId, lock);
        return ResponseEntity.ok(updated);
    }
}