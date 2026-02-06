package com.fantasy.domain.transfer;

import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.team.IRSignRequestDto;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<String> makeTransfer(@RequestBody TransferRequestDto request) {
        try {
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
    public ResponseEntity<String> passTurn(@RequestParam int userId) {
        try {
            marketService.passTurn(userId);
            return ResponseEntity.ok("Turn passed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/ir-sign")
    public ResponseEntity<String> signIR(@RequestBody IRSignRequestDto request) {
        try {
            marketService.replaceIRPlayer(request);
            return ResponseEntity.ok("IR Signed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/open/{gwId}")
    public ResponseEntity<String> openWindow(@PathVariable int gwId) {
        try {
            marketService.openTransferWindow(gwId);
            return ResponseEntity.ok("Window opened");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/turn-order/{gwId}")
    public ResponseEntity<List<Integer>> getTurns(@PathVariable int gwId) {
        return ResponseEntity.ok(marketService.getCurrentTurnOrder(gwId));
    }


    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(marketService.getCurrentWindowState());
    }
}