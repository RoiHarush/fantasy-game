package com.fantasy.domain.league;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeagueAccessServiceTest {

    @Test
    void deniesAccessToAUserInAnotherLeague() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserEntity actingUser = user(1, UserRole.ROLE_USER);
        when(users.findById(1)).thenReturn(Optional.of(actingUser));
        when(leagues.findFirstByUsers_Id(1)).thenReturn(Optional.of(league(10L)));
        when(leagues.findFirstByUsers_Id(2)).thenReturn(Optional.of(league(20L)));

        LeagueAccessService service = new LeagueAccessService(leagues, users);

        assertThrows(AccessDeniedException.class, () -> service.requireSameLeague(1, 2));
    }

    @Test
    void allowsUsersFromTheSameLeague() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(1)).thenReturn(Optional.of(user(1, UserRole.ROLE_USER)));
        when(leagues.findFirstByUsers_Id(1)).thenReturn(Optional.of(league(10L)));
        when(leagues.findFirstByUsers_Id(2)).thenReturn(Optional.of(league(10L)));

        LeagueAccessService service = new LeagueAccessService(leagues, users);

        assertDoesNotThrow(() -> service.requireSameLeague(1, 2));
    }

    @Test
    void superAdminCanInspectUsersAcrossLeagues() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(99)).thenReturn(Optional.of(user(99, UserRole.ROLE_SUPER_ADMIN)));

        LeagueAccessService service = new LeagueAccessService(leagues, users);

        assertDoesNotThrow(() -> service.requireSameLeague(99, 2));
    }

    @Test
    void superAdminDoesNotInheritLeagueAdminControls() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserEntity superAdmin = user(99, UserRole.ROLE_SUPER_ADMIN);
        LeagueEntity managedLeague = league(10L);
        managedLeague.setAdmin(user(1, UserRole.ROLE_USER));
        when(users.findById(99)).thenReturn(Optional.of(superAdmin));
        when(leagues.findById(10L)).thenReturn(Optional.of(managedLeague));

        LeagueAccessService service = new LeagueAccessService(leagues, users);

        assertThrows(AccessDeniedException.class, () -> service.requireLeagueAdmin(99, 10L));
    }

    private static LeagueEntity league(long id) {
        LeagueEntity league = new LeagueEntity();
        league.setId(id);
        return league;
    }

    private static UserEntity user(int id, UserRole role) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setRole(role);
        return user;
    }
}
