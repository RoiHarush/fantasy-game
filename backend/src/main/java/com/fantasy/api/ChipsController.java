package com.fantasy.api;

import com.fantasy.application.ChipsService;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserChipsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chips")
public class ChipsController {

    private final ChipsService chipsSrevice;

    public ChipsController(ChipsService chipsSrevice) {
        this.chipsSrevice = chipsSrevice;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserChipsDto> getUserChips(@PathVariable int userId) {
        return ResponseEntity.ok(chipsSrevice.getUserChips(userId));
    }

    @PostMapping("/ir")
    public ResponseEntity<SquadDto> assignIR(@RequestParam int userId, @RequestParam int playerId) {
        SquadDto updatedSquad = chipsSrevice.assignIR(userId, playerId);
        return ResponseEntity.ok(updatedSquad);
    }

    @PostMapping("/first-pick-captain")
    public ResponseEntity<SquadDto> assignFirstPickCaptain(@RequestParam int userId){
        SquadDto updatedSquad = chipsSrevice.assignFirstPickCaptain(userId);
        return ResponseEntity.ok(updatedSquad);
    }

    @PostMapping("/ir/release")
    public ResponseEntity<SquadDto> releaseIR(@RequestParam int userId, @RequestParam int playerOutId) {
        SquadDto updatedSquad = chipsSrevice.releaseIR(userId, playerOutId);
        return ResponseEntity.ok(updatedSquad);
    }

    @PostMapping("/first-pick-captain/release")
    public ResponseEntity<SquadDto> releaseFirstPickCaptain(@RequestParam int userId){
        SquadDto updatedSquad = chipsSrevice.releaseFirstPickCaptain(userId);
        return ResponseEntity.ok(updatedSquad);
    }
}

