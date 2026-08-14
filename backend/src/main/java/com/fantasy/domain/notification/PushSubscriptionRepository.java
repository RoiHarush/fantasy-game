package com.fantasy.domain.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntity, Long> {
    Optional<PushSubscriptionEntity> findByEndpoint(String endpoint);
    List<PushSubscriptionEntity> findAllByUser_IdAndDisabledAtIsNull(Integer userId);
    void deleteByEndpointAndUser_Id(String endpoint, Integer userId);
}
