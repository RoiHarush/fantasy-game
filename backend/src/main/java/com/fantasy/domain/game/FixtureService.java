package com.fantasy.domain.game;

import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamName;
import com.fantasy.domain.realWorldData.TeamRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FixtureService {

    private static final Logger log = LoggerFactory.getLogger(FixtureService.class);
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

    public void loadFromApiAndSave() {
        log.info("Starting full fixture load from API...");

        try {
            List<FixtureEntity> fixtures = fetchFixturesFromApi();
            log.debug("Fetched {} fixtures from FPL API", fixtures.size());

            saveFixtures(fixtures);
            log.info("Successfully loaded & saved {} fixtures.", fixtures.size());

        } catch (HttpServerErrorException.ServiceUnavailable e) {
            log.warn("Skipping fixture sync: FPL Game is currently updating (503).");
        } catch (Exception e) {
            log.error("Failed to load fixtures from API: {}", e.getMessage(), e);
        }
    }

    public List<FixtureEntity> fetchFixturesFromApi() throws Exception {
        log.debug("Calling FPL fixtures API: {}", FIXTURES_URL);
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
                kickoff = LocalDateTime.ofInstant(Instant.parse(kickoffUtc), appZoneId);
            }

            Integer scoreHome = fixture.has("team_h_score") && !fixture.get("team_h_score").isNull()
                    ? fixture.get("team_h_score").asInt()
                    : null;

            Integer scoreAway = fixture.has("team_a_score") && !fixture.get("team_a_score").isNull()
                    ? fixture.get("team_a_score").asInt()
                    : null;

            Integer homeDifficulty = fixture.has("team_h_difficulty") && !fixture.get("team_h_difficulty").isNull()
                    ? fixture.get("team_h_difficulty").asInt()
                    : null;

            Integer awayDifficulty = fixture.has("team_a_difficulty") && !fixture.get("team_a_difficulty").isNull()
                    ? fixture.get("team_a_difficulty").asInt()
                    : null;

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

        log.debug("Finished parsing fixtures from API → total={}", fixtures.size());
        return fixtures;
    }

    @Transactional
    public void saveFixtures(List<FixtureEntity> fixtures) {
        log.debug("Saving {} fixtures to DB...", fixtures.size());
        fixtureRepo.saveAll(fixtures);
        log.debug("Fixtures saved.");
    }

    @Transactional
    public void updateFixturesForGameweek(int gameweekId) {
        log.debug("Periodic check: Updating fixtures for GW {}", gameweekId);

        try {
            String url = FIXTURES_URL + "?event=" + gameweekId;
            log.debug("Fetching updates from FPL API for GW {}", gameweekId);

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

                if (!Objects.equals(entity.getHomeTeamScore(), newHomeScore) || !Objects.equals(entity.getAwayTeamScore(), newAwayScore)) {
                    changed = true;
                    entity.setHomeTeamScore(newHomeScore);
                    entity.setAwayTeamScore(newAwayScore);

                    log.info("SCORE CHANGE detected in Game ID {}: {}-{}", id, newHomeScore, newAwayScore);
                }

                boolean started = node.get("started").asBoolean();
                boolean finished = node.get("finished").asBoolean();
                int minutes = node.get("minutes").asInt();

                if (entity.isStarted() != started) {
                    changed = true;
                    entity.setStarted(started);
                    log.info("Game ID {} started status changed to: {}", id, started); // התחלת משחק זה מעניין
                }

                if (entity.isFinished() != finished) {
                    changed = true;
                    entity.setFinished(finished);
                    log.info("Game ID {} finished.", id);
                }

                if (entity.getMinutes() != minutes) {
                    changed = true;
                    entity.setMinutes(minutes);
                    log.debug("Game ID {} time update: {} minutes", id, minutes);
                }

                String kickoffUtc = node.has("kickoff_time") && !node.get("kickoff_time").isNull() ? node.get("kickoff_time").asText() : null;
                if (kickoffUtc != null) {
                    LocalDateTime apiKickoff = LocalDateTime.ofInstant(Instant.parse(kickoffUtc), ZoneId.systemDefault());
                    if (!apiKickoff.isEqual(entity.getKickoffTime())) {
                        changed = true;
                        entity.setKickoffTime(apiKickoff);
                    }
                }

                if (changed) {
                    toUpdate.add(entity);
                }
            }

            if (!toUpdate.isEmpty()) {
                fixtureRepo.saveAll(toUpdate);
                log.info("Cycle Summary: Updated {} fixtures in GW {}", toUpdate.size(), gameweekId);
            } else {
                log.debug("No fixture changes detected for GW {}", gameweekId);
            }

        } catch (Exception e) {
            log.error("Error updating fixtures for GW {}", gameweekId, e);
        }
    }

    public List<FixtureEntity> getAllFixtures() {
        log.debug("Fetching all fixtures...");
        return fixtureRepo.findAll();
    }

    public List<FixtureEntity> getFixturesByGameweek(int gw) {
        log.debug("Fetching fixtures for gameweek {}", gw);

        return fixtureRepo.findAll().stream()
                .filter(f -> f.getGameweekId() == gw)
                .toList();
    }

    public long countFixtures() {
        long count = fixtureRepo.count();
        log.debug("Fixture count={}", count);
        return count;
    }

    public Map<Integer, FixtureSummaryDto> getFixturesForTeam(int teamId) {
        log.debug("Building fixture list for team {}", teamId);

        Map<Integer, FixtureSummaryDto> fixturesMap = new LinkedHashMap<>();

        List<FixtureEntity> fixtures = fixtureRepo.findAll().stream()
                .filter(f -> f.getHomeTeamId() == teamId || f.getAwayTeamId() == teamId)
                .sorted(Comparator.comparingInt(FixtureEntity::getGameweekId))
                .toList();

        log.debug("Found {} fixtures for team {}", fixtures.size(), teamId);

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

        log.debug("Built {} fixture rows for team {}", fixturesMap.size(), teamId);

        return fixturesMap;
    }

    public String getNextFixtureDisplayForTeam(int teamId) {
        log.debug("Finding next fixture for team {}", teamId);

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
