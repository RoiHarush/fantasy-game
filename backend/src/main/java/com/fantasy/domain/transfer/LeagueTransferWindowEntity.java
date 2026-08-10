package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Entity
@Table(
        name = "league_transfer_windows",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_transfer_window_league_gw_type",
                columnNames = {"league_id", "gameweek_id", "window_type"}
        )
)
public class LeagueTransferWindowEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gameweek_id", nullable = false)
    private GameWeekEntity gameWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "window_type", nullable = false, length = 24)
    private TransferWindowType windowType = TransferWindowType.TRANSFER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TransferWindowStatus status = TransferWindowStatus.READY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TransferWindowPhase phase = TransferWindowPhase.REGULAR;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "league_transfer_window_order",
            joinColumns = @JoinColumn(name = "window_id")
    )
    @OrderColumn(name = "turn_position")
    @Column(name = "user_id", nullable = false)
    private List<Integer> turnOrder = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "league_transfer_window_canonical_order",
            joinColumns = @JoinColumn(name = "window_id")
    )
    @OrderColumn(name = "turn_position")
    @Column(name = "user_id", nullable = false)
    private List<Integer> canonicalOrder = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "league_transfer_window_ir_order",
            joinColumns = @JoinColumn(name = "window_id")
    )
    @OrderColumn(name = "turn_position")
    @Column(name = "user_id", nullable = false)
    private List<Integer> irOrder = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "league_transfer_window_auto_users",
            joinColumns = @JoinColumn(name = "window_id")
    )
    @Column(name = "user_id", nullable = false)
    private Set<Integer> automaticUserIds = new LinkedHashSet<>();

    @Column(nullable = false)
    private int regularCursor;

    @Column(nullable = false)
    private int irCursor;

    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private LocalDateTime turnStartedAt;

    @Version
    private long version;

    public Optional<Integer> currentUserId() {
        if (status != TransferWindowStatus.OPEN) {
            return Optional.empty();
        }
        List<Integer> activeOrder = phase == TransferWindowPhase.IR ? irOrder : turnOrder;
        int cursor = phase == TransferWindowPhase.IR ? irCursor : regularCursor;
        return cursor < activeOrder.size() ? Optional.of(activeOrder.get(cursor)) : Optional.empty();
    }

    public void open(List<Integer> eligibleIrUsers) {
        if (status == TransferWindowStatus.CLOSED) {
            throw new IllegalStateException("Transfer window was already completed");
        }
        if (turnOrder.isEmpty()) {
            throw new IllegalStateException("Transfer order cannot be empty");
        }
        irOrder = eligibleIrUsers == null ? new ArrayList<>() : new ArrayList<>(eligibleIrUsers);
        status = TransferWindowStatus.OPEN;
        phase = TransferWindowPhase.REGULAR;
        regularCursor = 0;
        irCursor = 0;
        openedAt = LocalDateTime.now();
        turnStartedAt = openedAt;
        closedAt = null;
    }

    public void advanceTurn() {
        if (status != TransferWindowStatus.OPEN) {
            throw new IllegalStateException("Transfer window is not active");
        }

        if (phase == TransferWindowPhase.REGULAR) {
            regularCursor++;
            if (regularCursor >= turnOrder.size()) {
                if (irOrder.isEmpty()) {
                    close();
                } else {
                    phase = TransferWindowPhase.IR;
                    turnStartedAt = LocalDateTime.now();
                }
            } else {
                turnStartedAt = LocalDateTime.now();
            }
            return;
        }

        irCursor++;
        if (irCursor >= irOrder.size()) {
            close();
        } else {
            turnStartedAt = LocalDateTime.now();
        }
    }

    public void close() {
        status = TransferWindowStatus.CLOSED;
        closedAt = LocalDateTime.now();
    }

    public void finishRegularPhase() {
        if (status != TransferWindowStatus.OPEN || phase != TransferWindowPhase.REGULAR) return;
        regularCursor = turnOrder.size();
        if (irOrder.isEmpty()) {
            close();
        } else {
            phase = TransferWindowPhase.IR;
            turnStartedAt = LocalDateTime.now();
        }
    }

    public List<Integer> remainingOrder() {
        List<Integer> activeOrder = phase == TransferWindowPhase.IR ? irOrder : turnOrder;
        int cursor = phase == TransferWindowPhase.IR ? irCursor : regularCursor;
        return cursor >= activeOrder.size()
                ? List.of()
                : new ArrayList<>(activeOrder.subList(cursor, activeOrder.size()));
    }

    public List<Integer> initialOrder() {
        return new ArrayList<>(new LinkedHashSet<>(turnOrder));
    }

    public List<Integer> canonicalInitialOrder() {
        List<Integer> source = canonicalOrder.isEmpty() ? turnOrder : canonicalOrder;
        return new ArrayList<>(new LinkedHashSet<>(source));
    }

    public Map<Integer, Integer> turnsUsed() {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        for (Integer userId : turnOrder) {
            result.putIfAbsent(userId, 0);
        }
        for (int i = 0; i < Math.min(regularCursor, turnOrder.size()); i++) {
            result.merge(turnOrder.get(i), 1, Integer::sum);
        }
        for (int i = 0; i < Math.min(irCursor, irOrder.size()); i++) {
            result.merge(irOrder.get(i), 1, Integer::sum);
        }
        return result;
    }

    public Map<Integer, Integer> totalTurns() {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        for (Integer userId : turnOrder) {
            result.merge(userId, 1, Integer::sum);
        }
        return result;
    }

    public boolean isAutomaticForUser(int userId) {
        return automaticUserIds.contains(userId);
    }

    public void setAutomaticForUser(int userId, boolean automatic) {
        if (automatic) {
            automaticUserIds.add(userId);
        } else {
            automaticUserIds.remove(userId);
        }
    }

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public GameWeekEntity getGameWeek() { return gameWeek; }
    public TransferWindowType getWindowType() { return windowType; }
    public TransferWindowStatus getStatus() { return status; }
    public TransferWindowPhase getPhase() { return phase; }
    public List<Integer> getTurnOrder() { return turnOrder; }
    public List<Integer> getCanonicalOrder() { return canonicalOrder; }
    public List<Integer> getIrOrder() { return irOrder; }
    public Set<Integer> getAutomaticUserIds() { return new LinkedHashSet<>(automaticUserIds); }
    public int getRegularCursor() { return regularCursor; }
    public int getIrCursor() { return irCursor; }
    public LocalDateTime getOpenedAt() { return openedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public LocalDateTime getTurnStartedAt() { return turnStartedAt; }
    public long getVersion() { return version; }

    public void setLeague(LeagueEntity league) { this.league = league; }
    public void setGameWeek(GameWeekEntity gameWeek) { this.gameWeek = gameWeek; }
    public void setWindowType(TransferWindowType windowType) { this.windowType = windowType; }
    public void setTurnOrder(List<Integer> turnOrder) {
        this.turnOrder = turnOrder == null ? new ArrayList<>() : new ArrayList<>(turnOrder);
    }
    public void setCanonicalOrder(List<Integer> canonicalOrder) {
        this.canonicalOrder = canonicalOrder == null ? new ArrayList<>() : new ArrayList<>(canonicalOrder);
    }
}
