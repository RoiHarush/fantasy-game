package com.fantasy.domain.team;

import java.util.List;
import java.util.Map;

public class SquadDto {
    private Map<String, List<Integer>> startingLineup;
    private Map<String, Integer> bench;
    private Map<String, Integer> formation;
    private Integer captainId;
    private Integer viceCaptainId;
    private Integer irId;
    private Integer firstPickId;
    private boolean tripleCaptainActive;
    private boolean benchBoostActive;
    private List<AutoSubstitutionDto> autoSubstitutions = List.of();

    public Map<String, List<Integer>> getStartingLineup() { return startingLineup; }
    public void setStartingLineup(Map<String, List<Integer>> startingLineup) { this.startingLineup = startingLineup; }

    public Map<String, Integer> getBench() { return bench; }
    public void setBench(Map<String, Integer> bench) { this.bench = bench; }

    public Map<String, Integer> getFormation() { return formation; }
    public void setFormation(Map<String, Integer> formation) { this.formation = formation; }

    public Integer getCaptainId() { return captainId; }
    public void setCaptainId(Integer captainId) { this.captainId = captainId; }

    public Integer getViceCaptainId() { return viceCaptainId; }
    public void setViceCaptainId(Integer viceCaptainId) { this.viceCaptainId = viceCaptainId; }

    public Integer getIrId() {
        return irId;
    }
    public void setIrId(Integer irId) {
        this.irId = irId;
    }

    public Integer getFirstPickId() {
        return firstPickId;
    }
    public void setFirstPickId(Integer firstPickId) {
        this.firstPickId = firstPickId;
    }

    public boolean isTripleCaptainActive() { return tripleCaptainActive; }
    public void setTripleCaptainActive(boolean tripleCaptainActive) {
        this.tripleCaptainActive = tripleCaptainActive;
    }

    public boolean isBenchBoostActive() { return benchBoostActive; }
    public void setBenchBoostActive(boolean benchBoostActive) {
        this.benchBoostActive = benchBoostActive;
    }

    public List<AutoSubstitutionDto> getAutoSubstitutions() { return autoSubstitutions; }
    public void setAutoSubstitutions(List<AutoSubstitutionDto> autoSubstitutions) {
        this.autoSubstitutions = autoSubstitutions == null ? List.of() : List.copyOf(autoSubstitutions);
    }
}

