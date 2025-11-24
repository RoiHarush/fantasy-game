package com.fantasy.infrastructure.mappers;

import com.fantasy.domain.user.*;
import com.fantasy.dto.UserDto;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.PlayerRegistry;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class UserMapper {

    // === Entity -> Domain ===
    public static UserGameData toDomainGameData(UserGameDataEntity e,
                                                PlayerRegistry globalPlayers) {
        Map<Integer, Integer> points = new HashMap<>();
        for (UserPointsEntity upe : e.getPointsByGameweek()) {
            points.put(upe.getGameweek(), upe.getPoints());
        }

        UserGameData userGameData = new UserGameData(
                e.getId(), e.getFantasyTeamName(),
                e.getChips(),
                e.getActiveChips(),
                points,
                new ArrayList<>(e.getWatchedPlayers()));

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

    public static User toDomainUser(UserEntity e){
        return new User(e.getId(),
                e.getName(),
                e.getUsername(),
                e.getRole(),
                e.getRegisteredAt());
    }

    // === Domain -> DTO ===
    public static UserDto toDto(User user, UserGameData userGameData) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUserName(user.getUsername());
        dto.setFantasyTeamName(userGameData.getFantasyTeamName());
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");
        dto.setRole(user.getRole().name());

        return dto;
    }

    public static UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUserName(user.getUsername());
        dto.setLogoPath("/user_logo/" + user.getId() + "_logo.png");
        dto.setRole(user.getRole().name());

        return dto;
    }
}
