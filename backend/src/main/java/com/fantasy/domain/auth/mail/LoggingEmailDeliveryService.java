package com.fantasy.domain.auth.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "log", matchIfMissing = true)
public class LoggingEmailDeliveryService implements EmailDeliveryService {
    private static final Logger log = LoggerFactory.getLogger(LoggingEmailDeliveryService.class);

    @Override
    public void send(OutboundEmail email) {
        log.info("Development email to={} subject={}\n{}", email.to(), email.subject(), email.text());
    }
}
