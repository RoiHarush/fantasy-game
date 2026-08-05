package com.fantasy.domain.player;

import java.util.List;

public final class PlayerMapper {

    private PlayerMapper() {}

    public static PlayerDto toDto(PlayerEntity entity,
                                  List<PlayerPointsEntity> points,
                                  Integer ownerId,
                                  String ownerName,
                                  boolean available,
                                  PlayerPosition effectivePosition) {
        int totalPoints = points == null
                ? entity.getTotalPoints()
                : points.stream().mapToInt(PlayerPointsEntity::getPoints).sum();
        return toDtoWithTotalPoints(
                entity,
                totalPoints,
                ownerId,
                ownerName,
                available,
                effectivePosition
        );
    }

    public static PlayerDto toDtoWithTotalPoints(PlayerEntity entity,
                                                 int totalPoints,
                                                 Integer ownerId,
                                                 String ownerName,
                                                 boolean available,
                                                 PlayerPosition effectivePosition) {
        return new PlayerDto(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getViewName(),
                effectivePosition != null ? effectivePosition.getCode() : null,
                entity.getTeamId() != null ? entity.getTeamId() : 0,
                totalPoints,
                entity.isInjured(),
                available,
                ownerId,
                ownerName,
                entity.getNews(),
                entity.getChanceOfPlayingThisRound(),
                entity.getChanceOfPlayingNextRound(),
                entity.getPhoto()
        );
    }

    public static Player toDomain(PlayerEntity entity, List<PlayerPointsEntity> points) {
        Player player = new Player(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getViewName(),
                entity.getPosition()
        );
        player.setTeamId(entity.getTeamId());
        player.setState(PlayerState.NONE);
        player.setOwnerId(-1);
        player.setInjured(entity.isInjured());

        if (points != null) {
            points.forEach(point -> player.addPoints(point.getGameweek(), point.getPoints()));
        }
        return player;
    }
}
