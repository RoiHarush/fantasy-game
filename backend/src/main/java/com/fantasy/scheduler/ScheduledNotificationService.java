package com.fantasy.scheduler;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationDeliveryRepository;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.transfer.DraftType;
import com.fantasy.domain.transfer.LeagueTransferWindowEntity;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.TransferWindowType;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduledNotificationService {
    private final LeagueRepository leagueRepository;
    private final LeagueTransferWindowRepository transferWindowRepository;
    private final ApplicationEventPublisher events;
    private final NotificationDeliveryRepository deliveryRepository;

    public ScheduledNotificationService(LeagueRepository leagueRepository,
                                        LeagueTransferWindowRepository transferWindowRepository,
                                        ApplicationEventPublisher events,
                                        NotificationDeliveryRepository deliveryRepository) {
        this.leagueRepository = leagueRepository;
        this.transferWindowRepository = transferWindowRepository;
        this.events = events;
        this.deliveryRepository = deliveryRepository;
    }

    public void transferWindowOpeningSoon(GameWeekEntity gameweek) {
        leagueRepository.findIdsByStatus(LeagueStatus.ACTIVE).stream()
                .filter(leagueId -> !leagueRepository.findUserIdsByLeagueId(leagueId).isEmpty())
                .forEach(leagueId -> events.publishEvent(LeagueNotificationRequestedEvent.leagueExcluding(
                        leagueId,
                        transferNotificationExclusions(leagueId, gameweek.getId()),
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

    public void draftOpeningSoon(long leagueId,
                                 long draftConfigId,
                                 long scheduledEpochSecond,
                                 DraftType draftType) {
        if (leagueRepository.findUserIdsByLeagueId(leagueId).isEmpty()) {
            return;
        }
        events.publishEvent(LeagueNotificationRequestedEvent.league(
                leagueId,
                NotificationEvents.draftOpeningSoon(
                        leagueId,
                        draftConfigId,
                        scheduledEpochSecond,
                        draftType == DraftType.SUPPLEMENTAL
                )
        ));
    }

    @Transactional(readOnly = true)
    public boolean transferWindowOpeningSoonComplete(GameWeekEntity gameweek) {
        return allActiveLeagueUsersDelivered(gameweek, true);
    }

    @Transactional(readOnly = true)
    public boolean lineupLockSoonComplete(GameWeekEntity gameweek) {
        return allActiveLeagueUsersDelivered(gameweek, false);
    }

    @Transactional(readOnly = true)
    public boolean draftOpeningSoonComplete(long leagueId,
                                            long draftConfigId,
                                            long scheduledEpochSecond,
                                            DraftType draftType) {
        var userIds = leagueRepository.findUserIdsByLeagueId(leagueId);
        if (userIds.isEmpty()) {
            return false;
        }
        String eventId = NotificationEvents.draftOpeningSoon(
                leagueId,
                draftConfigId,
                scheduledEpochSecond,
                draftType == DraftType.SUPPLEMENTAL
        ).eventId();
        return userIds.stream().allMatch(userId ->
                deliveryRepository.existsByEventIdAndUser_Id(eventId, userId));
    }

    private boolean allActiveLeagueUsersDelivered(GameWeekEntity gameweek, boolean transferWarning) {
        return leagueRepository.findIdsByStatus(LeagueStatus.ACTIVE).stream()
                .flatMap(leagueId -> {
                    var exclusions = transferWarning
                            ? transferNotificationExclusions(leagueId, gameweek.getId())
                            : java.util.Set.<Integer>of();
                    return leagueRepository.findUserIdsByLeagueId(leagueId).stream()
                            .filter(userId -> !exclusions.contains(userId))
                            .map(userId -> new LeagueUser(leagueId, userId));
                })
                .allMatch(target -> deliveryRepository.existsByEventIdAndUser_Id(
                        transferWarning
                                ? NotificationEvents.windowOpeningSoon(target.leagueId(), gameweek.getId()).eventId()
                                : NotificationEvents.lineupLockSoon(target.leagueId(), gameweek.getId()).eventId(),
                        target.userId()
                ));
    }

    private java.util.Set<Integer> transferNotificationExclusions(long leagueId, int gameweekId) {
        return transferWindowRepository.findByLeague_IdAndGameWeek_IdAndWindowType(
                        leagueId,
                        gameweekId,
                        TransferWindowType.TRANSFER
                )
                .map(LeagueTransferWindowEntity::getAutomaticUserIds)
                .orElseGet(java.util.Set::of);
    }

    private record LeagueUser(long leagueId, int userId) {}
}
