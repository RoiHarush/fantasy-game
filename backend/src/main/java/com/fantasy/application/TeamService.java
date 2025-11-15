package com.fantasy.application;

import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.infrastructure.repositories.TeamRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {
    private static final String API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

    private final TeamRepository teamRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public TeamService(TeamRepository teamRepo) {
        this.teamRepo = teamRepo;
    }

    public void loadFromApiAndSave() {
        try {
            JsonNode root = mapper.readTree(new URL(API_URL));
            JsonNode teams = root.get("teams");

            List<TeamEntity> entities = new ArrayList<>();

            for (JsonNode node : teams) {
                int id = node.get("id").asInt();
                String name = node.get("name").asText();
                String shortName = node.get("short_name").asText();

                entities.add(new TeamEntity(id, name, shortName));
            }

            teamRepo.saveAll(entities);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load teams from API", e);
        }
    }

    public List<TeamEntity> getAllTeams() {
        return teamRepo.findAll();
    }

    public long countTeams() {
        return teamRepo.count();
    }

}
