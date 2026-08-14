package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserEntity;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthTokenService {
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private final SecureRandom secureRandom = new SecureRandom();
    private final AuthTokenRepository repository;

    public AuthTokenService(AuthTokenRepository repository) {
        this.repository = repository;
    }

    public IssuedToken issue(UserEntity user, AuthTokenType type, Duration lifetime) {
        repository.deleteAllByUserAndType(user, type);
        String rawToken = generateToken();
        LocalDateTime now = LocalDateTime.now();
        AuthTokenEntity entity = new AuthTokenEntity();
        entity.setUser(user);
        entity.setType(type);
        entity.setTokenHash(hash(rawToken));
        entity.setCreatedAt(now);
        entity.setExpiresAt(now.plus(lifetime));
        repository.save(entity);
        return new IssuedToken(rawToken, entity.getExpiresAt());
    }

    public UserEntity consume(String rawToken, AuthTokenType type) {
        String normalized = rawToken == null ? "" : rawToken.trim();
        AuthTokenEntity entity = repository.findByTokenHashAndType(hash(normalized), type)
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid or has already been used"));
        LocalDateTime now = LocalDateTime.now();
        if (entity.getConsumedAt() != null || !entity.getExpiresAt().isAfter(now)) {
            throw new IllegalArgumentException("This link has expired or has already been used");
        }
        entity.setConsumedAt(now);
        repository.save(entity);
        return entity.getUser();
    }

    public boolean canIssue(UserEntity user, AuthTokenType type) {
        return repository.findFirstByUserAndTypeOrderByCreatedAtDesc(user, type)
                .map(token -> token.getCreatedAt().plus(RESEND_COOLDOWN).isBefore(LocalDateTime.now()))
                .orElse(true);
    }

    public void invalidate(UserEntity user, AuthTokenType type) {
        repository.deleteAllByUserAndType(user, type);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public record IssuedToken(String value, LocalDateTime expiresAt) {}
}
