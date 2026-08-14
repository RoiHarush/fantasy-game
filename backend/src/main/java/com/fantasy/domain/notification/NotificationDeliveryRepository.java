package com.fantasy.domain.notification;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDeliveryEntity, Long> {
    boolean existsByEventIdAndUser_Id(String eventId, Integer userId);
}
