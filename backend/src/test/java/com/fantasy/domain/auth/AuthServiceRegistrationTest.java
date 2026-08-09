package com.fantasy.domain.auth;

import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceRegistrationTest {

    @Test
    void registersARegularSystemUserWithoutGrantingAdminRole() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        JwtService jwtService = mock(JwtService.class);
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        when(userRepository.existsByUsername("new.user")).thenReturn(false);
        when(passwordEncoder.encode("secure-pass")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(42);
            return user;
        });
        when(jwtService.generateToken(42, "ROLE_USER")).thenReturn("token");

        AuthService service = new AuthService(
                userRepository,
                mock(UserGameDataRepository.class),
                jwtService,
                passwordEncoder,
                leagueRepository
        );

        LoginResponse response = service.register(
                new RegisterRequest("New", "User", null, "New.User", "secure-pass")
        );

        assertEquals("token", response.token);
        assertEquals(42, response.user.getId());
        assertEquals("new.user", response.user.getUsername());
        assertEquals("New", response.user.getFirstName());
        assertEquals("User", response.user.getLastName());
        assertEquals("New User", response.user.getName());
        assertEquals("ROLE_USER", response.user.getRole());
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    void rejectsDuplicateUsernames() {
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.existsByUsername("taken")).thenReturn(true);
        AuthService service = new AuthService(
                userRepository,
                mock(UserGameDataRepository.class),
                mock(JwtService.class),
                mock(PasswordEncoder.class),
                mock(LeagueRepository.class)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.register(new RegisterRequest("New User", "taken", "secure-pass"))
        );
    }
}
