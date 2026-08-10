package com.fantasy.domain.user;

import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTeamLogoTest {

    @Test
    void storesAndReturnsTheValidatedImageAsBinaryData() {
        UserRepository userRepository = mock(UserRepository.class);
        UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        LeagueAccessService leagueAccessService = mock(LeagueAccessService.class);
        UserService service = new UserService(
                userRepository,
                gameDataRepository,
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
        gameData.setUser(user);
        gameData.setFantasyTeamName("Old team");

        when(userRepository.findById(7)).thenReturn(Optional.of(user));
        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));
        when(leagueRepository.findFirstByUsers_Id(7)).thenReturn(Optional.empty());

        byte[] pngBytes = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x01, 0x02, 0x03
        };
        var upload = new MockMultipartFile("logo", "badge.png", "image/png", pngBytes);

        UserDto updated = service.updateTeamProfile(7, "Binary FC", upload);
        UserService.TeamLogoContent downloaded = service.getTeamLogo(7, 7);

        assertEquals("Binary FC", updated.getFantasyTeamName());
        assertArrayEquals(pngBytes, gameData.getTeamLogoBytes());
        assertArrayEquals(pngBytes, downloaded.bytes());
        assertNotSame(gameData.getTeamLogoBytes(), downloaded.bytes());
        assertEquals("image/png", downloaded.contentType());
    }
}
