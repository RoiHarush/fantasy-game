package com.fantasy.application;

import com.fantasy.dto.GameWeekDto;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.infrastructure.mappers.GameWeekMapper;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.*;
import java.util.*;

@Service
public class GameWeekService {
    private static final String API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

    private final GameWeekRepository gameWeekRepo;
    private final FixtureRepository fixtureRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public GameWeekService(GameWeekRepository gameWeekRepo, FixtureRepository fixtureRepo) {
        this.gameWeekRepo = gameWeekRepo;
        this.fixtureRepo = fixtureRepo;
    }

    public void loadFromApiAndSave() {
        try {
            JsonNode root = mapper.readTree(new URL(API_URL));

            saveGameWeeks(root);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load Gameweeks from API", e);
        }
    }

    @Transactional
    public void saveGameWeeks(JsonNode root) {

        List<GameWeekEntity> gameWeeksToSave = new ArrayList<>();

        for (JsonNode gwNode : root.get("events")) {
            int id = gwNode.get("id").asInt();
            String name = gwNode.get("name").asText();

            String status = gwNode.get("is_current").asBoolean() ? "LIVE"
                    : gwNode.get("finished").asBoolean() ? "FINISHED"
                    : "UPCOMING";

            List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(id);

            LocalDateTime firstKickoff = null;
            LocalDateTime lastKickoff = null;

            if (!fixtures.isEmpty()) {
                firstKickoff = fixtures.stream()
                        .map(FixtureEntity::getKickoffTime)
                        .filter(Objects::nonNull)
                        .min(LocalDateTime::compareTo)
                        .orElse(null);

                lastKickoff = fixtures.stream()
                        .map(FixtureEntity::getKickoffTime)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);
            }

            if (firstKickoff == null) continue;

            GameWeekEntity gw = gameWeekRepo.findById(id)
                    .orElse(new GameWeekEntity(id, name, firstKickoff, lastKickoff, status));

            gw.setName(name);
            gw.setFirstKickoffTime(firstKickoff);
            gw.setLastKickoffTime(lastKickoff);
            gw.setStatus(status);

            LocalDateTime transferOpen = calculateTransferOpenTime(id, firstKickoff);
            gw.setTransferOpenTime(transferOpen);

            gameWeeksToSave.add(gw);
        }

        gameWeekRepo.saveAll(gameWeeksToSave);
    }

    private LocalDateTime calculateTransferOpenTime(int gameweekId, LocalDateTime firstKickoff) {
        List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(gameweekId);

        LocalDateTime chosenTime = firstKickoff.minusMinutes(70);

        if (fixtures.isEmpty()) {
            return chosenTime;
        }

        fixtures.sort(Comparator.comparing(FixtureEntity::getKickoffTime));

        for (FixtureEntity fixture : fixtures) {
            LocalDateTime candidate = fixture.getKickoffTime().minusMinutes(70);
            if (candidate.isBefore(firstKickoff)) {
                chosenTime = candidate;
            } else {
                break;
            }
        }
        return chosenTime;
    }

    @Transactional
    public void updateGameWeekDeadlines() {
        List<GameWeekEntity> allGameWeeks = gameWeekRepo.findAll();
        List<GameWeekEntity> gameWeeksToUpdate = new ArrayList<>();

        for (GameWeekEntity gw : allGameWeeks) {
            List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(gw.getId());

            LocalDateTime newFirstKickoff = null;
            LocalDateTime newLastKickoff = null;

            if (!fixtures.isEmpty()) {
                newFirstKickoff = fixtures.stream()
                        .map(FixtureEntity::getKickoffTime)
                        .filter(Objects::nonNull)
                        .min(LocalDateTime::compareTo)
                        .orElse(null);

                newLastKickoff = fixtures.stream()
                        .map(FixtureEntity::getKickoffTime)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);
            }

            if (newFirstKickoff == null) {
                continue;
            }

            boolean isFirstKickoffChanged = !newFirstKickoff.equals(gw.getFirstKickoffTime());
            boolean isLastKickoffChanged = !newLastKickoff.equals(gw.getLastKickoffTime());

            if (isFirstKickoffChanged || isLastKickoffChanged) {
                gw.setFirstKickoffTime(newFirstKickoff);
                gw.setLastKickoffTime(newLastKickoff);

                if (isFirstKickoffChanged) {
                    LocalDateTime newTransferOpen = calculateTransferOpenTime(gw.getId(), newFirstKickoff);
                    gw.setTransferOpenTime(newTransferOpen);
                }

                gameWeeksToUpdate.add(gw);
            }
        }

        gameWeekRepo.saveAll(gameWeeksToUpdate);
    }


    public List<GameWeekEntity> getAllGameweeks() {
        return gameWeekRepo.findAll();
    }

    public GameWeekDto getCurrentGameweek() {
        return gameWeekRepo.findAll().stream()
                .filter(gw -> "LIVE".equalsIgnoreCase(gw.getStatus()))
                .findFirst()
                .map(GameWeekMapper::toDto)
                .orElse(null);
    }

    public GameWeekDto getNextGameweek() {
        return gameWeekRepo.findFirstByStatusOrderByIdAsc("UPCOMING")
                .map(GameWeekMapper::toDto)
                .orElse(null);
    }

    public GameWeekDto getLastFinishedGameweek() {
        return gameWeekRepo.findFirstByStatusOrderByIdDesc("FINISHED")
                .map(GameWeekMapper::toDto)
                .orElse(null);
    }

    public long countGameweeks() {
        return gameWeekRepo.count();
    }
}