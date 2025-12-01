package com.fantasy.domain.league;

import com.fantasy.domain.transfer.TransferMarketService;
import com.fantasy.domain.transfer.TurnOrderDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/league-admin")
public class LeagueAdminController {

    private final TransferMarketService transferMarketService;

    public LeagueAdminController(TransferMarketService transferMarketService) {
        this.transferMarketService = transferMarketService;
    }

    @PostMapping("/manual-turn/{gwId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> setTurnOrder(@PathVariable int gwId, @RequestBody TurnOrderDto dto) {
        transferMarketService.setManualTurnOrder(gwId, dto);
        return ResponseEntity.ok().build();
    }
}