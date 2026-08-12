package com.fantasy.config;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import java.util.Arrays;
import java.util.Set;

import com.fantasy.domain.auth.AuthCookieService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final boolean secureCookies;
    private static final Set<String> SAFE_HTTP_METHODS = Set.of("GET", "HEAD", "TRACE", "OPTIONS");

    public SecurityConfig(
            @Value("${app.auth.cookie-secure:false}") boolean secureCookies) {
        this.secureCookies = secureCookies;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenAuthFilter tokenAuthFilter) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieCustomizer(cookie -> cookie
                .path("/")
                .sameSite("Lax")
                .secure(secureCookies));

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        // The embedded H2 console has its own form flow and cannot provide
                        // the application's CSRF header. It is enabled only in the dev profile.
                        .ignoringRequestMatchers("/h2-console/**")
                        .requireCsrfProtectionMatcher(this::requiresCsrfProtection))
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/healthz").permitAll()
                        .requestMatchers("/actuator/health/**").permitAll()

                        .requestMatchers("/api/players/squad-data").authenticated()
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_SUPER_ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/players/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/gameweeks/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/fixtures/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/fpl/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams").permitAll()

                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                )
                .headers(headers ->
                        headers.frameOptions(frameOptions -> frameOptions.sameOrigin())
                )
                .addFilterBefore(tokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private boolean requiresCsrfProtection(HttpServletRequest request) {
        if (SAFE_HTTP_METHODS.contains(request.getMethod())) {
            return false;
        }

        if (request.getCookies() == null) {
            return false;
        }

        return Arrays.stream(request.getCookies())
                .anyMatch(cookie -> AuthCookieService.SESSION_COOKIE_NAME.equals(cookie.getName()));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
