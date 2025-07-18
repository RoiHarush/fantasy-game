package com.fantasy.Match;
//TODO: Add exceptions
public class GameMinute {
    private int minute;
    private Half half;

    public GameMinute(int minute, Half half){
        setMinute(minute);
        setHalf(half);
    }

    public int getMinute() {
        return minute;
    }

    public void setMinute(int minute) {
        this.minute = minute;
    }

    public Half getHalf() {
        return half;
    }

    public void setHalf(Half half) {
        this.half = half;
    }
}
