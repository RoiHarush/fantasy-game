package com.fantasy.domain.transfer;

import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.team.IRSignRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class TransferMarketController {

    private final TransferMarketService marketService;

    public TransferMarketController(TransferMarketService marketService) {
        this.marketService = marketService;
    }

    @PostMapping("/transfer")
    public ResponseEntity<String> makeTransfer(@RequestBody TransferRequestDto request, Authentication authentication) {
        try {
            request.setUserId(authenticatedUserId(authentication));
            marketService.processTransfer(request);
            return ResponseEntity.ok("Transfer successful");
        } catch (FantasyTeamException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/pass")
    public ResponseEntity<String> passTurn(@RequestParam(required = false) Integer userId,
                                           Authentication authentication) {
        try {
            marketService.passTurn(authenticatedUserId(authentication));
            return ResponseEntity.ok("Turn passed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/ir-sign")
    public ResponseEntity<String> signIR(@RequestBody IRSignRequestDto request, Authentication authentication) {
        try {
            request.setUserId(authenticatedUserId(authentication));
            marketService.replaceIRPlayer(request);
            return ResponseEntity.ok("IR Signed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/open/{gwId}")
    public ResponseEntity<String> openWindow(@PathVariable int gwId, Authentication authentication) {
        try {
            marketService.openTransferWindowForUser(authenticatedUserId(authentication), gwId);
            return ResponseEntity.ok("Window opened");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/turn-order/{gwId}")
    public ResponseEntity<List<Integer>> getTurns(@PathVariable int gwId, Authentication authentication) {
        return ResponseEntity.ok(marketService.getCurrentTurnOrder(authenticatedUserId(authentication), gwId));
    }


    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState(Authentication authentication) {
        return ResponseEntity.ok(marketService.getCurrentWindowState(authenticatedUserId(authentication)));
    }

    @PostMapping("/draft-pick/{playerId}")
    public ResponseEntity<String> makeDraftPick(@PathVariable int playerId,
                                                 Authentication authentication) {
        try {
            marketService.processDraftPick(authenticatedUserId(authentication), playerId);
            return ResponseEntity.ok("Draft pick completed");
        } catch (FantasyTeamException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
