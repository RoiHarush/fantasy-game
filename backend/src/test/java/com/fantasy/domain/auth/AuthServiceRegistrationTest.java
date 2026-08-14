package com.fantasy.domain.auth;

import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import com.fantasy.domain.auth.mail.AuthMailService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
        AuthTokenService authTokenService = mock(AuthTokenService.class);
        AuthMailService authMailService = mock(AuthMailService.class);
        when(userRepository.existsByUsername("new.user")).thenReturn(false);
        when(passwordEncoder.encode("secure-pass")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(42);
            return user;
        });
        when(authTokenService.issue(any(), any(), any())).thenReturn(
                new AuthTokenService.IssuedToken("raw-token-value", java.time.LocalDateTime.now().plusHours(24))
        );

        AuthService service = new AuthService(
                userRepository,
                mock(UserGameDataRepository.class),
                jwtService,
                passwordEncoder,
                leagueRepository,
                authTokenService,
                authMailService
        );

        AuthMessageResponse response = service.register(
                new RegisterRequest("New", "User", null, "New.User", "new.user@example.com", "secure-pass")
        );

        assertEquals("Account created. Check your email to verify it before signing in.", response.message());
        verify(authMailService).sendVerification(any(), any());
        verify(authTokenService).issue(any(), any(), any());
        verify(userRepository).save(any(UserEntity.class));
        verify(userRepository).save(org.mockito.ArgumentMatchers.argThat(user ->
                user.getUsername().equals("new.user")
                        && user.getEmail().equals("new.user@example.com")
                        && user.getFirstName().equals("New")
                        && user.getLastName().equals("User")
                        && user.getRole() == UserRole.ROLE_USER
                        && !user.isEmailVerified()
        ));
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
                mock(LeagueRepository.class),
                mock(AuthTokenService.class),
                mock(AuthMailService.class)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.register(new RegisterRequest(null, null, "New User", "taken", "new@example.com", "secure-pass"))
        );
    }
}
