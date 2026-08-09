package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "waiver_plan_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_waiver_progress_user_gw",
                columnNames = {"league_id", "user_id", "gameweek_id"}
        )
)
public class WaiverPlanProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gameweek_id", nullable = false)
    private GameWeekEntity gameWeek;

    private int nextPriority = 1;

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public UserEntity getUser() { return user; }
    public GameWeekEntity getGameWeek() { return gameWeek; }
    public int getNextPriority() { return nextPriority; }

    public void setLeague(LeagueEntity league) { this.league = league; }
    public void setUser(UserEntity user) { this.user = user; }
    public void setGameWeek(GameWeekEntity gameWeek) { this.gameWeek = gameWeek; }
    public void setNextPriority(int nextPriority) { this.nextPriority = Math.max(1, nextPriority); }
}
