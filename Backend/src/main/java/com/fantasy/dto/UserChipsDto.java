package com.fantasy.dto;

import java.util.Map;

public class UserChipsDto {
    private Map<String, Integer> remaining;
    private Map<String, Boolean> active;

    public Map<String, Integer> getRemaining() {
        return remaining;
    }

    public void setRemaining(Map<String, Integer> remaining) {
        this.remaining = remaining;
    }

    public Map<String, Boolean> getActive() {
        return active;
    }

    public void setActive(Map<String, Boolean> active) {
        this.active = active;
    }
}

