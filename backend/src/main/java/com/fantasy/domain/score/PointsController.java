package com.fantasy.domain.score;

import com.fantasy.domain.game.GameweekHistoryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.fantasy.domain.league.LeagueAccessService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
public class PointsController {

    private final PointsService pointsService;
    private final LeagueAccessService leagueAccessService;

    public PointsController(PointsService pointsService, LeagueAccessService leagueAccessService) {
        this.pointsService = pointsService;
        this.leagueAccessService = leagueAccessService;
    }

    @PostMapping("/{userId}/calc")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public int calculatePointsForGameweek(@PathVariable int userId,
                                          @RequestParam int gw,
                                          Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        return pointsService.calculateAndPersist(userId, gw);
    }

    @GetMapping("/{userId}/{gwId}")
    public ResponseEntity<Integer> getUserPointsForGameWeek(@PathVariable int userId,
                                                            @PathVariable int gwId,
                                                            Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        int points = pointsService.getUserPointsForGameWeek(userId, gwId);
        return ResponseEntity.ok(points);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Integer> getUserTotalPoints(@PathVariable int userId, Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        int points = pointsService.getUserTotalPoints(userId);
        return ResponseEntity.ok(points);
    }

    @GetMapping("/{userId}/{gwId}/live")
    public ResponseEntity<Integer> getLiveUserPoints(@PathVariable int userId,
                                                     @PathVariable int gwId,
                                                     Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        int livePoints = pointsService.calculateLiveUserPoints(userId, gwId);
        return ResponseEntity.ok(livePoints);
    }

    @GetMapping("/{userId}/history")
    public ResponseEntity<List<GameweekHistoryDto>> getUserHistory(@PathVariable Integer userId,
                                                                   Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        List<GameweekHistoryDto> history = pointsService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
