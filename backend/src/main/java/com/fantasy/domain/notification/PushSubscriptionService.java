package com.fantasy.domain.notification;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PushSubscriptionService {
    private final PushSubscriptionRepository repository;
    private final UserRepository userRepository;

    public PushSubscriptionService(PushSubscriptionRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void upsert(int userId, PushSubscriptionRequest request) {
        validate(request);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
        LocalDateTime now = LocalDateTime.now();
        PushSubscriptionEntity entity = repository.findByEndpoint(request.endpoint())
                .orElseGet(() -> {
                    PushSubscriptionEntity created = new PushSubscriptionEntity();
                    created.setEndpoint(request.endpoint());
                    created.setCreatedAt(now);
                    return created;
                });
        // A browser endpoint belongs to the currently authenticated account on
        // that browser. Reassigning prevents notifications for a previous login.
        entity.setUser(user);
        entity.setP256dh(request.p256dh());
        entity.setAuthSecret(request.auth());
        entity.setClientInstanceId(trim(request.clientInstanceId(), 128));
        entity.setExpirationTime(request.expirationTime());
        entity.setUpdatedAt(now);
        entity.setDisabledAt(null);
        repository.save(entity);
    }

    @Transactional
    public void remove(int userId, String endpoint) {
        if (endpoint == null || endpoint.isBlank()) return;
        repository.deleteByEndpointAndUser_Id(endpoint, userId);
    }

    private void validate(PushSubscriptionRequest request) {
        if (request == null || request.endpoint() == null || request.endpoint().isBlank()
                || request.p256dh() == null || request.p256dh().isBlank()
                || request.auth() == null || request.auth().isBlank()) {
            throw new IllegalArgumentException("A complete push subscription is required");
        }
        if (request.endpoint().length() > 2048) {
            throw new IllegalArgumentException("Push endpoint is too long");
        }
    }

    private String trim(String value, int maxLength) {
        if (value == null || value.isBlank()) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
