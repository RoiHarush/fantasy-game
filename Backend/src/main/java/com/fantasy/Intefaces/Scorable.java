package com.fantasy.Intefaces;

import com.fantasy.Game.GameWeek;

public interface Scorable {
    void addPoints(int gameWeek, int points);
    int getTotalPoints();
}
