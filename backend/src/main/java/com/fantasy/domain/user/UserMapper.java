package com.fantasy.domain.user;

import com.fantasy.domain.team.*;
import com.fantasy.domain.player.PlayerRegistry;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class UserMapper {

    // === Entity -> Domain (Game Data) ===
    public static UserGameData toDomainGameData(UserGameDataEntity e,
                                                PlayerRegistry globalPlayers) {
        if (e == null) return null;

        Map<Integer, Integer> points = new HashMap<>();
        if (e.getPointsByGameweek() != null) {
            for (UserPointsEntity upe : e.getPointsByGameweek()) {
                points.put(upe.getGameweek(), upe.getPoints());
            }
        }

        UserGameData userGameData = new UserGameData(
                e.getId(), e.getFantasyTeamName(),
                e.getChips(),
                e.getActiveChips(),
                points,
                e.getWatchedPlayers() != null ? new ArrayList<>(e.getWatchedPlayers()) : new ArrayList<>());

        if (e.getCurrentSquad() != null) {
            Squad squad = SquadMapper.toDomain(e.getCurrentSquad(), globalPlayers);
            FantasyTeam current = new FantasyTeam(e.getCurrentSquad().getGameweek(), squad);
            userGameData.setCurrentFantasyTeam(current);
        }

        if (e.getNextSquad() != null) {
            Squad squad = SquadMapper.toDomain(e.getNextSquad(), globalPlayers);
            FantasyTeam next = new FantasyTeam(e.getNextSquad().getGameweek(), squad);
            userGameData.setNextFantasyTeam(next);
        }

        return userGameData;
    }

    public static UserDto toDto(UserEntity userEntity, UserGameData userGameData) {
        UserDto dto = new UserDto();
        dto.setId(userEntity.getId());
        dto.setName(userEntity.getName());
        dto.setUsername(userEntity.getUsername());

        if (userGameData != null) {
            dto.setFantasyTeamName(userGameData.getFantasyTeamName());
        } else {
            dto.setFantasyTeamName("N/A");
        }

        dto.setLogoPath("/user_logo/" + userEntity.getId() + "_logo.png");
        dto.setRole(userEntity.getRole().name());

        return dto;
    }

    public static UserDto toDto(UserEntity userEntity) {
        UserDto dto = new UserDto();
        dto.setId(userEntity.getId());
        dto.setName(userEntity.getName());
        dto.setUsername(userEntity.getUsername());
        dto.setLogoPath("/user_logo/" + userEntity.getId() + "_logo.png");
        dto.setRole(userEntity.getRole().name());
        dto.setFantasyTeamName("N/A");

        return dto;
    }
}