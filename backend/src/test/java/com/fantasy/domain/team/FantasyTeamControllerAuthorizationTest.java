package com.fantasy.domain.team;

import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.league.LeagueAccessService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FantasyTeamControllerAuthorizationTest {

    @Test
    void saveTeamUsesAuthenticatedUserInsteadOfPathUser() {
        FantasyTeamService service = mock(FantasyTeamService.class);
        FantasyTeamController controller = new FantasyTeamController(
                service,
                mock(UserRepository.class),
                mock(LeagueAccessService.class)
        );
        SquadDto request = new SquadDto();
        when(service.saveTeam(42, request)).thenReturn(request);

        controller.saveTeam(
                999,
                request,
                new UsernamePasswordAuthenticationToken("42", null)
        );

        verify(service).saveTeam(42, request);
    }

    @Test
    void chipMutationUsesAuthenticatedUserInsteadOfPathUser() {
        FantasyTeamService service = mock(FantasyTeamService.class);
        FantasyTeamController controller = new FantasyTeamController(
                service,
                mock(UserRepository.class),
                mock(LeagueAccessService.class)
        );

        controller.assignFirstPickCaptain(
                999,
                new UsernamePasswordAuthenticationToken("42", null)
        );

        verify(service).assignFirstPickCaptain(42);
    }
}
