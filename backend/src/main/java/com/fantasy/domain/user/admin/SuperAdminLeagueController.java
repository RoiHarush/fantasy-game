package com.fantasy.domain.user.admin;

import com.fantasy.domain.league.LeagueDetailsDto;
import com.fantasy.domain.league.LeagueManagementService;
import com.fantasy.domain.league.LeaguePlayerAdminService;
import com.fantasy.domain.league.UpdateLeagueSettingsRequest;
import com.fantasy.domain.player.PlayerAssistedDto;
import com.fantasy.domain.player.PlayerDto;
import com.fantasy.domain.player.PlayerPenaltyDto;
import com.fantasy.domain.player.UpdateAssistRequest;
import com.fantasy.domain.player.UpdatePenaltyRequest;
import com.fantasy.domain.player.UpdatePositionRequest;
import com.fantasy.domain.transfer.DraftConfig;
import com.fantasy.domain.transfer.DraftService;
import com.fantasy.domain.transfer.SaveWaiverPlanRequest;
import com.fantasy.domain.transfer.TransferMarketService;
import com.fantasy.domain.transfer.TurnOrderDto;
import com.fantasy.domain.transfer.WaiverEntryDto;
import com.fantasy.domain.transfer.WaiverPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/leagues")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
public class SuperAdminLeagueController {

    private final LeagueManagementService leagueManagementService;
    private final LeaguePlayerAdminService playerAdminService;
    private final DraftService draftService;
    private final TransferMarketService transferMarketService;
    private final WaiverPlanService waiverPlanService;

    public SuperAdminLeagueController(LeagueManagementService leagueManagementService,
                                      LeaguePlayerAdminService playerAdminService,
                                      DraftService draftService,
                                      TransferMarketService transferMarketService,
                                      WaiverPlanService waiverPlanService) {
        this.leagueManagementService = leagueManagementService;
        this.playerAdminService = playerAdminService;
        this.draftService = draftService;
        this.transferMarketService = transferMarketService;
        this.waiverPlanService = waiverPlanService;
    }

    @GetMapping
    public List<LeagueDetailsDto> getLeagues() {
        return leagueManagementService.getLeaguesForMaintenance();
    }

    @GetMapping("/{leagueId}")
    public LeagueDetailsDto getLeague(@PathVariable long leagueId) {
        return leagueManagementService.getLeagueForMaintenance(leagueId);
    }

    @PutMapping("/{leagueId}/settings")
    public LeagueDetailsDto updateSettings(@PathVariable long leagueId,
                                           @RequestBody UpdateLeagueSettingsRequest request) {
        return leagueManagementService.updateSettingsForMaintenance(leagueId, request);
    }

    @GetMapping("/{leagueId}/players/assists/{gameweek}")
    public List<PlayerAssistedDto> getAssists(@PathVariable long leagueId,
                                               @PathVariable int gameweek) {
        return playerAdminService.getAssistsForLeague(leagueId, gameweek);
    }

    @PostMapping("/{leagueId}/players/assists")
    public PlayerAssistedDto updateAssist(@PathVariable long leagueId,
                                          @RequestBody UpdateAssistRequest request) {
        return playerAdminService.updateAssistForLeague(leagueId, request);
    }

    @GetMapping("/{leagueId}/players/penalties/{gameweek}")
    public List<PlayerPenaltyDto> getPenalties(@PathVariable long leagueId,
                                                @PathVariable int gameweek) {
        return playerAdminService.getPenaltiesForLeague(leagueId, gameweek);
    }

    @PostMapping("/{leagueId}/players/penalties")
    public PlayerPenaltyDto updatePenalty(@PathVariable long leagueId,
                                          @RequestBody UpdatePenaltyRequest request) {
        return playerAdminService.updatePenaltyForLeague(leagueId, request);
    }

    @GetMapping("/{leagueId}/players/locked")
    public List<PlayerDto> getLockedPlayers(@PathVariable long leagueId) {
        return playerAdminService.getLockedPlayersForLeague(leagueId);
    }

    @PostMapping("/{leagueId}/players/{playerId}/lock")
    public PlayerDto setPlayerLocked(@PathVariable long leagueId,
                                     @PathVariable int playerId,
                                     @RequestParam boolean locked) {
        return playerAdminService.setPlayerLockedForLeague(leagueId, playerId, locked);
    }

    @PostMapping("/{leagueId}/players/position")
    public ResponseEntity<Void> updatePlayerPosition(@PathVariable long leagueId,
                                                     @RequestBody UpdatePositionRequest request) {
        playerAdminService.updatePlayerPositionForLeague(leagueId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{leagueId}/draft")
    public DraftConfig getDraft(@PathVariable long leagueId) {
        return draftService.getDraftConfigForLeague(leagueId);
    }

    @PostMapping("/{leagueId}/draft/schedule")
    public ResponseEntity<Void> scheduleDraft(@PathVariable long leagueId,
                                              @RequestBody DraftScheduleRequest request) {
        draftService.scheduleDraftForLeague(leagueId, request.scheduledTime());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{leagueId}/draft")
    public ResponseEntity<Void> deleteDraft(@PathVariable long leagueId) {
        draftService.deleteDraftConfigForLeague(leagueId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{leagueId}/draft/open-now")
    public ResponseEntity<Void> openDraftNow(@PathVariable long leagueId) {
        draftService.runSnakeDraft(leagueId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{leagueId}/turn-order/{gameweek}")
    public ResponseEntity<Void> setTurnOrder(@PathVariable long leagueId,
                                             @PathVariable int gameweek,
                                             @RequestBody TurnOrderDto request) {
        transferMarketService.setManualTurnOrderForLeague(leagueId, gameweek, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{leagueId}/users/{userId}/waivers/{gameweek}")
    public List<WaiverEntryDto> getWaivers(@PathVariable long leagueId,
                                           @PathVariable int userId,
                                           @PathVariable int gameweek) {
        return waiverPlanService.getPlanForUser(leagueId, userId, gameweek);
    }

    @PutMapping("/{leagueId}/users/{userId}/waivers/{gameweek}")
    public List<WaiverEntryDto> saveWaivers(@PathVariable long leagueId,
                                            @PathVariable int userId,
                                            @PathVariable int gameweek,
                                            @RequestBody SaveWaiverPlanRequest request) {
        return waiverPlanService.savePlanForUser(leagueId, userId, gameweek, request);
    }

    @DeleteMapping("/{leagueId}/users/{userId}/waivers/{gameweek}")
    public ResponseEntity<Void> deleteWaivers(@PathVariable long leagueId,
                                              @PathVariable int userId,
                                              @PathVariable int gameweek) {
        waiverPlanService.deletePlanForUser(leagueId, userId, gameweek);
        return ResponseEntity.noContent().build();
    }

    public record DraftScheduleRequest(LocalDateTime scheduledTime) {}
}
