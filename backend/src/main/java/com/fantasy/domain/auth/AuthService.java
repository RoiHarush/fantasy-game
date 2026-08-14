package com.fantasy.domain.auth;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.user.*;
import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.domain.auth.mail.AuthMailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Duration VERIFICATION_LIFETIME = Duration.ofHours(24);
    private static final Duration PASSWORD_RESET_LIFETIME = Duration.ofMinutes(30);
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,63}$",
            Pattern.CASE_INSENSITIVE
    );

    private final UserRepository userRepo;
    private final UserGameDataRepository userGameDataRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final LeagueRepository leagueRepository;
    private final AuthTokenService authTokenService;
    private final AuthMailService authMailService;

    public AuthService(UserRepository userRepo,
                       UserGameDataRepository userGameDataRepo,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       LeagueRepository leagueRepository,
                       AuthTokenService authTokenService,
                       AuthMailService authMailService) {
        this.userRepo = userRepo;
        this.userGameDataRepo = userGameDataRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.leagueRepository = leagueRepository;
        this.authTokenService = authTokenService;
        this.authMailService = authMailService;
    }

    public LoginResponse login(LoginRequest req) {
        String identifier = requireText(req.resolvedIdentifier(), "Email or username", 3, 320)
                .toLowerCase(Locale.ROOT);
        UserEntity user = userRepo.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("Invalid email, username, or password"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new RuntimeException("Invalid email, username, or password");
        }
        if (!user.isEmailVerified()) {
            throw new EmailVerificationRequiredException(user.getEmail());
        }

        String token = jwtService.generateToken(user.getId(), user.getRole().name());

        UserDto userDto = buildUserDto(user);

        return new LoginResponse(token, userDto);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(int userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user was not found"));
        return buildUserDto(user);
    }

    @Transactional
    public AuthMessageResponse register(RegisterRequest request) {
        NameParts nameParts = resolveName(request);
        String username = requireText(request.username(), "Username", 3, 30)
                .toLowerCase(Locale.ROOT);
        String email = requireEmail(request.email());
        String password = requireText(request.password(), "Password", 8, 72);

        if (!username.matches("[a-z0-9._-]+")) {
            throw new IllegalArgumentException(
                    "Username may only contain letters, digits, dots, underscores and hyphens"
            );
        }
        if (userRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email address is already registered");
        }

        UserEntity user = new UserEntity();
        user.setFirstName(nameParts.firstName());
        user.setLastName(nameParts.lastName());
        user.setName(nameParts.fullName());
        user.setUsername(username);
        user.setEmail(email);
        user.setEmailVerified(false);
        user.setPassword(passwordEncoder.encode(password));
        user.setRegisteredAt(LocalDateTime.now());
        user.setRole(UserRole.ROLE_USER);
        UserEntity savedUser = userRepo.save(user);
        AuthTokenService.IssuedToken token = authTokenService.issue(
                savedUser,
                AuthTokenType.EMAIL_VERIFICATION,
                VERIFICATION_LIFETIME
        );
        sendAfterCommit(() -> authMailService.sendVerification(savedUser, token));
        return new AuthMessageResponse("Account created. Check your email to verify it before signing in.");
    }

    @Transactional
    public EmailVerificationResponse verifyEmail(TokenRequest request) {
        UserEntity user = authTokenService.consume(request == null ? null : request.token(), AuthTokenType.EMAIL_VERIFICATION);
        user.setEmailVerified(true);
        userRepo.save(user);
        authTokenService.invalidate(user, AuthTokenType.EMAIL_VERIFICATION);
        String sessionToken = jwtService.generateToken(user.getId(), user.getRole().name());
        return new EmailVerificationResponse(
                sessionToken,
                buildUserDto(user),
                "Email verified. Your account is ready."
        );
    }

    @Transactional
    public AuthMessageResponse resendVerification(ResendVerificationRequest request) {
        String email = requireEmail(request == null ? null : request.email());
        userRepo.findByEmail(email)
                .filter(user -> !user.isEmailVerified())
                .filter(user -> authTokenService.canIssue(user, AuthTokenType.EMAIL_VERIFICATION))
                .ifPresent(user -> {
                    AuthTokenService.IssuedToken token = authTokenService.issue(
                            user,
                            AuthTokenType.EMAIL_VERIFICATION,
                            VERIFICATION_LIFETIME
                    );
                    sendAfterCommit(() -> authMailService.sendVerification(user, token));
                });
        return new AuthMessageResponse("If that account still needs verification, a new email has been sent.");
    }

    @Transactional
    public AuthMessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = requireEmail(request == null ? null : request.email());
        userRepo.findByEmail(email)
                .filter(UserEntity::isEmailVerified)
                .filter(user -> authTokenService.canIssue(user, AuthTokenType.PASSWORD_RESET))
                .ifPresent(user -> {
                    AuthTokenService.IssuedToken token = authTokenService.issue(
                            user,
                            AuthTokenType.PASSWORD_RESET,
                            PASSWORD_RESET_LIFETIME
                    );
                    sendAfterCommit(() -> authMailService.sendPasswordReset(user, token));
                });
        return new AuthMessageResponse("If a verified account exists for that email, a reset link has been sent.");
    }

    @Transactional
    public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
        String password = requireText(request == null ? null : request.password(), "Password", 8, 72);
        UserEntity user = authTokenService.consume(
                request == null ? null : request.token(),
                AuthTokenType.PASSWORD_RESET
        );
        user.setPassword(passwordEncoder.encode(password));
        userRepo.save(user);
        authTokenService.invalidate(user, AuthTokenType.PASSWORD_RESET);
        return new AuthMessageResponse("Password updated. You can now sign in with the new password.");
    }

    private UserDto buildUserDto(UserEntity user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setRole(user.getRole().name());
        dto.setLogoPath("/UI/team-placeholder.svg");

        if (user.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            dto.setFantasyTeamName("N/A");
            return dto;
        }

        UserGameDataEntity gameData = userGameDataRepo.findByUserId(user.getId()).orElse(null);
        String teamName = gameData == null ? "No Team" : gameData.getFantasyTeamName();

        dto.setFantasyTeamName(teamName);
        if (gameData != null && gameData.getTeamLogoBytes() != null && gameData.getTeamLogoBytes().length > 0) {
            dto.setLogoVersion(gameData.getTeamLogoVersion());
            dto.setLogoPath("/api/users/" + user.getId() + "/team-logo?v=" + gameData.getTeamLogoVersion());
        } else {
            dto.setLogoPath("/UI/team-placeholder.svg");
        }

        leagueRepository.findFirstByUsers_Id(user.getId()).ifPresent(league -> {
            dto.setLeagueId(league.getId());
            dto.setLeagueAdmin(league.getAdmin().getId().equals(user.getId()));
            dto.setLeagueStatus(league.getStatus().name());
        });

        return dto;
    }

    private String requireText(String value, String field, int minLength, int maxLength) {
        if (value == null) {
            throw new IllegalArgumentException(field + " is required");
        }
        String normalized = value.trim();
        if (normalized.length() < minLength || normalized.length() > maxLength) {
            throw new IllegalArgumentException(
                    field + " must contain between " + minLength + " and " + maxLength + " characters"
            );
        }
        return normalized;
    }

    private String requireEmail(String value) {
        String email = requireText(value, "Email", 5, 320).toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Enter a valid email address");
        }
        return email;
    }

    private void sendAfterCommit(Runnable action) {
        AfterCommitExecutor.run(() -> {
            try {
                action.run();
            } catch (RuntimeException exception) {
                log.error("Unable to deliver authentication email", exception);
            }
        });
    }

    private NameParts resolveName(RegisterRequest request) {
        if (request.firstName() != null && !request.firstName().isBlank()
                && request.lastName() != null && !request.lastName().isBlank()) {
            String firstName = requireText(request.firstName(), "First name", 1, 50);
            String lastName = requireText(request.lastName(), "Last name", 1, 50);
            return new NameParts(firstName, lastName);
        }

        String legacyName = requireText(request.name(), "Name", 2, 100);
        int separator = legacyName.indexOf(' ');
        if (separator < 0) {
            return new NameParts(legacyName, "");
        }
        return new NameParts(legacyName.substring(0, separator), legacyName.substring(separator + 1).trim());
    }

    private record NameParts(String firstName, String lastName) {
        private String fullName() {
            return (firstName + " " + lastName).trim();
        }
    }
}
