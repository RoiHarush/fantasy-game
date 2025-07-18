package com.fantasy.Draft;

import com.fantasy.Draft.Exceptions.NotAvailablePlayerException;
import com.fantasy.Draft.Exceptions.NotOwnPlayerException;
import com.fantasy.Intefaces.IFantasyTeam;
import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerState;
import com.fantasy.User.User;

public class DraftLogic {

    public  static void firstPicks(DraftRoom room, User user, Player player){
        PlayerState state = player.getState();
        if (!room.isPlayerAvailable(player) || state != PlayerState.NONE)
            throw new NotAvailablePlayerException("This player cannot be chosen");
        IFantasyTeam fantasyTeam = user.getFantasyTeam();
        fantasyTeam.makePick(player);
        player.setState(PlayerState.IN_USE);
        room.removePlayerFromPlayersPoll(player);
        room.updateTurnHistory(user, player);
    }

    public static void makeTransfer(DraftRoom room, User user, Player playerIn, Player playerOut) {
        PlayerState state = playerIn.getState();
        if (!room.isPlayerAvailable(playerIn) || state != PlayerState.NONE)
            throw new NotAvailablePlayerException("This player cannot be chosen");
        IFantasyTeam fantasyTeam = user.getFantasyTeam();
        if (!fantasyTeam.playerContain(playerOut))
            throw new NotOwnPlayerException("Cant make transfer with player the not in the club");
        fantasyTeam.makeTransfer(playerIn,playerOut);
        room.removePlayerFromPlayersPoll(playerIn);
        room.addPlayerToPlayersPoll(playerOut);
        room.updateTurnHistory(user, playerIn);
    }
}
