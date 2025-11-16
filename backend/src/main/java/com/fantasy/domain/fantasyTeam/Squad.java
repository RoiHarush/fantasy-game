package com.fantasy.domain.fantasyTeam;

import com.fantasy.domain.fantasyTeam.Exceptions.*;
import com.fantasy.domain.player.*;

import com.fantasy.domain.intefaces.Draftable;


import java.util.*;
import java.util.stream.Collectors;

public class Squad implements Draftable {
    private PlayerRegistry allPlayers;
    private Map<PlayerPosition, List<Player>> startingLineup;
    private Map<String, Player> bench;
    private Player captain;
    private Player viceCaptain;
    private Player firstPick;
    private Player IR = null;
    private final Map<PlayerPosition, Integer> minPlayersInPosition = new HashMap<>();
    private final Map<PlayerPosition, Integer> maxPlayersInPosition = new HashMap<>();

    public Squad() {
        setAllPlayers(new PlayerRegistry());
        setStartingLineup(new HashMap<>());
        setBench(new LinkedHashMap<>());
        setMinPlayersInPosition();
        setMaxPlayersInPosition();
    }

    // <editor-fold desc="Getters and Setters">

    public List<Player> getAllPlayers() {
        return allPlayers.getPlayers();
    }

    public void setAllPlayers(PlayerRegistry players) {
        this.allPlayers = players;
    }

    public Map<PlayerPosition , List<Player>> getStartingLineup() {
        return startingLineup;
    }

    public void setStartingLineup(Map<PlayerPosition, List<Player>> startingLineup) {
        this.startingLineup = startingLineup;
    }

    public Map<String, Player> getBench() {
        return bench;
    }

    public void setBench(Map<String, Player> bench) {
        this.bench = bench;
    }

    public Player getCaptain() {
        return this.captain;
    }

    public Player getViceCaptain() {
        return this.viceCaptain;
    }

    public void setCaptain(Player captain) {
        this.captain = captain;
    }

    public void setViceCaptain(Player viceCaptain) {
        this.viceCaptain = viceCaptain;
    }

    public Player getFirstPick() {
        return firstPick;
    }

    public void setFirstPick(Player firstPick) {
        this.firstPick = firstPick;
    }

    public Player getIR() {
        return IR;
    }

    public void setIR(Player IR) {
        this.IR = IR;
    }

    public void setMinPlayersInPosition() {
        this.minPlayersInPosition.put(PlayerPosition.GOALKEEPER, 1);
        this.minPlayersInPosition.put(PlayerPosition.DEFENDER, 3);
        this.minPlayersInPosition.put(PlayerPosition.MIDFIELDER, 2);
        this.minPlayersInPosition.put(PlayerPosition.FORWARD, 1);
    }

    public void setMaxPlayersInPosition() {
        this.maxPlayersInPosition.put(PlayerPosition.GOALKEEPER, 1);
        this.maxPlayersInPosition.put(PlayerPosition.DEFENDER, 5);
        this.maxPlayersInPosition.put(PlayerPosition.MIDFIELDER, 5);
        this.maxPlayersInPosition.put(PlayerPosition.FORWARD, 3);
    }

    public Player getPlayerById(int id) {
        return this.allPlayers.findById(id);
    }
    // </editor-fold>

    public void loadPlayer(Player player) {
        this.allPlayers.add(player);
    }

    @Override
    public String toString() {
        return "Starting 11:\n" + this.startingLineup +
                "\n\n" + "Bench:\n" + this.bench;
    }

    public void makePick(Player player) {
        if (this.allPlayers.getPlayers().size() >= 15)
            throw new MaxPicksUsagesException("Cant make over 15 picks!");
        if (this.allPlayers.findById(player.getId()) != null)
            throw new PlayerAlreadyPickedException("Player already picked in this squad!");
        List<Player> playersByPosition = this.allPlayers.getPlayersByPosition(player.getPosition());
        if (playersByPosition != null && (playersByPosition.size() >= this.maxPlayersInPosition.get(player.getPosition())))
            throw new MaxPositionCapacityException("Cant pick more players from this position: " + player.getPosition());
        this.allPlayers.add(player);
        if (this.allPlayers.getPlayers().size() == 1)
            firstPick = player;
    }

    public void makeTransfer(Player playerIn, Player playerOut) {
        this.allPlayers.transferPlayers(playerIn, playerOut);

        boolean replaced = false;

        List<Player> line = startingLineup.get(playerOut.getPosition());
        if (line != null) {
            int idx = -1;
            for (int i = 0; i < line.size(); i++) {
                if (line.get(i) != null && line.get(i).getId() == playerOut.getId()) {
                    idx = i;
                    break;
                }
            }
            if (idx != -1) {
                line.set(idx, playerIn);
                startingLineup.put(playerOut.getPosition(), line);
                playerIn.setState(PlayerState.STARTING);
                replaced = true;
            }
        }

        if (!replaced) {
            for (Map.Entry<String, Player> e : bench.entrySet()) {
                Player b = e.getValue();
                if (b != null && b.getId() == playerOut.getId()) {
                    bench.put(e.getKey(), playerIn);
                    playerIn.setState(PlayerState.BENCH);
                    replaced = true;
                    break;
                }
            }
        }

        if (!replaced) {
            playerIn.setState(PlayerState.IN_USE);
        }

        if (captain != null && captain.getId() == playerOut.getId()) {
            if (firstPick == null || firstPick.getId() != playerIn.getId()) captain = playerIn; else setDefaultCaptain();
        }

        if (viceCaptain != null && viceCaptain.getId() == playerOut.getId()) {
            if (firstPick == null || firstPick.getId() != playerIn.getId()) viceCaptain = playerIn; else setDefaultViceCaptain();
        }

        if (firstPick != null && firstPick.getId() == playerOut.getId()) firstPick = null;

        playerIn.setOwnerId(playerOut.getOwnerId());
        playerOut.setOwnerId(-1);
        playerOut.setState(PlayerState.NONE);
    }


