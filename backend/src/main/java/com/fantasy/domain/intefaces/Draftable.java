package com.fantasy.domain.intefaces;

import com.fantasy.domain.player.Player;

public interface Draftable{
    void makePick(Player player);
    void makeTransfer(Player playerIn, Player playerOut);
}
