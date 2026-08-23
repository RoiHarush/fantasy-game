package com.fantasy.domain.player;

public record PlayerOfTheWeekDto(
        int id,
        int gameweek,
        String playerName,
        int teamId,
        int points,
        String photo,
        String position
) {}