    public void setDefaultCaptain(){
        for (PlayerPosition pp : startingLineup.keySet()){
            for (Player p : startingLineup.get(pp))
                if (!p.equals(firstPick) && !p.equals(viceCaptain)) {
                    captain = p;
                    return;
                }
        }
    }

    public void setDefaultViceCaptain(){
        for (PlayerPosition pp : startingLineup.keySet()){
            for (Player p : startingLineup.get(pp))
                if (!p.equals(firstPick) && !p.equals(captain)) {
                    viceCaptain = p;
                    return;
                }
        }
    }

    public boolean isPlayersAreTheSamePositions(Player p1, Player p2) {
        return p1.getPosition() == p2.getPosition();
    }

    public boolean isValidFormation(Player lineupPlayer, Player benchPlayer) {
        if (isPlayersAreTheSamePositions(lineupPlayer, benchPlayer))
            return true;
        PlayerPosition lineupPlayerPosition = lineupPlayer.getPosition();
        int minNumOfPlayers = this.minPlayersInPosition.get(lineupPlayerPosition);
        int numOfPlayers = this.startingLineup.get(lineupPlayerPosition).size();
        return numOfPlayers - 1 >= minNumOfPlayers;
    }

    public void switchPlayers(Player lineupPlayer, Player benchPlayer) {
        ensurePlayersInSquad(lineupPlayer, benchPlayer);

        if (!isValidFormation(lineupPlayer, benchPlayer))
            throw new InvalidFormationException("Cannot switch these players --> wrong formation!");

        List<Player> fromList = startingLineup.get(lineupPlayer.getPosition());
        int index = fromList.indexOf(lineupPlayer);
        if (index == -1) {
            return;
        }
        fromList.remove(index);

        startingLineup.get(benchPlayer.getPosition()).add(benchPlayer);

        for (String key : bench.keySet()) {
            if (bench.get(key).equals(benchPlayer)) {
                bench.put(key, lineupPlayer);
                break;
            }
        }

        lineupPlayer.setState(PlayerState.BENCH);
        benchPlayer.setState(PlayerState.STARTING);
    }

    public void assignCaptain(Player captain) {
        ensurePlayersInSquad(captain);
        if (captain.equals(firstPick))
            throw new InvalidCapitanPlayerException("This player cant be a captain because: It was first makePick at this squad");
        setCaptain(captain);
    }

    public void assignViceCaptain(Player viceCaptain) {
        ensurePlayersInSquad(viceCaptain);
        if (viceCaptain.equals(firstPick))
            throw new InvalidCapitanPlayerException("This player cant be a captain because: It was first makePick at this squad");
        setViceCaptain(viceCaptain);
    }

    public void assignIR(Player IR){
        if (this.allPlayers.findById(IR.getId()) == null){
            throw new IRException("This player is not in squad!");
        }

        if (this.IR != null){
            throw new IRException("IR slot already taken!");
        }

        if (!IR.isInjured()){
            throw new IRException("This player is not injured!");
        }

        updateSquadWithoutIR();

        this.IR = IR;
        this.IR.setState(PlayerState.IN_USE);
    }

    private void updateSquadWithoutIR() {

        Player irPlayer = this.IR;

        boolean wasInStarting = false;

        for (PlayerPosition pp : PlayerPosition.values()) {
            if (startingLineup.get(pp).contains(irPlayer)) {
                wasInStarting = true;
                break;
            }
        }

        if (wasInStarting){
            removeIRFromStarting(irPlayer);
        }else
            removeIRFromBench(irPlayer);

        this.allPlayers.removePlayer(irPlayer);
        if (this.captain.equals(irPlayer))
            setDefaultCaptain();

        if (this.viceCaptain.equals(irPlayer))
            setDefaultViceCaptain();
    }

    private void removeIRFromStarting(Player ir){

        if (ir.getPosition().equals(PlayerPosition.GOALKEEPER)){
            List<Player> gk = new ArrayList<>();
            gk.add(bench.get("GK"));
            startingLineup.put(PlayerPosition.GOALKEEPER, gk);
            gk.getFirst().setState(PlayerState.STARTING);
            return;
        }

        if (startingLineup.get(ir.getPosition()).size() == maxPlayersInPosition.get(ir.getPosition())){
            Player sub = bench.get("S1");
            startingLineup.get(sub.getPosition()).add(sub);
            sub.setState(PlayerState.STARTING);
            startingLineup.get(ir.getPosition()).remove(ir);
            bench.put("S1", ir);
        }
        else {
            for (String key : bench.keySet()){
                if (bench.get(key).getPosition().equals(ir.getPosition()))
                    switchPlayers(ir, bench.get(key));
            }
        }

        removeIRFromBench(ir);
    }

