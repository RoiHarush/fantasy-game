package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerCurrentUserTest {

    private final AuthService authService = mock(AuthService.class);
    private final AuthController controller = new AuthController(authService);

    @Test
    void rejectsUnauthenticatedCurrentUserRequest() {
        ResponseEntity<UserDto> response = controller.currentUser(null);

        assertEquals(401, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void returnsAuthoritativeNormalUser() {
        assertCurrentUser(11, "ROLE_USER", false);
    }

    @Test
    void returnsAuthoritativeLeagueAdmin() {
        assertCurrentUser(12, "ROLE_USER", true);
    }

    @Test
    void returnsAuthoritativeSuperAdmin() {
        assertCurrentUser(13, "ROLE_SUPER_ADMIN", false);
    }

    private void assertCurrentUser(int userId, String role, boolean leagueAdmin) {
        UserDto expected = new UserDto();
        expected.setId(userId);
        expected.setRole(role);
        expected.setLeagueAdmin(leagueAdmin);
        when(authService.getCurrentUser(userId)).thenReturn(expected);

        ResponseEntity<UserDto> response = controller.currentUser(userId);

        assertEquals(200, response.getStatusCode().value());
        assertSame(expected, response.getBody());
        verify(authService).getCurrentUser(userId);
    }
}
