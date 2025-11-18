package com.fantasy.domain.user;

import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.intefaces.Identifiable;
import com.fantasy.domain.user.Exceptions.InvalidUserDetailsException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UserGameData {

    private final int id;
    private Map<String, Integer> chips = new HashMap<>();
    private Map<String, Boolean> activeChips = new HashMap<>();
    private String fantasyTeamName;
    private FantasyTeam currentFantasyTeam;
    private FantasyTeam nextFantasyTeam;
    private Map<Integer, Integer> pointsByGameweek = new HashMap<>();
    private List<Integer> watchedPlayers = new ArrayList<>();

    public UserGameData(String fantasyTeamName) {
        this.id = 0;
        this.fantasyTeamName = fantasyTeamName;
        initializeDefaultChips();
    }

    public UserGameData(int id, String fantasyTeamName, Map<String, Integer> chips,
                        Map<String, Boolean> activeChips, Map<Integer, Integer> points,
                        List<Integer> watchedPlayers) {
        this.id = id;
        this.fantasyTeamName = fantasyTeamName;
        this.chips = chips;
        this.activeChips = activeChips;
        this.pointsByGameweek = points;
        this.watchedPlayers = watchedPlayers;
    }

    public int getId() { return id; }

    public String getFantasyTeamName() { return fantasyTeamName; }
    public void setFantasyTeamName(String fantasyTeamName) { this.fantasyTeamName = fantasyTeamName; }

    public FantasyTeam getCurrentFantasyTeam() { return currentFantasyTeam; }
    public void setCurrentFantasyTeam(FantasyTeam currentFantasyTeam) { this.currentFantasyTeam = currentFantasyTeam; }

    public FantasyTeam getNextFantasyTeam() { return nextFantasyTeam; }
    public void setNextFantasyTeam(FantasyTeam nextFantasyTeam) { this.nextFantasyTeam = nextFantasyTeam; }

    public Map<Integer, Integer> getPointsByGameweek() { return pointsByGameweek; }
    public void setPointsByGameweek(Map<Integer, Integer> pointsByGameweek) {
        this.pointsByGameweek = pointsByGameweek;
    }

    public void setChips(Map<String, Integer> chips){
        this.chips = chips;
    }

    public int getTotalPoints() {
        int total = 0;
        if (pointsByGameweek != null)
            total += pointsByGameweek.values().stream().mapToInt(Integer::intValue).sum();
        return total;
    }

    public void initializeDefaultChips() {
        chips.put("FIRST_PICK_CAPTAIN", 1);
        chips.put("IR", 2);
        activeChips.put("FIRST_PICK_CAPTAIN", false);
        activeChips.put("IR", false);
    }

    public int getChipCount(String chip) {
        return chips.getOrDefault(chip, 0);
    }

    public void useChip(String chip) {
        int count = getChipCount(chip);
        if (count <= 0)
            throw new RuntimeException("No remaining uses for chip: " + chip);
        if (activeChips.get(chip))
            throw new RuntimeException("This chip currently active: " + chip);
        chips.put(chip, count - 1);
        activeChips.put(chip, true);
    }

    public void deactivateChip(String chip){
        if (!activeChips.get(chip))
            throw new RuntimeException("This chip currently not active: " + chip);

        if (chip.equals("FIRST_PICK_CAPTAIN")){
            int count = getChipCount(chip);
            this.chips.put(chip, count + 1);
        }
        this.activeChips.put(chip, false);
    }

    public void addChip(String chip, int amount) {
        chips.put(chip, getChipCount(chip) + amount);
    }

    public boolean hasChipAvailable(String chip) {
        return getChipCount(chip) > 0;
    }

    public Map<String, Integer> getChips() {
        return chips;
    }

    public Map<String, Boolean> getActiveChips() {
        return activeChips;
    }

    public void setActiveChips(Map<String, Boolean> activeChips) {
        this.activeChips = activeChips;
    }

    public List<Integer> getWatchedPlayers() { return watchedPlayers; }
    public void setWatchedPlayers(List<Integer> watchedPlayers) { this.watchedPlayers = watchedPlayers; }
}
