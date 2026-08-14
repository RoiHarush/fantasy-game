package com.fantasy.config;

import com.fantasy.domain.auth.JwtService;
import com.fantasy.domain.league.LeagueAccessService;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class WebSocketAuthChannelInterceptorTest {

    @Test
    void authenticatesConnectFrameFromJwt() {
        JwtService jwtService = mock(JwtService.class);
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(jwtService.extractUserId("valid-token")).thenReturn(12);
        when(jwtService.extractRole("valid-token")).thenReturn("ROLE_USER");
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(
                jwtService,
                mock(LeagueAccessService.class)
        );
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer valid-token");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, mock(org.springframework.messaging.MessageChannel.class));
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);

        assertNotNull(resultAccessor);
        assertNotNull(resultAccessor.getUser());
        assertEquals("12", resultAccessor.getUser().getName());
    }

    @Test
    void keepsThePrincipalEstablishedByTheCookieAuthenticatedHandshake() {
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(
                mock(JwtService.class),
                mock(LeagueAccessService.class)
        );
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                "12",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, mock(org.springframework.messaging.MessageChannel.class));
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);

        assertNotNull(resultAccessor);
        assertEquals("12", resultAccessor.getUser().getName());
    }

    @Test
    void blocksSubscriptionToAnotherLeague() {
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        when(leagueAccess.requireLeagueIdForUser(12)).thenReturn(4L);
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(
                mock(JwtService.class),
                leagueAccess
        );
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setLeaveMutable(true);
        accessor.setDestination("/topic/leagues/9/transfers");
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                "12",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(
                AccessDeniedException.class,
                () -> interceptor.preSend(message, mock(org.springframework.messaging.MessageChannel.class))
        );
    }

    @Test
    void letsTheSuperAdminObserveAnyLeagueTopicWithoutJoiningIt() {
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(
                mock(JwtService.class),
                leagueAccess
        );
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setLeaveMutable(true);
        accessor.setDestination("/topic/leagues/99/transfers");
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                "1",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))
        ));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertNotNull(interceptor.preSend(message, mock(org.springframework.messaging.MessageChannel.class)));
        verifyNoInteractions(leagueAccess);
    }
}
