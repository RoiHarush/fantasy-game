package com.fantasy.api;

import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.dto.TransferRequestDto;
import com.fantasy.application.TransferWindowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferWindowService transferWindowService;

    public TransferController(TransferWindowService transferWindowService) {
        this.transferWindowService = transferWindowService;
    }

    @PostMapping
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
}

