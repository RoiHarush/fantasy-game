package com.fantasy.api;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.dto.AdminUserDetailsDto;
import com.fantasy.dto.AdminUserSummaryDto;
import com.fantasy.dto.SquadDto;
import com.fantasy.application.*;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
public class SuperAdminController {


    private final PlayerSyncService playerSyncService;
    private final GameWeekService gameWeekService;
    private final PlayerService playerService;
    private final PickTeamService pickTeamService;
    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final TransferWindowService transferWindowService;
    private final GameweekManager gameweekManager;
    private final AdminUserService adminUserService;

    @Autowired
    public SuperAdminController(PlayerSyncService playerSyncService,
                                GameWeekService gameWeekService,
                                PlayerService playerService,
                                PickTeamService pickTeamService,
                                UserGameDataRepository gameDataRepo,
                                UserRepository userRepo,
                                TransferWindowService transferWindowService,
                                GameweekManager gameweekManager,
                                AdminUserService adminUserService) {
        this.playerSyncService = playerSyncService;
        this.gameWeekService = gameWeekService;
        this.playerService = playerService;
        this.pickTeamService = pickTeamService;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.transferWindowService = transferWindowService;
        this.gameweekManager = gameweekManager;
        this.adminUserService = adminUserService;
    }


    @PostMapping("/update-gameweeks")
    public void updateGameweeks(){
        gameWeekService.loadFromApiAndSave();
    }

    @PostMapping("/refresh-players")
    public void refreshPlayers(){
        playerService.refreshBasicPlayerData();
    }

    @PostMapping("/players/update-points")
    public ResponseEntity<Void> updateCurrentGwPoints(@RequestParam int gw) {
        playerService.updateGameweekPoints(gw);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/user/{userId}/squad/{gw}")
    public ResponseEntity<String> saveSquadForGameweek(
            @PathVariable int userId,
            @PathVariable int gw,
            @RequestBody SquadDto dto) {

        pickTeamService.saveTeamForPrevGameweek(userId, dto, gw);
        return ResponseEntity.ok("Squad for GW " + gw + " saved successfully for user " + userId);
    }

    @PostMapping("/sync-current")
    public ResponseEntity<String> syncCurrent() {
        playerSyncService.fullSyncCurrentGw();
        return ResponseEntity.ok("Synced current gameweek successfully.");
    }

    @PostMapping("/sync/")
    public ResponseEntity<String> syncForGw(@RequestParam int gw) {
        playerSyncService.fullSyncForGw(gw);
        return ResponseEntity.ok("Synced gameweek " + gw + " successfully.");
    }

    @PostMapping("/open-transfer-window/{gameweekId}")
    public ResponseEntity<String> openTransferWindow(@PathVariable int gameweekId) {
        try {
            transferWindowService.openTransferWindow(gameweekId);
            return ResponseEntity.ok("✅ Transfer window opened for GameWeek " + gameweekId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("❌ Failed to open window: " + e.getMessage());
        }
    }

    @PostMapping("/close-transfer-window")
    public ResponseEntity<String> closeTransferWindow() {
        try {
            transferWindowService.closeWindow();
            return ResponseEntity.ok("🏁 Transfer window closed successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("❌ Failed to close window: " + e.getMessage());
        }
    }

    @PostMapping("/open/{gw}")
    public ResponseEntity<String> openNextGameweek(@PathVariable int gw) {
        try {
            gameweekManager.openNextGameweek(gw, true);
            return ResponseEntity.ok("Gameweek " + gw + " opened successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to open Gameweek " + gw + ": " + e.getMessage());
        }
    }

    @PostMapping("/process-gameweek/{gameweek}")
    public String processGameweek(@PathVariable int gameweek) {
        String message;
        try {
            gameweekManager.processGameweek(gameweek, true);
            message =  "[ADMIN] Auto-adjust completed for all users (GW " + gameweek + ")";
        }catch (Exception e){
            message =  "[ADMIN] Auto-adjust failed (GW " + gameweek + ")";
        }
        return message;
    }

    @GetMapping("/users-summary")
    public ResponseEntity<List<AdminUserSummaryDto>> getUsersSummary() {
        List<UserEntity> users = userRepo.findAll();
        Map<Integer, UserGameDataEntity> gameDataMap = gameDataRepo.findAll().stream()
                .collect(Collectors.toMap(gd -> gd.getUser().getId(), gd -> gd));

        List<AdminUserSummaryDto> summaryList = users.stream()
                .map(user -> {
                    UserGameDataEntity gameData = gameDataMap.get(user.getId());
                    return new AdminUserSummaryDto(
                            user.getId(),
                            user.getUsername(),
                            user.getRole().name(),
                            gameData != null ? gameData.getFantasyTeamName() : "N/A",
                            gameData != null ? gameData.getTotalPoints() : 0
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(summaryList);
    }

    @GetMapping("/user-details/{userId}")
    public ResponseEntity<AdminUserDetailsDto> getFullUserDetails(@PathVariable int userId) {
        try {
            AdminUserDetailsDto userDetails = adminUserService.getFullUserDetails(userId);
            return ResponseEntity.ok(userDetails);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/user-details/{userId}")
    public ResponseEntity<Void> updateFullUserDetails(@PathVariable int userId, @RequestBody AdminUserDetailsDto dto) {
        try {
            adminUserService.updateFullUserDetails(userId, dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
