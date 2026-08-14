package com.fantasy.domain.auth;

import com.fantasy.domain.auth.mail.AuthMailService;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceEmailAuthenticationTest {
    private UserRepository users;
    private PasswordEncoder passwords;
    private JwtService jwt;
    private AuthTokenService tokens;
    private AuthMailService mail;
    private AuthService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        passwords = mock(PasswordEncoder.class);
        jwt = mock(JwtService.class);
        tokens = mock(AuthTokenService.class);
        mail = mock(AuthMailService.class);
        service = new AuthService(
                users,
                mock(UserGameDataRepository.class),
                jwt,
                passwords,
                mock(LeagueRepository.class),
                tokens,
                mail
        );
    }

    @Test
    void signsInWithVerifiedEmail() {
        UserEntity user = user(true);
        when(users.findByUsernameOrEmail(user.getEmail(), user.getEmail())).thenReturn(Optional.of(user));
        when(passwords.matches("secret-pass", user.getPassword())).thenReturn(true);
        when(jwt.generateToken(7, "ROLE_USER")).thenReturn("jwt");

        LoginResponse response = service.login(new LoginRequest(user.getEmail(), null, "secret-pass"));

        assertEquals("jwt", response.token);
        assertEquals(user.getEmail(), response.user.getEmail());
    }

    @Test
    void refusesSessionBeforeEmailVerification() {
        UserEntity user = user(false);
        when(users.findByUsernameOrEmail(user.getUsername(), user.getUsername())).thenReturn(Optional.of(user));
        when(passwords.matches("secret-pass", user.getPassword())).thenReturn(true);

        EmailVerificationRequiredException exception = assertThrows(
                EmailVerificationRequiredException.class,
                () -> service.login(new LoginRequest(user.getUsername(), null, "secret-pass"))
        );
        assertEquals(user.getEmail(), exception.getEmail());
        verifyNoInteractions(jwt);
    }

    @Test
    void consumesVerificationTokenAndActivatesAccount() {
        UserEntity user = user(false);
        when(tokens.consume("verification-token", AuthTokenType.EMAIL_VERIFICATION)).thenReturn(user);
        when(jwt.generateToken(7, "ROLE_USER")).thenReturn("verification-session");

        EmailVerificationResponse response = service.verifyEmail(new TokenRequest("verification-token"));

        assertTrue(user.isEmailVerified());
        assertEquals("Email verified. Your account is ready.", response.message());
        assertEquals("verification-session", response.token());
        assertEquals(user.getEmail(), response.user().getEmail());
        verify(users).save(user);
        verify(tokens).invalidate(user, AuthTokenType.EMAIL_VERIFICATION);
    }

    @Test
    void consumesResetTokenAndReplacesPasswordHash() {
        UserEntity user = user(true);
        when(tokens.consume("reset-token", AuthTokenType.PASSWORD_RESET)).thenReturn(user);
        when(passwords.encode("new-secret")).thenReturn("new-hash");

        service.resetPassword(new ResetPasswordRequest("reset-token", "new-secret"));

        assertEquals("new-hash", user.getPassword());
        verify(tokens).invalidate(user, AuthTokenType.PASSWORD_RESET);
    }

    private UserEntity user(boolean verified) {
        UserEntity user = new UserEntity();
        user.setId(7);
        user.setUsername("manager");
        user.setEmail("manager@example.com");
        user.setEmailVerified(verified);
        user.setPassword("old-hash");
        user.setName("Test Manager");
        user.setFirstName("Test");
        user.setLastName("Manager");
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(UserRole.ROLE_USER);
        return user;
    }
}
