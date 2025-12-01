package com.fantasy.domain.score;

import com.fantasy.domain.game.GameweekHistoryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
public class PointsController {

    private final PointsService pointsService;

    public PointsController(PointsService pointsService) {
        this.pointsService = pointsService;
    }

    @GetMapping("/{userId}/calc")
    public int calculatePointsForGameweek(@PathVariable int userId, @RequestParam int gw) {
        return pointsService.calculateAndPersist(userId, gw);
    }

    @GetMapping("/{userId}/{gwId}")
    public ResponseEntity<Integer> getUserPointsForGameWeek(@PathVariable int userId, @PathVariable int gwId) {
        int points = pointsService.getUserPointsForGameWeek(userId, gwId);
        return ResponseEntity.ok(points);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Integer> getUserTotalPoints(@PathVariable int userId) {
        int points = pointsService.getUserTotalPoints(userId);
        return ResponseEntity.ok(points);
    }

    @GetMapping("/{userId}/history")
    public ResponseEntity<List<GameweekHistoryDto>> getUserHistory(@PathVariable Integer userId) {
        List<GameweekHistoryDto> history = pointsService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }
}
