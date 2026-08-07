package com.fantasy.domain.realWorldData;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {
    private static final String API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
    private static final String BADGE_URL =
            "https://resources.premierleague.com/premierleague/badges/100/t%d.png";
    private static final String FIELD_KIT_URL =
            "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_%d-66.png";
    private static final String GOALKEEPER_KIT_URL =
            "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_%d_1-66.png";

    private final TeamRepository teamRepo;
    private final ObjectMapper mapper;
    private final RestTemplate restTemplate;

    public TeamService(TeamRepository teamRepo, ObjectMapper mapper, RestTemplate restTemplate) {
        this.teamRepo = teamRepo;
        this.mapper = mapper;
        this.restTemplate = restTemplate;
    }

    public List<TeamEntity> fetchTeamsFromApi() {
        try {
            String response = restTemplate.getForObject(API_URL, String.class);
            JsonNode root = mapper.readTree(response);
            return parseTeams(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch teams from API", e);
        }
    }

    public List<TeamEntity> parseTeams(JsonNode root) {
        if (root == null || !root.hasNonNull("teams") || !root.get("teams").isArray()) {
            throw new IllegalArgumentException("FPL bootstrap response does not contain teams");
        }

        List<TeamEntity> entities = new ArrayList<>();
        for (JsonNode node : root.get("teams")) {
            int id = node.get("id").asInt();
            String name = node.get("name").asText();
            String shortName = node.get("short_name").asText();
            Integer assetCode = node.hasNonNull("code") ? node.get("code").asInt() : null;
            entities.add(new TeamEntity(id, name, shortName, assetCode));
        }
        return entities;
    }

    @Transactional
    public void saveTeams(List<TeamEntity> entities) {
        if (entities != null && !entities.isEmpty()) {
            teamRepo.saveAll(entities);
        }
    }

    public List<TeamDto> getAllTeams() {
        return teamRepo.findAll().stream().map(this::toDto).toList();
    }

    public long countTeams() {
        return teamRepo.count();
    }

    public boolean hasTeamsWithoutBadgeCode() {
        return teamRepo.existsByAssetCodeIsNull();
    }

    TeamDto toDto(TeamEntity team) {
        Integer assetCode = team.getAssetCode();
        return new TeamDto(
                team.getId(),
                team.getName(),
                team.getShortName(),
                team.getCode(),
                assetCode,
                assetCode == null ? null : BADGE_URL.formatted(assetCode),
                assetCode == null ? null : FIELD_KIT_URL.formatted(assetCode),
                assetCode == null ? null : GOALKEEPER_KIT_URL.formatted(assetCode)
        );
    }

}
