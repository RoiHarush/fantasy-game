package com.fantasy.config;

import com.fantasy.application.SessionManager;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.infrastructure.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private final SessionManager sessionManager;
    private final UserRepository userRepo;

    public TokenAuthFilter(SessionManager sessionManager, UserRepository userRepo) {
        this.sessionManager = sessionManager;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        Integer userId = sessionManager.getUserId(token);
        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<UserEntity> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        UserEntity user = userOpt.get();

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(user.getRole().name()));

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                user,
                null,
                authorities
        );

        SecurityContextHolder.getContext().setAuthentication(authToken);
        filterChain.doFilter(request, response);
    }
}