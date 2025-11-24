package com.fantasy.domain.game;

import com.fantasy.domain.transfer.TransferPickEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "gameweeks")
public class GameWeekEntity {

    @Id
    private int id;

    private String name;
    private LocalDateTime firstKickoffTime;
    private LocalDateTime lastKickoffTime;
    private String status;
    private LocalDateTime transferOpenTime;

    @OneToMany(mappedBy = "gameWeek", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransferPickEntity> transferOrder;

    @Column(columnDefinition = "boolean default false")
    private boolean calculated = false;

    public GameWeekEntity() {}

    public GameWeekEntity(int id, String name, LocalDateTime firstKickoffTime,
                          LocalDateTime lastKickoffTime, String status) {
        this.id = id;
        this.name = name;
        this.firstKickoffTime = firstKickoffTime;
        this.lastKickoffTime = lastKickoffTime;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDateTime getFirstKickoffTime() { return firstKickoffTime; }
    public void setFirstKickoffTime(LocalDateTime firstKickoffTime) { this.firstKickoffTime = firstKickoffTime; }

    public LocalDateTime getLastKickoffTime() { return lastKickoffTime; }
    public void setLastKickoffTime(LocalDateTime lastKickoffTime) { this.lastKickoffTime = lastKickoffTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getTransferOpenTime() { return transferOpenTime; }
    public void setTransferOpenTime(LocalDateTime transferOpenTime) { this.transferOpenTime = transferOpenTime; }

    public List<TransferPickEntity> getTransferOrder() { return transferOrder; }
    public void setTransferOrder(List<TransferPickEntity> transferOrder) { this.transferOrder = transferOrder; }

    public boolean isCalculated() { return calculated; }
    public void setCalculated(boolean calculated) { this.calculated = calculated; }
}
