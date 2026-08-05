package com.fantasy.domain.league;

import com.fantasy.domain.transfer.TransferMarketService;
import com.fantasy.domain.transfer.TurnOrderDto;
import com.fantasy.domain.player.PlayerAssistedDto;
import com.fantasy.domain.player.PlayerDto;
import com.fantasy.domain.player.PlayerPenaltyDto;
import com.fantasy.domain.player.UpdateAssistRequest;
import com.fantasy.domain.player.UpdatePositionRequest;
import com.fantasy.domain.player.UpdatePenaltyRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/league-admin")
public class LeagueAdminController {

    private final TransferMarketService transferMarketService;
    private final LeaguePlayerAdminService leaguePlayerAdminService;

    public LeagueAdminController(TransferMarketService transferMarketService,
                                 LeaguePlayerAdminService leaguePlayerAdminService) {
        this.transferMarketService = transferMarketService;
        this.leaguePlayerAdminService = leaguePlayerAdminService;
    }

    @PostMapping("/manual-turn/{gwId}")
    public ResponseEntity<Void> setTurnOrder(@PathVariable int gwId,
                                             @RequestBody TurnOrderDto dto,
                                             Authentication authentication) {
        transferMarketService.setManualTurnOrder(Integer.parseInt(authentication.getName()), gwId, dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/players/assists/{gwId}")
    public ResponseEntity<List<PlayerAssistedDto>> getAssists(@PathVariable int gwId,
                                                               Authentication authentication) {
        return ResponseEntity.ok(leaguePlayerAdminService.getAssists(userId(authentication), gwId));
    }

    @PostMapping("/players/assists")
    public ResponseEntity<PlayerAssistedDto> updateAssist(@RequestBody UpdateAssistRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(leaguePlayerAdminService.updateAssist(userId(authentication), request));
    }

    @GetMapping("/players/penalties/{gwId}")
    public ResponseEntity<List<PlayerPenaltyDto>> getPenalties(@PathVariable int gwId,
                                                                Authentication authentication) {
        return ResponseEntity.ok(leaguePlayerAdminService.getPenalties(userId(authentication), gwId));
    }

    @PostMapping("/players/penalties")
    public ResponseEntity<PlayerPenaltyDto> updatePenalty(@RequestBody UpdatePenaltyRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(leaguePlayerAdminService.updatePenalty(userId(authentication), request));
    }

    @GetMapping("/players/locked")
    public ResponseEntity<List<PlayerDto>> getLockedPlayers(Authentication authentication) {
        return ResponseEntity.ok(leaguePlayerAdminService.getLockedPlayers(userId(authentication)));
    }

    @PostMapping("/players/{playerId}/lock")
    public ResponseEntity<PlayerDto> setPlayerLocked(@PathVariable int playerId,
                                                      @RequestParam boolean locked,
                                                      Authentication authentication) {
        return ResponseEntity.ok(
                leaguePlayerAdminService.setPlayerLocked(userId(authentication), playerId, locked)
        );
    }

    @PostMapping("/players/position")
    public ResponseEntity<Void> updatePlayerPosition(@RequestBody UpdatePositionRequest request,
                                                      Authentication authentication) {
        leaguePlayerAdminService.updatePlayerPosition(userId(authentication), request);
        return ResponseEntity.ok().build();
    }

    private int userId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
