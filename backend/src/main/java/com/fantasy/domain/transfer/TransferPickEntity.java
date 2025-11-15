package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "GAMEWEEK_TRANSFER_ORDER")
public class TransferPickEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int position;

    @Column(name = "USER_ID")
    private int userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GAMEWEEK_ID")
    private GameWeekEntity gameWeek;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public GameWeekEntity getGameWeek() {
        return gameWeek;
    }

    public void setGameWeek(GameWeekEntity gameWeek) {
        this.gameWeek = gameWeek;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }
}