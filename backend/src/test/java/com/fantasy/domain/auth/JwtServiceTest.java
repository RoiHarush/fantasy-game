package com.fantasy.domain.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String TEST_SECRET =
            "ZmFudGFzeS10ZXN0LW9ubHktc2lnbmluZy1rZXktMzItYnl0ZXM=";

    @Test
    void createsAndValidatesTokenFromConfiguredSecret() {
        JwtService service = new JwtService(TEST_SECRET, 60_000);

        String token = service.generateToken(42, "ROLE_USER");

        assertTrue(service.isTokenValid(token));
        assertEquals(42, service.extractUserId(token));
        assertEquals("ROLE_USER", service.extractRole(token));
    }

    @Test
    void rejectsMissingOrWeakSecrets() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 60_000));
        assertThrows(IllegalStateException.class, () -> new JwtService("c2hvcnQ=", 60_000));
    }

    @Test
    void rejectsTokensSignedWithAnotherKey() {
        JwtService first = new JwtService(TEST_SECRET, 60_000);
        JwtService second = new JwtService(
                "YW5vdGhlci10ZXN0LW9ubHktc2lnbmluZy1rZXktMzItYnl0ZXM=",
                60_000
        );

        assertFalse(second.isTokenValid(first.generateToken(42, "ROLE_USER")));
    }
}
