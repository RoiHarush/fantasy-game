package com.fantasy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;
    private final String[] allowedOriginPatterns;
    private final ThreadPoolTaskScheduler messageBrokerTaskScheduler;

    public WebSocketConfig(
            WebSocketAuthChannelInterceptor authChannelInterceptor,
            @Qualifier("fantasyWebSocketHeartbeatScheduler") ThreadPoolTaskScheduler messageBrokerTaskScheduler,
            @Value("${app.websocket.allowed-origin-patterns:http://localhost:3000,http://127.0.0.1:3000}") String allowedOriginPatterns) {
        this.authChannelInterceptor = authChannelInterceptor;
        this.messageBrokerTaskScheduler = messageBrokerTaskScheduler;
        this.allowedOriginPatterns = java.util.Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(messageBrokerTaskScheduler)
                .setHeartbeatValue(new long[] {10_000, 10_000});
        config.setApplicationDestinationPrefixes("/app");
    }

    @Bean(name = "fantasyWebSocketHeartbeatScheduler")
    public static ThreadPoolTaskScheduler fantasyWebSocketHeartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("websocket-heartbeat-");
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOriginPatterns)
                .withSockJS();
    }
}
