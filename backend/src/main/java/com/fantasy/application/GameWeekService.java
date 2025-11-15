package com.fantasy.application;

import com.fantasy.dto.GameWeekDto;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.infrastructure.mappers.GameWeekMapper;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
                            .min(LocalDateTime::compareTo)
                            .orElse(null);

                    lastKickoff = fixtures.stream()
                            .map(f -> f.getKickoffTime().plusHours(2))
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

                gameWeekRepo.save(gw);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to load Gameweeks from API", e);
        }
    }



    private LocalDateTime calculateTransferOpenTime(int gameweekId, LocalDateTime firstKickoff) {
        List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(gameweekId);
        if (fixtures.isEmpty()) {
            return firstKickoff.minusMinutes(70);
        }

        fixtures.sort(Comparator.comparing(FixtureEntity::getKickoffTime));

        LocalDateTime chosenTime = firstKickoff.minusMinutes(70);
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
        return gameWeekRepo.findAll().stream()
                .filter(gw -> "UPCOMING".equalsIgnoreCase(gw.getStatus()))
                .findFirst()
                .map(GameWeekMapper::toDto)
                .orElse(null);
    }

    public GameWeekDto getLastFinishedGameweek() {
        return gameWeekRepo.findAll().stream()
                .filter(gw -> "FINISHED".equalsIgnoreCase(gw.getStatus()))
                .reduce((first, second) -> second)
                .map(GameWeekMapper::toDto)
                .orElse(null);
    }

    public long countGameweeks() {
        return gameWeekRepo.count();
    }

}
