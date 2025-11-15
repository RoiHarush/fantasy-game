package com.fantasy.api;

import com.fantasy.dto.SquadDto;
import com.fantasy.application.PickTeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pick")
public class PickTeamController {

    private final PickTeamService pickTeamService;

    public PickTeamController(PickTeamService pickTeamService) {
        this.pickTeamService = pickTeamService;
    }

    @PostMapping
    public ResponseEntity<?> pickTeam(@RequestParam int userId,
                                      @RequestBody SquadDto squadDto) {
        try {
            SquadDto savedSquad = pickTeamService.saveTeam(userId, squadDto);
            return ResponseEntity.ok(savedSquad);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

