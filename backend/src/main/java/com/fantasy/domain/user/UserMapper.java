package com.fantasy.domain.user;

import com.fantasy.domain.team.*;
import com.fantasy.domain.player.Player;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class UserMapper {

    // === Entity -> Domain (Game Data) ===
    public static UserGameData toDomainGameData(UserGameDataEntity e,
                                                Map<Integer, Player> players) {
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
            Squad squad = SquadMapper.toDomain(e.getCurrentSquad(), players);
            FantasyTeam current = new FantasyTeam(e.getCurrentSquad().getGameweek(), squad);
            userGameData.setCurrentFantasyTeam(current);
        }

        if (e.getNextSquad() != null) {
            Squad squad = SquadMapper.toDomain(e.getNextSquad(), players);
            FantasyTeam next = new FantasyTeam(e.getNextSquad().getGameweek(), squad);
            userGameData.setNextFantasyTeam(next);
        }

        return userGameData;
    }

    public static UserDto toDto(UserEntity userEntity, UserGameData userGameData) {
        UserDto dto = new UserDto();
        dto.setId(userEntity.getId());
        dto.setName(userEntity.getFullName());
        dto.setFirstName(userEntity.getFirstName());
        dto.setLastName(userEntity.getLastName());
        dto.setUsername(userEntity.getUsername());

        if (userGameData != null) {
            dto.setFantasyTeamName(userGameData.getFantasyTeamName());
        } else {
            dto.setFantasyTeamName("N/A");
        }

        dto.setLogoPath("/UI/team-placeholder.svg");
        dto.setRole(userEntity.getRole().name());

        return dto;
    }

    public static UserDto toDto(UserEntity userEntity) {
        UserDto dto = new UserDto();
        dto.setId(userEntity.getId());
        dto.setName(userEntity.getFullName());
        dto.setFirstName(userEntity.getFirstName());
        dto.setLastName(userEntity.getLastName());
        dto.setUsername(userEntity.getUsername());
        dto.setLogoPath("/UI/team-placeholder.svg");
        dto.setRole(userEntity.getRole().name());
        dto.setFantasyTeamName("N/A");

        return dto;
    }
}
