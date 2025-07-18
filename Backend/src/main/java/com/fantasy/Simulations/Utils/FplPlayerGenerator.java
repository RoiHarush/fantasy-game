package com.fantasy.Simulations.Utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

public class FplPlayerGenerator {
    private static final String URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

    public static List<Player> fetchAllFplPlayers() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(URL))
                .GET()
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(resp.body());

        // map teamId -> Team
        Map<Integer, Team> teamMap = new HashMap<>();
        for (JsonNode teamNode : root.get("teams")) {
            int teamId = teamNode.get("id").asInt();
            try {
                TeamName tn = TeamName.fromId(teamId);
                Team t = new Team(tn.name());
                teamMap.put(teamId, t);
            } catch (IllegalArgumentException e) {
                // קבוצה שלא קיימת ב־enum שלך — תדלג
                continue;
            }
        }

        // map positionId -> PlayerPosition
        Map<Integer, PlayerPosition> posMap = new HashMap<>();
        for (JsonNode posNode : root.get("element_types")) {
            int posId = posNode.get("id").asInt();
            try {
                PlayerPosition pos = PlayerPosition.fromId(posId);
                posMap.put(posId, pos);
            } catch (IllegalArgumentException e) {
                // עמדות שלא קיימות אצלך
                continue;
            }
        }

        List<Player> players = new ArrayList<>();
        for (JsonNode p : root.get("elements")) {
            try {
                String first = p.get("first_name").asText();
                String last = p.get("second_name").asText();
                int teamId = p.get("team").asInt();
                int posId = p.get("element_type").asInt();

                PlayerPosition pos = posMap.get(posId);
                Team team = teamMap.get(teamId);

                if (pos == null || team == null)
                    continue;

                Player player = new Player(first, last, pos, team);
                players.add(player);
            } catch (Exception e) {
                // תדלג על שחקן בעייתי
                continue;
            }
        }

        return players;
    }
}
