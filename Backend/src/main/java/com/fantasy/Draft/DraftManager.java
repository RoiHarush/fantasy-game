package com.fantasy.Draft;

import com.fantasy.Draft.Exceptions.NotUserTurnException;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerRepository;
import com.fantasy.Player.PlayerState;
import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.User.User;

import java.util.List;
//TODO: Add exceptions
public final class DraftManager {

    public void startDraft(DraftRoom room, List<User> orderedUsers, PlayerRepository playersPoll){
        room.startDraft(orderedUsers, playersPoll);
    }

    public void makePick(DraftRoom room, User user, Player playerIn, Player playerOut){
        if (!room.isUsersTurn(user))
            throw new NotUserTurnException();
        if (room.isInitialDraft())
            DraftLogic.firstPicks(room, user, playerIn);
        else
            DraftLogic.makeTransfer(room, user, playerIn, playerOut);
        room.advanceTurn();
    }

    public User getCurrentUser(DraftRoom room){
        return room.getCurrentUser();
    }

    public List<Player> getAvailablePlayers(DraftRoom room){
        return room.getPlayersPoll().getPlayers();
    }
}
