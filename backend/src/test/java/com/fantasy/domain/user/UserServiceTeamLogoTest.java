package com.fantasy.domain.user;

import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserTeamLogoEntity;
import com.fantasy.domain.team.UserTeamLogoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTeamLogoTest {

    @Test
    void storesAndReturnsTheValidatedImageAsBinaryData() {
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserTeamLogoRepository teamLogoRepository = mock(UserTeamLogoRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        LeagueAccessService leagueAccessService = mock(LeagueAccessService.class);
        UserService service = new UserService(
                userRepository,
                gameDataRepository,
                teamLogoRepository,
                mock(PasswordEncoder.class),
                leagueRepository,
                leagueAccessService
        );

        UserEntity user = new UserEntity();
        user.setId(7);
        user.setName("Test Manager");
        user.setFirstName("Test");
        user.setLastName("Manager");
        user.setUsername("manager");
        user.setRole(UserRole.ROLE_USER);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(70);
        gameData.setUser(user);
        gameData.setFantasyTeamName("Old team");

        when(userRepository.findById(7)).thenReturn(Optional.of(user));
        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));
        when(leagueRepository.findFirstByUsers_Id(7)).thenReturn(Optional.empty());
        AtomicReference<UserTeamLogoEntity> storedLogo = new AtomicReference<>();
        when(teamLogoRepository.save(any(UserTeamLogoEntity.class))).thenAnswer(invocation -> {
            UserTeamLogoEntity saved = invocation.getArgument(0);
            storedLogo.set(saved);
            return saved;
        });
        when(teamLogoRepository.findById(70)).thenAnswer(ignored -> Optional.ofNullable(storedLogo.get()));

        byte[] pngBytes = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x01, 0x02, 0x03
        };
        var upload = new MockMultipartFile("logo", "badge.png", "image/png", pngBytes);

        UserDto updated = service.updateTeamProfile(7, "Binary FC", upload);
        UserService.TeamLogoContent downloaded = service.getTeamLogo(7, 7);

        assertEquals("Binary FC", updated.getFantasyTeamName());
        assertArrayEquals(pngBytes, storedLogo.get().getLogoBytes());
        assertArrayEquals(pngBytes, downloaded.bytes());
        assertNotSame(storedLogo.get().getLogoBytes(), downloaded.bytes());
        assertEquals("image/png", downloaded.contentType());
        assertEquals(true, gameData.hasTeamLogo());
    }

    @Test
    void superAdminLogoUpdatePreservesTheManagersTeamName() {
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        UserTeamLogoRepository teamLogoRepository = mock(UserTeamLogoRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        UserService service = new UserService(
                userRepository,
                gameDataRepository,
                teamLogoRepository,
                mock(PasswordEncoder.class),
                leagueRepository,
                mock(LeagueAccessService.class)
        );

        UserEntity user = new UserEntity();
        user.setId(9);
        user.setFirstName("Galaxy");
        user.setLastName("Manager");
        user.setUsername("galaxy-manager");
        user.setRole(UserRole.ROLE_USER);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(90);
        gameData.setUser(user);
        gameData.setFantasyTeamName("Galaxy XI");

        when(userRepository.findById(9)).thenReturn(Optional.of(user));
        when(gameDataRepository.findByUserId(9)).thenReturn(Optional.of(gameData));
        when(leagueRepository.findFirstByUsers_Id(9)).thenReturn(Optional.empty());
        AtomicReference<UserTeamLogoEntity> storedLogo = new AtomicReference<>();
        when(teamLogoRepository.save(any(UserTeamLogoEntity.class))).thenAnswer(invocation -> {
            UserTeamLogoEntity saved = invocation.getArgument(0);
            storedLogo.set(saved);
            return saved;
        });

        byte[] jpegBytes = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01};
        var upload = new MockMultipartFile("logo", "badge.jpg", "image/jpeg", jpegBytes);

        UserDto updated = service.updateTeamLogo(9, upload);

        assertEquals("Galaxy XI", updated.getFantasyTeamName());
        assertArrayEquals(jpegBytes, storedLogo.get().getLogoBytes());
        assertEquals("image/jpeg", storedLogo.get().getContentType());
        assertEquals(true, gameData.hasTeamLogo());
    }
}
