package com.fantasy.domain.game;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gameweeks")
public class GameWeekController {

    private final GameWeekService gameWeekService;

    public GameWeekController(GameWeekService gameWeekService) {
        this.gameWeekService = gameWeekService;
    }

    @GetMapping
    public List<GameWeekDto> getAllGameweeks() {
        return gameWeekService.getAllGameweeks().stream()
                .map(GameWeekMapper::toDto)
                .toList();
    }

    @GetMapping("/{gwId}/daily-status")
    public ResponseEntity<List<GameweekDailyStatusDto>> getDailyStatus(@PathVariable int gwId) {
        return ResponseEntity.ok(gameWeekService.getGameweekDailyStatus(gwId));
    }

    @GetMapping("/current")
    public GameWeekDto getCurrentGameweek() {
        return gameWeekService.getCurrentGameweek();
    }

    @GetMapping("/next")
    public GameWeekDto getNextGameweek() {
        return gameWeekService.getNextGameweek();
    }

    @GetMapping("/last")
    public GameWeekDto getLastFinishedGameweek() {
        return gameWeekService.getLastFinishedGameweek();
    }

}

