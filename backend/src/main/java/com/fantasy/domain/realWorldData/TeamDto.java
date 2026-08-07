package com.fantasy.domain.realWorldData;

public record TeamDto(
        int id,
        String name,
        String shortName,
        int code,
        Integer assetCode,
        String badgeUrl,
        String fieldKitUrl,
        String goalkeeperKitUrl
) {
}
