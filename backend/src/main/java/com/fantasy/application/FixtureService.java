package com.fantasy.application;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamName;
import com.fantasy.dto.FixtureSummaryDto;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import com.fantasy.infrastructure.repositories.TeamRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URL;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FixtureService {

    private static final String FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/";

    private final FixtureRepository fixtureRepo;
    private final TeamRepository teamRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public FixtureService(FixtureRepository fixtureRepo,
                          TeamRepository teamRepo,
                          RestTemplate restTemplate,
                          ObjectMapper mapper) {
        this.fixtureRepo = fixtureRepo;
        this.teamRepo = teamRepo;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    @Transactional
    public void loadFromApiAndSave() {
        try {
            String jsonResponse = restTemplate.getForObject(FIXTURES_URL, String.class);
            JsonNode root = mapper.readTree(jsonResponse);

            List<FixtureEntity> fixtures = new ArrayList<>();
            ZoneId appZoneId = ZoneId.systemDefault();

            for (JsonNode fixture : root) {
                int id = fixture.get("id").asInt();
                int gameweekId = fixture.has("event") && !fixture.get("event").isNull()
                        ? fixture.get("event").asInt()
                        : 0;
                int homeTeamId = fixture.get("team_h").asInt();
                int awayTeamId = fixture.get("team_a").asInt();

                String kickoffUtc = fixture.has("kickoff_time") && !fixture.get("kickoff_time").isNull()
                        ? fixture.get("kickoff_time").asText()
                        : null;

                LocalDateTime kickoff = null;
                if (kickoffUtc != null) {
                    Instant instant = Instant.parse(kickoffUtc);
                    kickoff = LocalDateTime.ofInstant(instant, appZoneId);
                }

                Integer scoreHome = fixture.has("team_h_score") && !fixture.get("team_h_score").isNull() ? fixture.get("team_h_score").asInt() : null;
                Integer scoreAway = fixture.has("team_a_score") && !fixture.get("team_a_score").isNull() ? fixture.get("team_a_score").asInt() : null;
                Integer homeDifficulty = fixture.has("team_h_difficulty") && !fixture.get("team_h_difficulty").isNull() ? fixture.get("team_h_difficulty").asInt() : null;
                Integer awayDifficulty = fixture.has("team_a_difficulty") && !fixture.get("team_a_difficulty").isNull() ? fixture.get("team_a_difficulty").asInt() : null;

                boolean started = fixture.has("started") && fixture.get("started").asBoolean();
                boolean finished = fixture.has("finished") && fixture.get("finished").asBoolean();
                int minutes = fixture.has("minutes") ? fixture.get("minutes").asInt() : 0;

                FixtureEntity entity = new FixtureEntity(id, gameweekId, homeTeamId, awayTeamId, kickoff, scoreHome, scoreAway);
                entity.setHomeDifficulty(homeDifficulty);
                entity.setAwayDifficulty(awayDifficulty);
                entity.setStarted(started);
                entity.setFinished(finished);
                entity.setMinutes(minutes);

                fixtures.add(entity);
            }

            fixtureRepo.saveAll(fixtures);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load fixtures from API", e);
        }
    }

    @Transactional
    public void updateFixturesForGameweek(int gameweekId) {
        try {
            String url = FIXTURES_URL + "?event=" + gameweekId;
            String jsonResponse = restTemplate.getForObject(url, String.class);
            JsonNode root = mapper.readTree(jsonResponse);

            List<FixtureEntity> dbFixtures = fixtureRepo.findByGameweekId(gameweekId);
            Map<Integer, FixtureEntity> fixtureMap = dbFixtures.stream()
                    .collect(Collectors.toMap(FixtureEntity::getId, Function.identity()));

            List<FixtureEntity> toUpdate = new ArrayList<>();

            for (JsonNode node : root) {
                int id = node.get("id").asInt();
                FixtureEntity entity = fixtureMap.get(id);

                if (entity == null) continue;

                boolean changed = false;

                Integer newHomeScore = node.get("team_h_score").isNull() ? null : node.get("team_h_score").asInt();
                Integer newAwayScore = node.get("team_a_score").isNull() ? null : node.get("team_a_score").asInt();

                if (!Objects.equals(entity.getHomeTeamScore(), newHomeScore)) {
                    entity.setHomeTeamScore(newHomeScore);
                    changed = true;
                }
                if (!Objects.equals(entity.getAwayTeamScore(), newAwayScore)) {
                    entity.setAwayTeamScore(newAwayScore);
                    changed = true;
                }

                boolean started = node.get("started").asBoolean();
                boolean finished = node.get("finished").asBoolean();
                int minutes = node.get("minutes").asInt();

                if (entity.isStarted() != started) {
                    entity.setStarted(started);
                    changed = true;
                }
                if (entity.isFinished() != finished) {
                    entity.setFinished(finished);
                    changed = true;
                }
                if (entity.getMinutes() != minutes) {
                    entity.setMinutes(minutes);
                    changed = true;
                }

                String kickoffUtc = node.has("kickoff_time") && !node.get("kickoff_time").isNull() ? node.get("kickoff_time").asText() : null;
                if (kickoffUtc != null) {
                    LocalDateTime apiKickoff = LocalDateTime.ofInstant(Instant.parse(kickoffUtc), ZoneId.systemDefault());
                    if (!apiKickoff.isEqual(entity.getKickoffTime())) {
                        entity.setKickoffTime(apiKickoff);
                        changed = true;
                    }
                }

                if (changed) {
                    toUpdate.add(entity);
                }
            }

            if (!toUpdate.isEmpty()) {
                fixtureRepo.saveAll(toUpdate);
                System.out.println("Updated scores for " + toUpdate.size() + " fixtures in GW " + gameweekId);
            }

        } catch (Exception e) {
            System.err.println("Error updating fixtures for GW " + gameweekId + ": " + e.getMessage());
        }
    }

    public List<FixtureEntity> getAllFixtures() {
        return fixtureRepo.findAll();
    }

    public List<FixtureEntity> getFixturesByGameweek(int gw) {
        return fixtureRepo.findAll().stream()
                .filter(f -> f.getGameweekId() == gw)
                .toList();
    }

    public long countFixtures() {
        return fixtureRepo.count();
    }

    public Map<Integer, FixtureSummaryDto> getFixturesForTeam(int teamId) {
        Map<Integer, FixtureSummaryDto> fixturesMap = new LinkedHashMap<>();

        List<FixtureEntity> fixtures = fixtureRepo.findAll().stream()
                .filter(f -> f.getHomeTeamId() == teamId || f.getAwayTeamId() == teamId)
                .sorted(Comparator.comparingInt(FixtureEntity::getGameweekId))
                .toList();

        for (FixtureEntity f : fixtures) {
            String opponentShortName;
            String homeOrAway;
            int difficulty;

            if (f.getHomeTeamId() == teamId) {
                opponentShortName = teamRepo.findById(f.getAwayTeamId())
                        .map(TeamEntity::getShortName)
                        .orElse("UNK");
                homeOrAway = "(H)";
                difficulty = f.getHomeDifficulty();
            } else {
                opponentShortName = teamRepo.findById(f.getHomeTeamId())
                        .map(TeamEntity::getShortName)
                        .orElse("UNK");
                homeOrAway = "(A)";
                difficulty = f.getAwayDifficulty();
            }

            String kickoff = f.getKickoffTime() != null ? f.getKickoffTime().toString() : null;

            fixturesMap.put(
                    f.getGameweekId(),
                    new FixtureSummaryDto(opponentShortName + " " + homeOrAway, difficulty, kickoff)
            );
        }

        return fixturesMap;
    }

    public String getNextFixtureDisplayForTeam(int teamId) {
        LocalDateTime now = LocalDateTime.now();

        return fixtureRepo.findAll().stream()
                .filter(f -> f.getKickoffTime() != null && f.getKickoffTime().isAfter(now))
                .filter(f -> f.getHomeTeamId() == teamId || f.getAwayTeamId() == teamId)
                .sorted(Comparator.comparing(FixtureEntity::getKickoffTime))
                .findFirst()
                .map(f -> {
                    boolean isHome = f.getHomeTeamId() == teamId;
                    int opponentId = isHome ? f.getAwayTeamId() : f.getHomeTeamId();

                    String opponentCode = TeamName.fromId(opponentId).getCode();
                    return opponentCode + (isHome ? " (H)" : " (A)");
                })
                .orElse("-");
    }
}