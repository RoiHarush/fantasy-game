package com.fantasy.api;

import com.fantasy.application.ChipsService;
import com.fantasy.domain.fantasyTeam.Exceptions.IRException;
import com.fantasy.domain.player.PlayerNotFoundException;
import com.fantasy.domain.user.Exceptions.UserNotFoundException;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserChipsDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chips")
public class ChipsController {

    private static final Logger log = LoggerFactory.getLogger(ChipsController.class);

    private final ChipsService chipsService;

    public ChipsController(ChipsService chipsService) {
        this.chipsService = chipsService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserChipsDto> getUserChips(@PathVariable int userId) {

        try {
            var dto = chipsService.getUserChips(userId);
            return ResponseEntity.ok(dto);

        } catch (UserNotFoundException ex) {
            log.warn("404 Chips not found for user {}", userId);
            return ResponseEntity.status(404).body(null);

        } catch (Exception ex) {
            log.error("500 while fetching chips for user {}", userId, ex);
            return ResponseEntity.status(500).body(null);
        }
    }


    @PostMapping("/ir")
    public ResponseEntity<?> assignIR(@RequestParam int userId, @RequestParam int playerId) {

        log.info("POST /chips/ir → request received (userId={}, playerId={})", userId, playerId);

        try {
            SquadDto updatedSquad = chipsService.assignIR(userId, playerId);
            log.info("POST /chips/ir → 200 OK (userId={})", userId);
            return ResponseEntity.ok(updatedSquad);

        } catch (UserNotFoundException | PlayerNotFoundException ex) {
            log.warn("POST /chips/ir → 404 NOT FOUND (reason={})", ex.getMessage());
            return ResponseEntity.status(404).body(ex.getMessage());

        } catch (IRException ex) {
            log.warn("POST /chips/ir → 409 CONFLICT (IR invalid)");
            return ResponseEntity.status(409).body(ex.getMessage());

        } catch (Exception ex) {
            log.error("POST /chips/ir → 500 INTERNAL_SERVER_ERROR (userId={})", userId, ex);
            return ResponseEntity.status(500).body("Server error");
        }
    }


    @PostMapping("/first-pick-captain")
    public ResponseEntity<SquadDto> assignFirstPickCaptain(@RequestParam int userId){
        SquadDto updatedSquad = chipsService.assignFirstPickCaptain(userId);
        return ResponseEntity.ok(updatedSquad);
    }

    @PostMapping("/ir/release")
    public ResponseEntity<SquadDto> releaseIR(@RequestParam int userId, @RequestParam int playerOutId) {
        SquadDto updatedSquad = chipsService.releaseIR(userId, playerOutId);
        return ResponseEntity.ok(updatedSquad);
    }

    @PostMapping("/first-pick-captain/release")
    public ResponseEntity<SquadDto> releaseFirstPickCaptain(@RequestParam int userId){
        SquadDto updatedSquad = chipsService.releaseFirstPickCaptain(userId);
        return ResponseEntity.ok(updatedSquad);
    }
}

