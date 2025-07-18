package com.fantasy.Simulations.Utils;

import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Player.*;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;

public class TestTeamFactory {

    public static FantasyTeam createSimulatedTeam(String name) {
        FantasyTeam team = new FantasyTeam(name);
        TeamName[] availableTeams = TeamName.values();
        int index = 0;

        // 2 Goalkeepers
        for (int i = 1; i <= 2; i++) {
            team.makePick(new Player("Sim", "GK" + i, PlayerPosition.GOALKEEPER,
                    new Team(availableTeams[index++ % availableTeams.length].name())));
        }

        // 5 Defenders
        for (int i = 1; i <= 5; i++) {
            team.makePick(new Player("Sim", "DEF" + i, PlayerPosition.DEFENDER,
                    new Team(availableTeams[index++ % availableTeams.length].name())));
        }

        // 5 Midfielders
        for (int i = 1; i <= 5; i++) {
            team.makePick(new Player("Sim", "MID" + i, PlayerPosition.MIDFIELDER,
                    new Team(availableTeams[index++ % availableTeams.length].name())));
        }

        // 3 Forwards
        for (int i = 1; i <= 3; i++) {
            team.makePick(new Player("Sim", "FWD" + i, PlayerPosition.FORWARD,
                    new Team(availableTeams[index++ % availableTeams.length].name())));
        }

        return team;
    }
}

