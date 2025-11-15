package com.fantasy.domain.realWorldData;


import org.springframework.stereotype.Component;

import java.util.*;
@Component
public class TeamRegistry {
    private final Map<Integer, Team> teams = new HashMap<>();

    public void register(Team team) {
        teams.put(team.getId(), team);
    }

    public Team findById(int id) {
        return teams.get(id);
    }

    public List<Team> findAll() {
        return new ArrayList<>(teams.values());
    }

    public void clear() {
        teams.clear();
    }
}

