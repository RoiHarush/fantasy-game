package com.fantasy.domain.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class WebPushSender {
    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);

    private final PushSubscriptionRepository repository;
    private final ObjectMapper objectMapper;
    private final PushService pushService;

    public WebPushSender(
            PushSubscriptionRepository repository,
            ObjectMapper objectMapper,
            @Value("${app.web-push.vapid.public-key:}") String publicKey,
            @Value("${app.web-push.vapid.private-key:}") String privateKey,
            @Value("${app.web-push.vapid.subject:mailto:admin@example.com}") String subject
    ) throws GeneralSecurityException {
        this.repository = repository;
        this.objectMapper = objectMapper;
        if (publicKey == null || publicKey.isBlank() || privateKey == null || privateKey.isBlank()) {
            this.pushService = null;
        } else {
            registerBouncyCastleProvider();
            this.pushService = new PushService(publicKey, privateKey, subject);
        }
    }

    private static void registerBouncyCastleProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public boolean send(int userId, NotificationEvent event) {
        if (pushService == null) {
            log.debug("Push delivery skipped because VAPID is not configured: eventId={}", event.eventId());
            return false;
        }

        String payload = payload(event);
        boolean delivered = false;
        List<PushSubscriptionEntity> changedSubscriptions = new ArrayList<>();
        for (PushSubscriptionEntity subscription : repository.findAllByUser_IdAndDisabledAtIsNull(userId)) {
            try {
                Notification notification = new Notification(
                        subscription.getEndpoint(),
                        subscription.getP256dh(),
                        subscription.getAuthSecret(),
                        payload
                );
                HttpResponse response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();
                EntityUtils.consumeQuietly(response.getEntity());
                if (status >= 200 && status < 300) {
                    subscription.setLastSuccessAt(LocalDateTime.now());
                    changedSubscriptions.add(subscription);
                    delivered = true;
                } else if (status == 404 || status == 410) {
                    subscription.setDisabledAt(LocalDateTime.now());
                    changedSubscriptions.add(subscription);
                } else {
                    log.warn("Push provider rejected event: eventId={}, status={}", event.eventId(), status);
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                log.warn("Push delivery was interrupted: eventId={}, subscriptionId={}",
                        event.eventId(), subscription.getId(), exception);
            } catch (Exception exception) {
                log.warn("Push delivery failed: eventId={}, subscriptionId={}",
                        event.eventId(), subscription.getId(), exception);
            }
        }
        if (!changedSubscriptions.isEmpty()) {
            repository.saveAll(changedSubscriptions);
        }
        return delivered;
    }

    private String payload(NotificationEvent event) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "eventId", event.eventId(),
                    "type", event.type(),
                    "title", event.title(),
                    "body", event.body(),
                    "url", event.url()
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize push notification", exception);
        }
    }
}
