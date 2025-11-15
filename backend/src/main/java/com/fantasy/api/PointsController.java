package com.fantasy.api;

import com.fantasy.application.PointsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Integer> getUserPoints(@PathVariable int userId, @PathVariable int gwId) {
        int points = pointsService.getUserPointsForGameWeek(userId, gwId);
        return ResponseEntity.ok(points);
    }
}
