package com.fantasy.api;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.*;
import com.fantasy.domain.realWorldData.TeamName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fpl")
@CrossOrigin(origins = "http://localhost:5173")
public class FplProxyController {

    private static final Logger log = LoggerFactory.getLogger(FplProxyController.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final GameWeekService gameWeekService;
    private final PlayerRegistry playerRegistry;
    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;

    public FplProxyController(GameWeekService gameWeekService,
                              PlayerRegistry playerRegistry,
                              PlayerRepository playerRepo,
                              PlayerPointsRepository pointsRepo) {
        this.gameWeekService = gameWeekService;
        this.playerRegistry = playerRegistry;
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
    }

    @GetMapping("/dream-team/{gw}")
    public ResponseEntity<?> getDreamTeam(@PathVariable int gw) {
        try {
            String url = "https://fantasy.premierleague.com/api/dream-team/" + gw + "/";
            Map<String, Object> apiData = restTemplate.getForObject(url, Map.class);

            if (apiData == null || !apiData.containsKey("team")) {
                return ResponseEntity.ok(Map.of("team", List.of()));
            }

            List<Map<String, Object>> fplTeam = (List<Map<String, Object>>) apiData.get("team");

            List<Map<String, Object>> result = new ArrayList<>();

            for (Map<String, Object> entry : fplTeam) {
                int playerId = (int) entry.get("element");

                Player player = playerRegistry.findById(playerId);
                if (player == null) continue;

                Map<String, Object> p = new LinkedHashMap<>();
                p.put("name", player.getViewName());
                p.put("team", TeamName.fromId(player.getTeamId()).getCode());
                p.put("teamId", player.getTeamId());
                p.put("position", player.getPosition().getCode());
                p.put("points", player.getPointsByGameweek().getOrDefault(gw, 0));

                result.add(p);
            }

            return ResponseEntity.ok(Map.of("team", result));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch dream team"));
        }
    }

    @GetMapping("/players-of-the-week")
    public ResponseEntity<?> getPlayersOfTheWeek() {
        try {
            List<Map<String, Object>> result = new ArrayList<>();

            int currentGw = gameWeekService.getCurrentGameweek().getId();

            for (int gw = 1; gw <= currentGw; gw++) {

                PlayerPointsEntity topScorerPoints = pointsRepo.findFirstByGameweekOrderByPointsDesc(gw);

                if (topScorerPoints != null) {
                    PlayerEntity player = topScorerPoints.getPlayer();

                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id", player.getId());
                    entry.put("gameweek", gw);
                    entry.put("playerName", player.getViewName());
                    entry.put("teamId", player.getTeamId());
                    entry.put("points", topScorerPoints.getPoints());
                    entry.put("photo", player.getPhoto());
                    entry.put("position", player.getPosition().getCode());

                    result.add(entry);
                }
            }

            return ResponseEntity.ok(Map.of("playersOfTheWeek", result));

        } catch (Exception e) {
            log.error("Error fetching players of the week internally", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch players of the week"));
        }
    }
}