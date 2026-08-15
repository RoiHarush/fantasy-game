package com.fantasy.domain.notification;

import com.fantasy.domain.league.LeagueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class LeagueNotificationEventHandler {
    private static final Logger log = LoggerFactory.getLogger(LeagueNotificationEventHandler.class);

    private final LeagueRepository leagueRepository;
    private final NotificationRouter router;

    public LeagueNotificationEventHandler(LeagueRepository leagueRepository, NotificationRouter router) {
        this.leagueRepository = leagueRepository;
        this.router = router;
    }

    @EventListener
    public void handle(LeagueNotificationRequestedEvent event) {
        try {
            if (event.targetUserId() != null) {
                router.route(event.targetUserId(), event.notification());
                return;
            }
            var recipients = leagueRepository.findUserIdsByLeagueId(event.leagueId());
            recipients.stream()
                    .distinct()
                    .filter(userId -> !event.excludedUserIds().contains(userId))
                    .forEach(userId -> router.route(
                            userId,
                            event.notification(),
                            event.sourceUserId() != null && event.sourceUserId().equals(userId)
                    ));
        } catch (RuntimeException exception) {
            // Notification delivery must never roll back or stop the fantasy action.
            log.error("Notification routing failed: eventId={}, leagueId={}",
                    event.notification().eventId(), event.leagueId(), exception);
        }
    }
}
