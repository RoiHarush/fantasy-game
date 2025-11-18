package com.fantasy.api;

import com.fantasy.application.TurnService;
import com.fantasy.dto.TurnOrderDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/league-admin")
public class LeagueAdminController {

    private final TurnService turnService;

    public LeagueAdminController(TurnService turnService) {
        this.turnService = turnService;
    }

    @PostMapping("/manual-turn/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<String> setTurns(
            @PathVariable int gwId,
            @RequestBody TurnOrderDto dto) {
        try {
            turnService.setTurns(gwId, dto);
            return ResponseEntity.ok("Turn order updated successfully for GW " + gwId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to set turns: " + e.getMessage());
        }
    }

    @GetMapping("/manual-turn/{gwId}")
    public ResponseEntity<List<Integer>> getTurns(@PathVariable int gwId) {
        return ResponseEntity.ok(turnService.getCurrentTurnOrder(gwId));
    }
}