package com.fantasy.api;

import com.fantasy.application.TransferWindowService;
import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.domain.user.User;
import com.fantasy.dto.IRSignRequestDto;
import com.fantasy.dto.TransferRequestDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transfer-window")
public class TransferWindowController {

    private final TransferWindowService transferWindowService;

    public TransferWindowController(TransferWindowService transferWindowService) {
        this.transferWindowService = transferWindowService;
    }

    @PostMapping("/sign")
    public ResponseEntity<String> makeTransfer(@RequestBody TransferRequestDto request) {
        try {
            transferWindowService.processTransfer(request);
            return ResponseEntity.ok("Transfer completed successfully");
        } catch (FantasyTeamException e) {
            return ResponseEntity.badRequest().body("Transfer failed: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(transferWindowService.getCurrentWindowState());
    }

    @PostMapping("/pass")
    public ResponseEntity<String> passTurn(@RequestParam int userId) {
        try {
            if (!transferWindowService.isActiveWindow())
                return ResponseEntity.badRequest().body("Transfer window not active");

            var currentUserId = transferWindowService.getCurrentUserId().orElse(-1);
            if (currentUserId != userId)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your turn to pass");

            transferWindowService.endTurn();
            transferWindowService.broadcastPass(userId);
            return ResponseEntity.ok("Turn passed successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error while passing turn: " + e.getMessage());
        }
    }

    @PostMapping("/replace-ir")
    public ResponseEntity<String> replaceIRPlayer(@RequestBody IRSignRequestDto request) {
        try {
            transferWindowService.replaceIRPlayer(request);
            return ResponseEntity.ok("IR player signed successfully");
        } catch (FantasyTeamException e) {
            return ResponseEntity.badRequest().body("IR signing failed: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }


}