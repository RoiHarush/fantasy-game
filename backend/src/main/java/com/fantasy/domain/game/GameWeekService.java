package com.fantasy.domain.game;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class GameWeekService {
    private static final String API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

    private final GameWeekRepository gameWeekRepo;
    private final FixtureRepository fixtureRepo;
    private final GameweekDailyStatusRepository dailyStatusRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    private GameWeekService self;

    public GameWeekService(GameWeekRepository gameWeekRepo,
                           FixtureRepository fixtureRepo,
                           GameweekDailyStatusRepository dailyStatusRepo) {
        this.gameWeekRepo = gameWeekRepo;
        this.fixtureRepo = fixtureRepo;
        this.dailyStatusRepo = dailyStatusRepo;
    }

    @Autowired
    public void setSelf(@Lazy GameWeekService self) {
        this.self = self;
    }

    public void loadFromApiAndSave() {
        try {
            JsonNode root = mapper.readTree(URI.create(API_URL).toURL());

            self.saveGameWeeks(root);

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

            KickoffTimes kickoffs = calculateKickoffTimes(id);
            if (kickoffs == null) continue;

            GameWeekEntity gw = gameWeekRepo.findById(id)
                    .orElse(new GameWeekEntity(id, name, kickoffs.first, kickoffs.last, status));

            gw.setName(name);
            gw.setFirstKickoffTime(kickoffs.first);
            gw.setLastKickoffTime(kickoffs.last);
            gw.setStatus(status);
            gw.setTransferOpenTime(calculateTransferOpenTime(id, kickoffs.first));

            gameWeeksToSave.add(gw);
        }

        gameWeekRepo.saveAll(gameWeeksToSave);
    }

    @Transactional
    public void updateGameWeekDeadlines() {
        List<GameWeekEntity> allGameWeeks = gameWeekRepo.findAll();
        List<GameWeekEntity> gameWeeksToUpdate = new ArrayList<>();

        for (GameWeekEntity gw : allGameWeeks) {
            KickoffTimes kickoffs = calculateKickoffTimes(gw.getId());
            if (kickoffs == null) continue;

            boolean isFirstKickoffChanged = !Objects.equals(kickoffs.first, gw.getFirstKickoffTime());
            boolean isLastKickoffChanged = !Objects.equals(kickoffs.last, gw.getLastKickoffTime());

            if (isFirstKickoffChanged || isLastKickoffChanged) {
                gw.setFirstKickoffTime(kickoffs.first);
                gw.setLastKickoffTime(kickoffs.last);

                if (isFirstKickoffChanged) {
                    gw.setTransferOpenTime(calculateTransferOpenTime(gw.getId(), kickoffs.first));
                }

                gameWeeksToUpdate.add(gw);
            }
        }

        gameWeekRepo.saveAll(gameWeeksToUpdate);
    }

    private record KickoffTimes(LocalDateTime first, LocalDateTime last) {}

    private KickoffTimes calculateKickoffTimes(int gameweekId) {
        List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(gameweekId);

        if (fixtures.isEmpty()) return null;

        LocalDateTime first = fixtures.stream()
                .map(FixtureEntity::getKickoffTime)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime last = fixtures.stream()
                .map(FixtureEntity::getKickoffTime)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        if (first == null) return null;

        return new KickoffTimes(first, last);
    }

    private LocalDateTime calculateTransferOpenTime(int gameweekId, LocalDateTime firstKickoff) {
        List<FixtureEntity> fixtures = fixtureRepo.findByGameweekId(gameweekId);
        LocalDateTime chosenTime = firstKickoff.minusMinutes(75);

        if (fixtures.isEmpty()) {
            return chosenTime;
        }

        fixtures.sort(Comparator.comparing(FixtureEntity::getKickoffTime));

        for (FixtureEntity fixture : fixtures) {
            LocalDateTime candidate = fixture.getKickoffTime().minusMinutes(75);
            if (candidate.isBefore(firstKickoff)) {
                chosenTime = candidate;
            } else {
                break;
            }
        }
        return chosenTime;
    }

    public List<GameweekDailyStatusDto> getGameweekDailyStatus(int gwId) {
        List<LocalDate> matchDates = fixtureRepo.findMatchDatesByGameweekId(gwId);
        matchDates.sort(LocalDate::compareTo);

        List<GameweekDailyStatusDto> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (LocalDate date : matchDates) {
            boolean isCalculated = dailyStatusRepo
                    .findByGameweekIdAndMatchDate(gwId, date)
                    .map(GameweekDailyStatus::isCalculated)
                    .orElse(false);

            result.add(new GameweekDailyStatusDto(date, isCalculated, date.equals(today)));
        }
        return result;
    }

    public List<GameWeekEntity> getAllGameweeks() {
        return gameWeekRepo.findAll();
    }

    public GameWeekDto getCurrentGameweek() {
        Optional<GameWeekDto> liveGw = gameWeekRepo.findAll().stream()
                .filter(gw -> "LIVE".equalsIgnoreCase(gw.getStatus()))
                .findFirst()
                .map(GameWeekMapper::toDto);

        if (liveGw.isPresent()) return liveGw.get();

        GameWeekDto lastFinished = getLastFinishedGameweek();
        if (lastFinished != null) return lastFinished;

        return getNextGameweek();
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