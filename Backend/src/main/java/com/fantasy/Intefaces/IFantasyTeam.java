package com.fantasy.Intefaces;

import com.fantasy.FantasyTeam.Squad;
import com.fantasy.Player.Player;

public interface IFantasyTeam extends Identifiable, ITeam, Draftable, Scorable, ICaptain{
    boolean playerContain(Player player);
    Squad getSquad();
}
