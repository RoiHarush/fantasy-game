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
public class FplProxyController {

    private static final Logger log = LoggerFactory.getLogger(FplProxyController.class);

    private final RestTemplate restTemplate;
    private final GameWeekService gameWeekService;
    private final PlayerRepository playerRepository;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerService playerService;

    public FplProxyController(GameWeekService gameWeekService,
                              PlayerRepository playerRepository,
                              PlayerPointsRepository pointsRepo,
                              PlayerService playerService,
                              RestTemplate restTemplate) {
        this.gameWeekService = gameWeekService;
        this.playerRepository = playerRepository;
        this.pointsRepo = pointsRepo;
        this.playerService = playerService;
        this.restTemplate = restTemplate;
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

                PlayerEntity player = playerRepository.findById(playerId).orElse(null);
                if (player == null) continue;

                Map<String, Object> p = new LinkedHashMap<>();
                p.put("name", player.getViewName());
                p.put("team", TeamName.fromId(player.getTeamId()).getCode());
                p.put("teamId", player.getTeamId());
                p.put("position", player.getPosition().getCode());
                p.put("points", pointsRepo.findByPlayer_IdAndGameweek(playerId, gw)
                        .map(PlayerPointsEntity::getPoints)
                        .orElse(0));

                result.add(p);
            }

            return ResponseEntity.ok(Map.of("team", result));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch dream team"));
        }
    }

    @GetMapping("/players-of-the-week")
    public ResponseEntity<?> getPlayersOfTheWeek(@RequestParam int userId) {
        try {
            int currentGw = gameWeekService.getCurrentGameweek().getId();
            return ResponseEntity.ok(Map.of(
                    "playersOfTheWeek",
                    playerService.getPlayersOfTheWeek(userId, currentGw)
            ));

        } catch (Exception e) {
            log.error("Error fetching players of the week internally", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch players of the week"));
        }
    }
}
