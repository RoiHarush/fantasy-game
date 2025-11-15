package com.fantasy.api;

import com.fantasy.dto.SquadDto;
import com.fantasy.application.*;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {


    private final PlayerSyncService playerSyncService;
    private final GameWeekService gameWeekService;
    private final PlayerService playerService;
    private final PickTeamService pickTeamService;
    private final UserRepository userRepo;
    private final UserSquadRepository squadRepo;
    private final TransferWindowService transferWindowService;
    private final GameweekManager gameweekManager;

    @Autowired
    public AdminController(PlayerSyncService playerSyncService,
                           GameWeekService gameWeekService,
                           PlayerService playerService,
                           PickTeamService pickTeamService,
                           UserRepository userRepo,
                           UserSquadRepository squadRepo,
                           TransferWindowService transferWindowService,
                           GameweekManager gameweekManager) {
        this.playerSyncService = playerSyncService;
        this.gameWeekService = gameWeekService;
        this.playerService = playerService;
        this.pickTeamService = pickTeamService;
        this.userRepo = userRepo;
        this.squadRepo = squadRepo;
        this.transferWindowService = transferWindowService;
        this.gameweekManager = gameweekManager;
    }


    @PostMapping("/gameweeks")
    public void updateGameweeks(){
        gameWeekService.loadFromApiAndSave();
    }

    @PostMapping("/players/update-current")
    public ResponseEntity<Void> updateCurrentGwPoints(@RequestParam int gw) {
        playerService.updateCurrentGameweekPoints(gw);
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
            gameweekManager.openNextGameweek(gw);
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
            gameweekManager.processGameweek(gameweek);
            message =  "[ADMIN] Auto-adjust completed for all users (GW " + gameweek + ")";
        }catch (Exception e){
            e.printStackTrace();
            message =  "[ADMIN] Auto-adjust failed (GW " + gameweek + ")";
        }
        return message;
    }
}
