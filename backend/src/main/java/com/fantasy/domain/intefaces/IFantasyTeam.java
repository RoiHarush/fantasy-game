package com.fantasy.domain.intefaces;

import com.fantasy.domain.team.Squad;
import com.fantasy.domain.player.Player;

public interface IFantasyTeam extends Draftable, Scorable, ICaptain{
    boolean playerContain(Player player);
    Squad getSquad();
}
