package com.fantasy.domain.fantasyTeam;

import com.fantasy.domain.fantasyTeam.Exceptions.InvalidFormationException;
import com.fantasy.domain.fantasyTeam.Exceptions.InvalidSquadException;
import com.fantasy.domain.fantasyTeam.Exceptions.InvalidTransferPlayersException;
import com.fantasy.domain.fantasyTeam.Exceptions.PlayerAlreadyPickedException;
import com.fantasy.domain.intefaces.IFantasyTeam;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerState;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class FantasyTeam implements IFantasyTeam {
    private final int gameweek;
    private Squad squad;
    private int totalPoints;

    public FantasyTeam(int gameweek, Squad squad) {
        this.squad = squad;
        this.totalPoints = squad != null ? calculatePoints() : 0;
        this.gameweek = gameweek;
    }

    public Squad getSquad() {
        return this.squad;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public void setSquad(Squad squad){
        this.squad = squad;
    }

    public int getGameweek() {
        return gameweek;
    }

    @Override
    public String toString() {
        return "" + '\n' + this.squad + "\nPoints: " + totalPoints;
    }

    public void makePick(Player player) {
        this.squad.makePick(player);
    }

    public void saveSquad(Squad squad, boolean firstPickUsed){
        if (!squad.validate(firstPickUsed))
            throw new InvalidSquadException("illegal squad");
        for (PlayerPosition pp : PlayerPosition.values()) {
            for (Player player : squad.getStartingLineup().get(pp))
                if (player != null)
                    player.setState(PlayerState.STARTING);
        }
        for (String key : squad.getBench().keySet()){
            Player player = squad.getBench().get(key);
            if (player != null)
                player.setState(PlayerState.BENCH);
        }


        setSquad(squad);
    }

    public void makeTransfer(Player playerIn, Player playerOut) {
        if (playerIn.getPosition() != playerOut.getPosition()) {
            throw new InvalidTransferPlayersException("Cannot transfer players of different positions");
        }

        if (playerIn.getState() != PlayerState.NONE) {
            throw new PlayerAlreadyPickedException("Player in is already taken");
        }

        Integer inTeam  = playerIn.getTeamId();
        Integer outTeam = playerOut.getTeamId();

        int existing = (int) squad.getAllPlayers().stream()
                .filter(p -> Objects.equals(p.getTeamId(), inTeam))
                .count();

        int postCount = existing + 1 - (Objects.equals(outTeam, inTeam) ? 1 : 0);

        if (postCount > 3) {
            throw new InvalidFormationException("Cannot have more than 3 players from the same team");
        }

        this.squad.makeTransfer(playerIn, playerOut);
    }

    public boolean playerContain(Player player) {
        return this.squad.getPlayerById(player.getId()) != null;
    }

    public void setCaptain(Player captain) {
        this.squad.assignCaptain(captain);
    }

    public void setViceCaptain(Player viceCaptain) {
        this.squad.assignViceCaptain(viceCaptain);
    }

    public void setIR(Player IR){
        this.squad.assignIR(IR);
    }

    public void setFirstPickCaptain(){
        this.squad.signFirstPickCaptain();
    }

    public void releaseIR(Player playerOut){
        this.squad.releaseIR(playerOut);
    }

    public void releaseFirstPickCaptain(){
        this.squad.releaseFirstPickCaptain();
    }

    public int calculatePoints() {
        if (squad == null) return 0;

        int total = 0;

        Map<PlayerPosition, List<Player>> starting = squad.getStartingLineup();

        for (PlayerPosition key : starting.keySet()) {
            for (Player p : starting.get(key))
            {
                if (squad.getCaptain() != null && p.equals(squad.getCaptain())){
                    total += 2 * (p.getPointsForGameWeek(gameweek));
                }
                else
                    total += p.getPointsForGameWeek(gameweek);
            }

        }

        this.totalPoints = total;
        return total;
    }
}
