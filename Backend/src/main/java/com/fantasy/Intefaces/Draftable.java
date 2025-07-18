package com.fantasy.Intefaces;

import com.fantasy.Player.Player;

public interface Draftable{
    void makePick(Player player);
    void makeTransfer(Player playerIn, Player playerOut);
}
