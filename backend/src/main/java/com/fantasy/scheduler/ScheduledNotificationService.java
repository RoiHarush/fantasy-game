package com.fantasy.scheduler;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationDeliveryRepository;
import com.fantasy.domain.notification.NotificationEvents;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduledNotificationService {
    private final LeagueRepository leagueRepository;
    private final ApplicationEventPublisher events;
    private final NotificationDeliveryRepository deliveryRepository;

    public ScheduledNotificationService(LeagueRepository leagueRepository,
                                        ApplicationEventPublisher events,
                                        NotificationDeliveryRepository deliveryRepository) {
        this.leagueRepository = leagueRepository;
        this.events = events;
        this.deliveryRepository = deliveryRepository;
    }

    public void transferWindowOpeningSoon(GameWeekEntity gameweek) {
        leagueRepository.findIdsByStatus(LeagueStatus.ACTIVE).stream()
                .filter(leagueId -> !leagueRepository.findUserIdsByLeagueId(leagueId).isEmpty())
                .forEach(leagueId -> events.publishEvent(LeagueNotificationRequestedEvent.league(
                        leagueId,
                        NotificationEvents.windowOpeningSoon(leagueId, gameweek.getId())
                )));
    }

    public void lineupLockSoon(GameWeekEntity gameweek) {
        leagueRepository.findIdsByStatus(LeagueStatus.ACTIVE).stream()
                .filter(leagueId -> !leagueRepository.findUserIdsByLeagueId(leagueId).isEmpty())
                .forEach(leagueId -> events.publishEvent(LeagueNotificationRequestedEvent.league(
                        leagueId,
                        NotificationEvents.lineupLockSoon(leagueId, gameweek.getId())
                )));
    }

    @Transactional(readOnly = true)
    public boolean transferWindowOpeningSoonComplete(GameWeekEntity gameweek) {
        return allActiveLeagueUsersDelivered(gameweek, true);
    }

    @Transactional(readOnly = true)
    public boolean lineupLockSoonComplete(GameWeekEntity gameweek) {
        return allActiveLeagueUsersDelivered(gameweek, false);
    }

    private boolean allActiveLeagueUsersDelivered(GameWeekEntity gameweek, boolean transferWarning) {
        return leagueRepository.findIdsByStatus(LeagueStatus.ACTIVE).stream()
                .flatMap(leagueId -> leagueRepository.findUserIdsByLeagueId(leagueId).stream().map(userId -> new LeagueUser(
                        leagueId, userId
                )))
                .allMatch(target -> deliveryRepository.existsByEventIdAndUser_Id(
                        transferWarning
                                ? NotificationEvents.windowOpeningSoon(target.leagueId(), gameweek.getId()).eventId()
                                : NotificationEvents.lineupLockSoon(target.leagueId(), gameweek.getId()).eventId(),
                        target.userId()
                ));
    }

    private record LeagueUser(long leagueId, int userId) {}
}
