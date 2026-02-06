package com.fantasy.domain.transfer;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "draft_config")
public class DraftConfig {
    @Id
    private Integer id = 1;
    private LocalDateTime scheduledTime;
    private boolean processed = true;

    public Integer getId() { return id; }
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
}