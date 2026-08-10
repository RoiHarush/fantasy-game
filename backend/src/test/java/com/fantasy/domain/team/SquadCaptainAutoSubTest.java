package com.fantasy.domain.team;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueScoringRules;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.score.LeagueScoringService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SquadCaptainAutoSubTest {

    @Test
    void playingViceCaptainInheritsTripleCaptainWhenCaptainDoesNotPlay() {
        Squad squad = fullSquad();
        Player originalCaptain = squad.getCaptain();
        Player viceCaptain = squad.getViceCaptain();
        squad.setTripleCaptainActive(true);

        Map<Integer, Integer> minutes = allMinutes(squad, 90);
        minutes.put(originalCaptain.getId(), 0);
        squad.autoSub(minutes);

        assertEquals(viceCaptain, squad.getCaptain());
        assertNull(squad.getViceCaptain());
        assertTrue(squad.isTripleCaptainActive());

        UserSquadEntity persistedSquad = SquadMapper.toEntity(squad, 1);
        PlayerGameweekStatsEntity viceStats = stats(viceCaptain, 90);
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));

        assertEquals(
                18,
                new LeagueScoringService().calculateSquadPoints(
                        league,
                        persistedSquad,
                        Map.of(viceCaptain.getId(), viceStats)
                )
        ); // defender earned 6 points and inherited the active Triple Captain multiplier
    }

    private static Squad fullSquad() {
        Squad squad = new Squad();
        Map<PlayerPosition, List<Player>> lineup = new EnumMap<>(PlayerPosition.class);
        for (PlayerPosition position : PlayerPosition.values()) lineup.put(position, new ArrayList<>());

        Player goalkeeper = player(1, PlayerPosition.GOALKEEPER);
        List<Player> defenders = players(2, 4, PlayerPosition.DEFENDER);
        List<Player> midfielders = players(6, 4, PlayerPosition.MIDFIELDER);
        List<Player> forwards = players(10, 2, PlayerPosition.FORWARD);
        lineup.get(PlayerPosition.GOALKEEPER).add(goalkeeper);
        lineup.get(PlayerPosition.DEFENDER).addAll(defenders);
        lineup.get(PlayerPosition.MIDFIELDER).addAll(midfielders);
        lineup.get(PlayerPosition.FORWARD).addAll(forwards);
        squad.setStartingLineup(lineup);

        Map<String, Player> bench = new LinkedHashMap<>();
        bench.put("GK", player(12, PlayerPosition.GOALKEEPER));
        bench.put("S1", player(13, PlayerPosition.DEFENDER));
        bench.put("S2", player(14, PlayerPosition.MIDFIELDER));
        bench.put("S3", player(15, PlayerPosition.FORWARD));
        squad.setBench(bench);
        List<Player> allPlayers = new ArrayList<>();
        lineup.values().forEach(allPlayers::addAll);
        allPlayers.addAll(bench.values());
        squad.setAllPlayers(allPlayers);
        squad.setCaptain(forwards.getLast());
        squad.setViceCaptain(defenders.getFirst());
        return squad;
    }

    private static Map<Integer, Integer> allMinutes(Squad squad, int minutes) {
        Map<Integer, Integer> result = new HashMap<>();
        squad.getStartingLineup().values().stream().flatMap(List::stream)
                .forEach(player -> result.put(player.getId(), minutes));
        squad.getBench().values().forEach(player -> result.put(player.getId(), minutes));
        return result;
    }

    private static List<Player> players(int firstId, int count, PlayerPosition position) {
        List<Player> result = new ArrayList<>();
        for (int offset = 0; offset < count; offset++) {
            result.add(player(firstId + offset, position));
        }
        return result;
    }

    private static Player player(int id, PlayerPosition position) {
        return new Player(id, "Test", "Player", position, 1, "Player " + id);
    }

    private static PlayerGameweekStatsEntity stats(Player player, int minutes) {
        PlayerEntity entity = new PlayerEntity();
        entity.setId(player.getId());
        entity.setPosition(player.getPosition());
        PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
        stats.setPlayer(entity);
        stats.setMinutesPlayed(minutes);
        stats.setStarted(true);
        return stats;
    }
}
