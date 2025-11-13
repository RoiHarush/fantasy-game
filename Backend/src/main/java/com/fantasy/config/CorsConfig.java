package com.fantasy.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    public CorsConfig() {
        System.out.println(">>> CorsConfig LOADED <<<");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        System.out.println(">>> addCorsMappings CALLED <<<");

        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://192.168.68.53:5173",
                        "https://fantasy-draft-sigma.vercel.app",
                        "https://mari-saccharine-kaysen.ngrok-free.dev",
                        "https://gmc-automatically-usd-nicholas.trycloudflare.com"
                )
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}