    private void removeIRFromBench(Player ir) {
        if (ir.getPosition().equals(PlayerPosition.GOALKEEPER)) {
            bench.put("GK", null);
            return;
        }

        if (bench.get("S3") != null && bench.get("S3").equals(ir)) {
            bench.put("S3", null);
        } else {
            for (String key : new ArrayList<>(bench.keySet())) {
                if (bench.get(key) != null && bench.get(key).equals(ir)) {
                    bench.put(key, bench.get("S3"));
                    bench.put("S3", null);
                    break;
                }
            }
        }
    }

    private void ensurePlayersInSquad(Player... players) {
        for (Player player : players) {
            if (this.allPlayers.findById(player.getId()) == null) {
                throw new CantFindPlayerInSquadException("Player not in the squad!");
            }
        }
    }

    public void replaceIR(Player player){
        if (player.getPosition().equals(PlayerPosition.GOALKEEPER))
            bench.put("GK", player);
        else
            bench.put("S3", player);

        this.allPlayers.add(player);
    }

    public void releaseIR(Player playerOut) {
        if (IR == null) throw new IRException("There is no IR to release");
        ensurePlayersInSquad(playerOut);
        makeTransfer(IR, playerOut);
        IR = null;
    }

    public void signFirstPickCaptain(){
        if (firstPick == null)
            throw new RuntimeException("Squad doesn't have first pick");

        captain = firstPick;
    }

    public void releaseFirstPickCaptain(){
        setDefaultCaptain();
    }

    public boolean validate(boolean firstPickUsed) {
        Map<PlayerPosition, Long> counts = this.startingLineup.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.groupingBy(Player::getPosition, Collectors.counting()));

        for (PlayerPosition pos : PlayerPosition.values()) {
            int min = minPlayersInPosition.getOrDefault(pos, 0);
            int max = maxPlayersInPosition.getOrDefault(pos, Integer.MAX_VALUE);
            long actual = counts.getOrDefault(pos, 0L);

            if (actual < min || actual > max) return false;
        }

        if (this.startingLineup.values().stream().mapToInt(List::size).sum() != 11)
            return false;

        if (this.getCaptain() == null || this.getViceCaptain() == null)
            return false;

        if (this.getCaptain().equals(this.getViceCaptain()))
            return false;

        if (!firstPickUsed && this.getCaptain().equals(firstPick))
            return false;

         return !this.getViceCaptain().equals(firstPick);
    }

    public void autoSub(Map<Integer, Integer> minutesMap){

        boolean viceTurnedCap = false;
        int captainMin = minutesMap.getOrDefault(this.captain.getId(), 0);
        if (captainMin <= 0){
            this.captain = this.viceCaptain;
            this.viceCaptain = null;
            viceTurnedCap = true;
        }

        Player gk = startingLineup.get(PlayerPosition.GOALKEEPER).getFirst();
        Player benchGoalkeeper = bench.get("GK");
        int minutes = minutesMap.getOrDefault(gk.getId(), 0);
        int benchGkMinutes = minutesMap.getOrDefault(benchGoalkeeper.getId(), 0);

        if (minutes == 0 && benchGkMinutes > 0) {
            System.out.println("[AutoAdjust] GK Swap: " + gk.getViewName() + " → " + benchGoalkeeper.getViewName());
            switchPlayers(gk, benchGoalkeeper);
        }

        List<Player> playersOut = new ArrayList<>();

        for (PlayerPosition pp : startingLineup.keySet()) {
            List<Player> currentLineup = new ArrayList<>(startingLineup.get(pp));

            for (Player lineupPlayer : currentLineup) {
                if (lineupPlayer.getPosition() == PlayerPosition.GOALKEEPER) continue;
                minutes = minutesMap.getOrDefault(lineupPlayer.getId(), 0);
                if (minutes > 0) continue;

                if (lineupPlayer.equals(captain) && viceTurnedCap)
                    this.captain = null;

                if (!viceTurnedCap && lineupPlayer.equals(viceCaptain))
                    this.viceCaptain = null;

                for (int i = 1; i < 4; i++) {
                    Player benchPlayer = bench.get("S" + i);
                    int benchMinutes = minutesMap.getOrDefault(benchPlayer.getId(), 0);

                    if (playersOut.contains(benchPlayer)) continue;

                    if (benchMinutes > 0 && isValidFormation(lineupPlayer, benchPlayer)) {
                        System.out.println("[AutoAdjust] Outfield Swap: " + lineupPlayer.getViewName() + " → " + benchPlayer.getViewName());
                        switchPlayers(lineupPlayer, benchPlayer);
                        playersOut.add(lineupPlayer);
                        break;
                    }
                }
            }
        }
    }
}
