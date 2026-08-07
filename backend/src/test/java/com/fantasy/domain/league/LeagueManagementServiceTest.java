package com.fantasy.domain.league;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LeagueManagementServiceTest {

    @Test
    void creatorBecomesLeagueAdminButRemainsARegularSystemUser() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserEntity creator = user(1, UserRole.ROLE_USER);
        when(userRepository.findById(1)).thenReturn(Optional.of(creator));
        when(leagueRepository.existsByUsers_Id(1)).thenReturn(false);
        when(leagueRepository.existsByLeagueCodeIgnoreCase(any())).thenReturn(false);
        when(leagueRepository.save(any(LeagueEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(gameDataRepository.findByUserId(1)).thenReturn(Optional.empty());

        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                userRepository,
                gameDataRepository
        );

        LeagueDetailsDto result = service.createLeague(
                1,
                new CreateLeagueRequest("My League", 8, "My Team", Map.of("GOAL.FORWARD", 7))
        );

        assertEquals(UserRole.ROLE_USER, creator.getRole());
        assertEquals(creator.getId(), result.adminId());
        assertTrue(result.currentUserAdmin());
        assertEquals(7, result.scoringRules().get("GOAL.FORWARD"));
        verify(gameDataRepository).save(any(UserGameDataEntity.class));
    }

    @Test
    void joiningDoesNotGrantLeagueAdminPrivileges() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserEntity admin = user(1, UserRole.ROLE_USER);
        UserEntity member = user(2, UserRole.ROLE_USER);
        LeagueEntity league = league(admin, 4);
        when(userRepository.findById(2)).thenReturn(Optional.of(member));
        when(leagueRepository.existsByUsers_Id(2)).thenReturn(false);
        when(leagueRepository.findByLeagueCodeWithLock("ABC234")).thenReturn(Optional.of(league));
        when(gameDataRepository.findByUserId(2)).thenReturn(Optional.empty());

        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                userRepository,
                gameDataRepository
        );

        LeagueDetailsDto result = service.joinLeague(
                2,
                new JoinLeagueRequest("abc234", "Member Team")
        );

        assertFalse(result.currentUserAdmin());
        assertTrue(league.getUsers().contains(member));
        assertEquals(UserRole.ROLE_USER, member.getRole());
    }

    @Test
    void joiningAFullLeagueIsRejectedWithoutCreatingGameData() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserEntity admin = user(1, UserRole.ROLE_USER);
        UserEntity existingMember = user(2, UserRole.ROLE_USER);
        UserEntity joiningUser = user(3, UserRole.ROLE_USER);
        LeagueEntity league = league(admin, 2);
        league.addUser(existingMember);

        when(userRepository.findById(3)).thenReturn(Optional.of(joiningUser));
        when(leagueRepository.existsByUsers_Id(3)).thenReturn(false);
        when(leagueRepository.findByLeagueCodeWithLock("ABC234")).thenReturn(Optional.of(league));

        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                userRepository,
                gameDataRepository
        );

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.joinLeague(3, new JoinLeagueRequest("ABC234", "Third Team"))
        );

        assertEquals("League is full", error.getMessage());
        assertFalse(league.getUsers().contains(joiningUser));
        verify(gameDataRepository, never()).save(any(UserGameDataEntity.class));
    }

    @Test
    void superAdminDoesNotBecomeLeagueAdminWithoutOwningTheLeague() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        UserEntity superAdmin = user(99, UserRole.ROLE_SUPER_ADMIN);
        LeagueEntity league = league(owner, 8);
        when(userRepository.findById(99)).thenReturn(Optional.of(superAdmin));
        when(leagueRepository.findFirstByUsers_Id(99)).thenReturn(Optional.of(league));

        LeagueDetailsDto result = new LeagueManagementService(
                leagueRepository,
                userRepository,
                mock(UserGameDataRepository.class)
        ).getMyLeague(99);

        assertFalse(result.currentUserAdmin());
        assertSame(owner, league.getAdmin());
    }

    @Test
    void regularMemberCannotChangeLeagueSettings() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        UserEntity member = user(2, UserRole.ROLE_USER);
        LeagueEntity league = league(owner, 8);
        league.addUser(member);
        when(userRepository.findById(2)).thenReturn(Optional.of(member));
        when(leagueRepository.findByIdWithLock(10L)).thenReturn(Optional.of(league));

        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                userRepository,
                mock(UserGameDataRepository.class)
        );

        assertThrows(
                AccessDeniedException.class,
                () -> service.updateSettings(
                        2,
                        10L,
                        new UpdateLeagueSettingsRequest("Changed Name", null, null)
                )
        );
    }

    @Test
    void superAdminCannotChangeLeagueSettingsWithoutOwningTheLeague() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        UserEntity superAdmin = user(99, UserRole.ROLE_SUPER_ADMIN);
        LeagueEntity league = league(owner, 8);
        when(userRepository.findById(99)).thenReturn(Optional.of(superAdmin));
        when(leagueRepository.findByIdWithLock(10L)).thenReturn(Optional.of(league));
        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                userRepository,
                mock(UserGameDataRepository.class)
        );

        assertThrows(
                AccessDeniedException.class,
                () -> service.updateSettings(
                        99,
                        10L,
                        new UpdateLeagueSettingsRequest("Updated by Super Admin", 10, null)
                )
        );
        assertEquals("Test League", league.getName());
        assertSame(owner, league.getAdmin());
    }

    @Test
    void maintenanceUpdateUsesExplicitLeagueAndPreservesOwnership() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        LeagueEntity league = league(owner, 8);
        when(leagueRepository.findByIdWithLock(10L)).thenReturn(Optional.of(league));
        when(leagueRepository.save(league)).thenReturn(league);
        LeagueManagementService service = new LeagueManagementService(
                leagueRepository,
                mock(UserRepository.class),
                mock(UserGameDataRepository.class)
        );

        LeagueDetailsDto result = service.updateSettingsForMaintenance(
                10L,
                new UpdateLeagueSettingsRequest("Maintained League", 10, null)
        );

        assertEquals("Maintained League", result.name());
        assertEquals(10, result.maxParticipants());
        assertFalse(result.currentUserAdmin());
        assertSame(owner, league.getAdmin());
    }

    @Test
    void leagueAdminCanRemoveAManagerOnlyBeforeTheDraftStarts() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        UserEntity member = user(2, UserRole.ROLE_USER);
        LeagueEntity league = league(owner, 4);
        league.addUser(member);
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(member);
        gameData.setLeague(league);

        when(userRepository.findById(1)).thenReturn(Optional.of(owner));
        when(leagueRepository.findByIdWithLock(10L)).thenReturn(Optional.of(league));
        when(leagueRepository.save(league)).thenReturn(league);
        when(gameDataRepository.findByUserId(2)).thenReturn(Optional.of(gameData));

        LeagueDetailsDto result = new LeagueManagementService(
                leagueRepository,
                userRepository,
                gameDataRepository
        ).removeMember(1, 10L, 2);

        assertEquals(1, result.participantCount());
        assertFalse(league.getUsers().contains(member));
        verify(gameDataRepository).delete(gameData);
    }

    @Test
    void activeLeagueDoesNotExposeItsInviteCode() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        UserEntity owner = user(1, UserRole.ROLE_USER);
        LeagueEntity league = league(owner, 4);
        league.setStatus(LeagueStatus.ACTIVE);
        when(userRepository.findById(1)).thenReturn(Optional.of(owner));
        when(leagueRepository.findFirstByUsers_Id(1)).thenReturn(Optional.of(league));

        LeagueDetailsDto result = new LeagueManagementService(
                leagueRepository,
                userRepository,
                mock(UserGameDataRepository.class)
        ).getMyLeague(1);

        assertEquals(null, result.leagueCode());
    }

    private static LeagueEntity league(UserEntity admin, int capacity) {
        LeagueEntity league = new LeagueEntity();
        league.setName("Test League");
        league.setLeagueCode("ABC234");
        league.setAdmin(admin);
        league.setUsers(new java.util.ArrayList<>(List.of(admin)));
        league.setMaxParticipants(capacity);
        league.setScoringRules(LeagueScoringRules.defaults());
        return league;
    }

    private static UserEntity user(int id, UserRole role) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("User " + id);
        user.setUsername("user" + id);
        user.setPassword("encoded");
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(role);
        return user;
    }
}
