package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.game.FixtureSummaryDto;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.realWorldData.TeamRepository;

import java.util.*;

public class PlayerMapper {

    // === Entity + Points + Owner Name → DTO ===
    public static PlayerDto toDto(PlayerEntity e, List<PlayerPointsEntity> points, String ownerName) {
        int sum = 0;
        if (points != null) {
            for (PlayerPointsEntity p : points) {
                sum += p.getPoints();
            }
        } else {
            sum = e.getTotalPoints();
        }

        boolean available = e.getState().equals(PlayerState.NONE);

        return new PlayerDto(
                e.getId(),
                e.getFirstName(),
                e.getLastName(),
                e.getViewName(),
                e.getPosition() != null ? e.getPosition().getCode() : null,
                e.getTeamId() != null ? e.getTeamId() : 0,
                sum,
                e.isInjured(),
                available,
                e.getOwnerId(),
                ownerName,
                e.getNews(),
                e.getChanceOfPlayingThisRound(),
                e.getChanceOfPlayingNextRound(),
                e.getPhoto()
        );
    }
    // === Entity + Points → Domain ===
    public static Player toDomain(PlayerEntity e, List<PlayerPointsEntity> points) {
        Player player = new Player(
                e.getId(),
                e.getFirstName(),
                e.getLastName(),
                e.getViewName(),
                e.getPosition()
        );
        player.setTeamId(e.getTeamId());
        player.setState(e.getState());
        player.setInjured(e.isInjured());

        Integer ownerId = e.getOwnerId();
        if (ownerId != null) {
            player.setOwnerId(ownerId);
        } else {
            player.setOwnerId(-1);
        }


        if (points != null) {
            for (PlayerPointsEntity ppe : points) {
                player.addPoints(ppe.getGameweek(), ppe.getPoints());
            }
        }

        return player;
    }

    // === Domain → Entity ===
    public static PlayerEntity toEntity(Player p) {
        PlayerEntity e = new PlayerEntity();
        e.setId(p.getId());
        e.setFirstName(p.getFirstName());
        e.setLastName(p.getLastName());
        e.setViewName(p.getViewName());
        e.setPosition(p.getPosition());
        e.setTeamId(p.getTeamId());
        e.setState(p.getState());
        e.setInjured(p.isInjured());
        e.setOwnerId(p.getOwnerId());
        e.setTotalPoints(p.getTotalPoints());
        return e;
    }

    // === Domain → PlayerPointsEntities ===
    public static List<PlayerPointsEntity> toPointsEntities(Player p, PlayerEntity eRef) {
        List<PlayerPointsEntity> result = new ArrayList<>();
        for (Map.Entry<Integer, Integer> entry : p.getPointsByGameweek().entrySet()) {
            PlayerPointsEntity pe = new PlayerPointsEntity();
            pe.setPlayer(eRef);
            pe.setGameweek(entry.getKey());
            pe.setPoints(entry.getValue());
            result.add(pe);
        }
        return result;
    }

    public static Map<Integer, FixtureSummaryDto> buildUpcomingFixturesMap(
            int teamId, FixtureRepository fixtureRepo, TeamRepository teamRepo) {

        Map<Integer, FixtureSummaryDto> fixturesMap = new LinkedHashMap<>();

        List<FixtureEntity> fixtures = fixtureRepo.findAll()
                .stream()
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
                    new FixtureSummaryDto(opponentShortName + homeOrAway, difficulty, kickoff)
            );
        }

        return fixturesMap;
    }
}
