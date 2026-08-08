package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.realWorldData.TeamRepository;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRole;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.SupplementalDraftPoolService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlayerServiceOwnershipTest {

    @Test
    void projectsPlayerOwnershipFromTheRequestingUsersLeagueSquads() {
        PlayerRepository playerRepository = mock(PlayerRepository.class);
        PlayerPointsRepository pointsRepository = mock(PlayerPointsRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        LeagueEntity league = new LeagueEntity();
        league.setId(10L);

        UserEntity owner = user(7, "Owner");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(1));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(owner);
        gameData.setNextSquad(squad);

        when(leagueRepository.findFirstByUsers_Id(42)).thenReturn(Optional.of(league));
        when(gameDataRepository.findAllByLeagueIdWithSquads(10L)).thenReturn(List.of(gameData));
        when(pointsRepository.findAll()).thenReturn(List.of());
        when(playerRepository.findAll()).thenReturn(List.of(player(1), player(2)));

        PlayerService service = new PlayerService(
                playerRepository,
                pointsRepository,
                mock(PlayerGameweekStatsRepository.class),
                mock(TeamRepository.class),
                mock(FixtureRepository.class),
                mock(UserSquadRepository.class),
                mock(FixtureService.class),
                leagueRepository,
                gameDataRepository,
                mock(LeagueScoringService.class),
                mock(SupplementalDraftPoolService.class),
                mock(LeagueTransferWindowRepository.class)
        );

        List<PlayerDto> players = service.getAllPlayers(42);

        PlayerDto owned = players.stream().filter(player -> player.getId() == 1).findFirst().orElseThrow();
        PlayerDto free = players.stream().filter(player -> player.getId() == 2).findFirst().orElseThrow();
        assertEquals(7, owned.getOwnerId());
        assertEquals("Owner", owned.getOwnerName());
        assertNull(free.getOwnerId());
        assertTrue(free.isAvailable());
    }

    private static PlayerEntity player(int id) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setFirstName("Test");
        player.setLastName("Player");
        player.setViewName("Player " + id);
        player.setPosition(PlayerPosition.MIDFIELDER);
        player.setTeamId(1);
        return player;
    }

    private static UserEntity user(int id, String name) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName(name);
        user.setUsername("user" + id);
        user.setPassword("encoded");
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(UserRole.ROLE_USER);
        return user;
    }
}
