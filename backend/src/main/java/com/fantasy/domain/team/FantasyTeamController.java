package com.fantasy.domain.team;

import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.team.Exceptions.IRException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class FantasyTeamController {

    private static final Logger log = LoggerFactory.getLogger(FantasyTeamController.class);
    private final FantasyTeamService fantasyTeamService;

    public FantasyTeamController(FantasyTeamService fantasyTeamService) {
        this.fantasyTeamService = fantasyTeamService;
    }

    @GetMapping("/{userId}/squad")
    public ResponseEntity<SquadDto> getSquad(@PathVariable int userId, @RequestParam(required = false) Integer gw) {
        return ResponseEntity.ok(fantasyTeamService.getSquadForGameweek(userId, gw));
    }

    @PostMapping("/{userId}/save")
    public ResponseEntity<?> saveTeam(@PathVariable int userId, @RequestBody SquadDto squadDto) {
        try {
            SquadDto saved = fantasyTeamService.saveTeam(userId, squadDto);
            return ResponseEntity.ok(saved);
        } catch (FantasyTeamException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error saving team", e);
            return ResponseEntity.internalServerError().body("Error saving team");
        }
    }

    @PostMapping("/{userId}/save/prev/{gw}")
    public ResponseEntity<?> saveTeamForPrevGw(@PathVariable int userId, @PathVariable int gw, @RequestBody SquadDto dto) {
        fantasyTeamService.saveTeamForPrevGameweek(userId, dto, gw);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/chips")
    public ResponseEntity<UserChipsDto> getUserChips(@PathVariable int userId) {
        return ResponseEntity.ok(fantasyTeamService.getUserChips(userId));
    }

    @PostMapping("/{userId}/chips/ir")
    public ResponseEntity<?> assignIR(@PathVariable int userId, @RequestParam int playerId) {
        try {
            return ResponseEntity.ok(fantasyTeamService.assignIR(userId, playerId));
        } catch (IRException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{userId}/chips/ir/release")
    public ResponseEntity<?> releaseIR(@PathVariable int userId, @RequestParam int playerOutId) {
        return ResponseEntity.ok(fantasyTeamService.releaseIR(userId, playerOutId));
    }

    @PostMapping("/{userId}/chips/first-pick-captain")
    public ResponseEntity<?> assignFirstPickCaptain(@PathVariable int userId) {
        return ResponseEntity.ok(fantasyTeamService.assignFirstPickCaptain(userId));
    }

    @PostMapping("/{userId}/chips/first-pick-captain/release")
    public ResponseEntity<?> releaseFirstPickCaptain(@PathVariable int userId) {
        return ResponseEntity.ok(fantasyTeamService.releaseFirstPickCaptain(userId));
    }

    @GetMapping("/ir-status")
    public ResponseEntity<List<IrStatusDto>> getIrStatus() {
        return ResponseEntity.ok(fantasyTeamService.getIrStatuses());
    }

    @GetMapping("/{userId}/watchlist")
    public ResponseEntity<List<Integer>> getWatchlist(@PathVariable int userId) {
        return ResponseEntity.ok(fantasyTeamService.getWatchlist(userId));
    }

    @PostMapping("/{userId}/watchlist/add")
    public ResponseEntity<Void> addToWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body) {
        fantasyTeamService.addToWatchlist(userId, body.get("playerId"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/watchlist/remove")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body) {
        fantasyTeamService.removeFromWatchlist(userId, body.get("playerId"));
        return ResponseEntity.ok().build();
    }
}