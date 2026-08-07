package com.fantasy.config;

import com.fantasy.domain.auth.JwtService;
import com.fantasy.domain.league.LeagueAccessService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final String LEAGUE_TOPIC_PREFIX = "/topic/leagues/";
    private static final String TRANSFER_TOPIC_SUFFIX = "/transfers";

    private final JwtService jwtService;
    private final LeagueAccessService leagueAccessService;

    public WebSocketAuthChannelInterceptor(JwtService jwtService,
                                           LeagueAccessService leagueAccessService) {
        this.jwtService = jwtService;
        this.leagueAccessService = leagueAccessService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;
        if (accessor.getCommand() == StompCommand.CONNECT) {
            authenticate(accessor);
        } else if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            authorizeSubscription(accessor);
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }

        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new AccessDeniedException("WebSocket authentication is required");
        }
        String token = authorization.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new AccessDeniedException("Invalid WebSocket token");
        }

        int userId = jwtService.extractUserId(token);
        String role = jwtService.extractRole(token);
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                String.valueOf(userId),
                null,
                List.of(new SimpleGrantedAuthority(role))
        ));
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) {
            throw new AccessDeniedException("WebSocket authentication is required");
        }
        String destination = accessor.getDestination();
        if (destination == null
                || !destination.startsWith(LEAGUE_TOPIC_PREFIX)
                || !destination.endsWith(TRANSFER_TOPIC_SUFFIX)) {
            return;
        }

        String leaguePart = destination.substring(
                LEAGUE_TOPIC_PREFIX.length(),
                destination.length() - TRANSFER_TOPIC_SUFFIX.length()
        );
        long requestedLeagueId;
        try {
            requestedLeagueId = Long.parseLong(leaguePart);
        } catch (NumberFormatException exception) {
            throw new AccessDeniedException("Invalid league topic");
        }

        int userId = Integer.parseInt(accessor.getUser().getName());
        boolean superAdmin = ((UsernamePasswordAuthenticationToken) accessor.getUser())
                .getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (!superAdmin && leagueAccessService.requireLeagueIdForUser(userId) != requestedLeagueId) {
            throw new AccessDeniedException("Cannot subscribe to another league");
        }
    }
}
