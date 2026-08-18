package com.fantasy.domain.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "tokenType";
    private static final String SESSION_TOKEN_TYPE = "session";
    private static final String WEBSOCKET_TOKEN_TYPE = "websocket";
    private static final long WEBSOCKET_TICKET_EXPIRATION_MILLIS = 30_000;

    private final Key signingKey;
    private final long expirationMillis;

    public JwtService(@Value("${app.jwt.secret}") String secretKey,
                      @Value("${app.jwt.expiration-millis:86400000}") long expirationMillis) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured");
        }

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("JWT_SECRET must be a valid Base64 value", exception);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes");
        }
        if (expirationMillis <= 0) {
            throw new IllegalStateException("JWT expiration must be positive");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(Integer userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put(TOKEN_TYPE_CLAIM, SESSION_TOKEN_TYPE);
        return createToken(claims, String.valueOf(userId), expirationMillis);
    }

    public String generateWebSocketTicket(Integer userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put(TOKEN_TYPE_CLAIM, WEBSOCKET_TOKEN_TYPE);
        return createToken(claims, String.valueOf(userId), WEBSOCKET_TICKET_EXPIRATION_MILLIS);
    }

    private String createToken(Map<String, Object> claims, String subject, long tokenExpirationMillis) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setClaims(claims)
                .setId(UUID.randomUUID().toString())
                .setSubject(subject)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + tokenExpirationMillis))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
            // Tokens created before token types were introduced remain valid
            // sessions until their normal expiration time.
            return tokenType == null || SESSION_TOKEN_TYPE.equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isWebSocketTicketValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return WEBSOCKET_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM, String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public long getWebSocketTicketExpirationMillis() {
        return WEBSOCKET_TICKET_EXPIRATION_MILLIS;
    }

    public Integer extractUserId(String token) {
        return Integer.parseInt(extractClaim(token, Claims::getSubject));
    }

    public String extractRole(String token) {
        final Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        return signingKey;
    }
}
