package com.fantasy.application;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamName;
import com.fantasy.dto.FixtureSummaryDto;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import com.fantasy.infrastructure.repositories.TeamRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class FixtureService {

    private static final String FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/";

    private final FixtureRepository fixtureRepo;
    private final TeamRepository teamRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public FixtureService(FixtureRepository fixtureRepo, TeamRepository teamRepo) {
        this.fixtureRepo = fixtureRepo;
        this.teamRepo = teamRepo;
    }

    public void loadFromApiAndSave() {
        try {
            JsonNode root = mapper.readTree(new URL(FIXTURES_URL));
            List<FixtureEntity> fixtures = new ArrayList<>();

            for (JsonNode fixture : root) {
                int id = fixture.get("id").asInt();
                int gameweekId = fixture.get("event").isNull() ? 0 : fixture.get("event").asInt();
                int homeTeamId = fixture.get("team_h").asInt();
                int awayTeamId = fixture.get("team_a").asInt();

                String kickoffUtc = fixture.get("kickoff_time").isNull() ? null : fixture.get("kickoff_time").asText();
                LocalDateTime kickoff = null;
                if (kickoffUtc != null) {
                    Instant instant = Instant.parse(kickoffUtc);
                    kickoff = LocalDateTime.ofInstant(instant, ZoneId.of("Asia/Jerusalem"));
                }

                Integer scoreHome = fixture.get("team_h_score").isNull() ? null : fixture.get("team_h_score").asInt();
                Integer scoreAway = fixture.get("team_a_score").isNull() ? null : fixture.get("team_a_score").asInt();
                Integer homeDifficulty = fixture.get("team_h_difficulty").isNull() ? null : fixture.get("team_h_difficulty").asInt();
                Integer awayDifficulty = fixture.get("team_a_difficulty").isNull() ? null : fixture.get("team_a_difficulty").asInt();

                FixtureEntity entity = new FixtureEntity(id, gameweekId, homeTeamId, awayTeamId, kickoff, scoreHome, scoreAway);
                entity.setHomeDifficulty(homeDifficulty);
                entity.setAwayDifficulty(awayDifficulty);

                fixtures.add(entity);
            }

            fixtureRepo.saveAll(fixtures);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load fixtures from API", e);
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
