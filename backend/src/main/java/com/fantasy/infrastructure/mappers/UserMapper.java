package com.fantasy.infrastructure.mappers;

import com.fantasy.dto.UserDto;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserPointsEntity;
import com.fantasy.domain.user.UserSquadEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UserMapper {

    // === Entity -> Domain ===
    public static User toDomain(UserEntity e,
                                UserSquadEntity currentSquadEntity,
                                UserSquadEntity nextSquadEntity,
                                PlayerRegistry globalPlayers) {
        User user = new User(
                e.getId(),
                e.getName(),
                e.getFantasyTeamName(),
                e.getRegisteredAt()
        );

        Map<Integer, Integer> points = new HashMap<>();
        for (UserPointsEntity upe : e.getPointsByGameweek()) {
            points.put(upe.getGameweek(), upe.getPoints());
        }
        user.setPointsByGameweek(points);
        user.setWatchedPlayers(new ArrayList<>(e.getWatchedPlayers()));

        if (e.getChips() != null)
            user.setChips(new HashMap<>(e.getChips()));

        if (e.getActiveChips() != null)
            user.setActiveChips(new HashMap<>(e.getActiveChips()));

        if (currentSquadEntity != null) {
            Squad squad = SquadMapper.toDomain(currentSquadEntity, globalPlayers);
            FantasyTeam current = new FantasyTeam(currentSquadEntity.getGameweek(), squad);
            user.setCurrentFantasyTeam(current);
        }

        if (nextSquadEntity != null) {
            Squad squad = SquadMapper.toDomain(nextSquadEntity, globalPlayers);
            FantasyTeam next = new FantasyTeam(nextSquadEntity.getGameweek(), squad);
            user.setNextFantasyTeam(next);
        }

        return user;
    }

    public static UserEntity toEntity(User user) {
        UserEntity e = new UserEntity();
        e.setId(user.getId());
        e.setName(user.getName());
        e.setFantasyTeamName(user.getFantasyTeamName());
        e.setRegisteredAt(user.getREGISTERED_AT());
        e.setWatchedPlayers(new ArrayList<>(user.getWatchedPlayers()));

        if (user.getChips() != null)
            e.setChips(new HashMap<>(user.getChips()));

        if (user.getActiveChips() != null)
            e.setActiveChips(new HashMap<>(user.getActiveChips()));

        e.setTotalPoints(
                user.getPointsByGameweek()
                        .values()
                        .stream()
                        .mapToInt(Integer::intValue)
                        .sum()
        );

        Map<Integer, UserPointsEntity> existing = new HashMap<>();
        if (e.getPointsByGameweek() != null) {
            for (UserPointsEntity upe : e.getPointsByGameweek()) {
                existing.put(upe.getGameweek(), upe);
            }
        }

        List<UserPointsEntity> pointsEntities = new ArrayList<>();
        for (Map.Entry<Integer, Integer> entry : user.getPointsByGameweek().entrySet()) {
            int gw = entry.getKey();
            int pts = entry.getValue();

            UserPointsEntity upe = existing.getOrDefault(gw, new UserPointsEntity());
            upe.setGameweek(gw);
            upe.setPoints(pts);
            upe.setUser(e);
            pointsEntities.add(upe);
        }
        e.setPointsByGameweek(pointsEntities);

        if (user.getCurrentFantasyTeam() != null) {
            UserSquadEntity squadEntity = SquadMapper.toEntity(
                    user.getCurrentFantasyTeam().getSquad(),
                    user.getCurrentFantasyTeam().getGameweek()
            );
            squadEntity.setUser(e);
            e.setCurrentSquad(squadEntity);
        }

        if (user.getNextFantasyTeam() != null) {
            UserSquadEntity squadEntity = SquadMapper.toEntity(
                    user.getNextFantasyTeam().getSquad(),
                    user.getNextFantasyTeam().getGameweek()
            );
            squadEntity.setUser(e);
            e.setNextSquad(squadEntity);
        }

        return e;
    }

    public static UserSquadEntity toSquadEntity(User user, UserEntity userEntityRef, int gw) {
        if (user.getCurrentFantasyTeam() == null)
            return null;
        UserSquadEntity se = SquadMapper.toEntity(user.getCurrentFantasyTeam().getSquad(), gw);
        se.setUser(userEntityRef);
        return se;
    }

    // === Domain -> DTO ===
    public static UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setFantasyTeam(user.getFantasyTeamName());
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");

        return dto;
    }

    // === Entity -> DTO ===
    public static UserDto toDto(UserEntity e) {
        UserDto dto = new UserDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setFantasyTeam(e.getFantasyTeamName());
        dto.setLogoPath("/user_logo/" + e.getId() + "_logo.png");

        return dto;
    }

}
