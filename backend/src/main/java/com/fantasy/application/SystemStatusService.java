package com.fantasy.application;

import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SystemStatusService {

    private final AtomicBoolean isRolloverInProgress = new AtomicBoolean(false);

    public void setRolloverInProgress(boolean status) {
        this.isRolloverInProgress.set(status);
    }

    public boolean isRolloverInProgress() {
        return isRolloverInProgress.get();
    }
}
