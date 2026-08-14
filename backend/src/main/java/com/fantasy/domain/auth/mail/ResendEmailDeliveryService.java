package com.fantasy.domain.auth.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "resend")
public class ResendEmailDeliveryService implements EmailDeliveryService {
    private final RestClient client;
    private final String from;

    public ResendEmailDeliveryService(
            RestClient.Builder builder,
            @Value("${app.mail.resend.api-key:}") String apiKey,
            @Value("${app.mail.from:}") String from) {
        Assert.hasText(apiKey, "RESEND_API_KEY is required when MAIL_PROVIDER=resend");
        Assert.hasText(from, "MAIL_FROM is required when MAIL_PROVIDER=resend");
        this.from = from;
        this.client = builder
                .baseUrl("https://api.resend.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    @Override
    public void send(OutboundEmail email) {
        client.post()
                .uri("/emails")
                .header("Idempotency-Key", email.idempotencyKey())
                .body(Map.of(
                        "from", from,
                        "to", List.of(email.to()),
                        "subject", email.subject(),
                        "html", email.html(),
                        "text", email.text()
                ))
                .retrieve()
                .toBodilessEntity();
    }
}
