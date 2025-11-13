package com.fantasy.infrastructure.mappers;

import com.fantasy.domain.player.*;
import com.fantasy.dto.SquadDto;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.user.UserSquadEntity;

import java.util.*;
import java.util.stream.Collectors;

public class SquadMapper {

    public static Squad toDomain(UserSquadEntity e, PlayerRegistry allPlayers) {
        Squad squad = new Squad();

        Map<PlayerPosition, List<Player>> starting = new HashMap<>();
        starting.put(PlayerPosition.GOALKEEPER, new ArrayList<>());
        starting.put(PlayerPosition.DEFENDER, new ArrayList<>());
        starting.put(PlayerPosition.MIDFIELDER, new ArrayList<>());
        starting.put(PlayerPosition.FORWARD, new ArrayList<>());

        for (int i = 0; i < e.getStartingLineup().size(); i++){
            Player player =  allPlayers.getById(e.getStartingLineup().get(i));
            List<Player> lst = starting.get(player.getPosition());
            lst.add(player);
            starting.put(player.getPosition(), lst);
            squad.loadPlayer(player);
        }
        squad.setStartingLineup(starting);

        Map<String, Player> bench = new LinkedHashMap<>();

        for (String key : e.getBenchMap().keySet()) {
            Integer playerId = e.getBenchMap().get(key);
            Player player = playerId != null ? allPlayers.getById(playerId) : null;
            bench.put(key, player);
            if (player != null)
                squad.loadPlayer(player);
        }
        squad.setBench(bench);

        // --- Captain & ViceCaptain ---
        if (e.getCaptainId() != null) {
            squad.setCaptain(allPlayers.getById(e.getCaptainId()));
        }

        if (e.getViceCaptainId() != null) {
            squad.setViceCaptain(allPlayers.getById(e.getViceCaptainId()));
        }

        // --- First Pick & IR ---
        if (e.getFirstPickId() != null)
            squad.setFirstPick(allPlayers.getById(e.getFirstPickId()));

        if (e.getIrId() != null)
            squad.setIR(allPlayers.getById(e.getIrId()));


        return squad;
    }

    // === Domain -> Entity ===
    public static UserSquadEntity toEntity(Squad squad, int gw) {
        UserSquadEntity e = new UserSquadEntity();
        e.setGameweek(gw);

        e.setStartingLineup(
                squad.getStartingLineup().values().stream()
                        .flatMap(List::stream)
                        .map(Player::getId)
                        .collect(Collectors.toList())
        );


        // --- Bench Map (Safe Handling, No forced null slots) ---
        Map<String, Integer> benchMap = new LinkedHashMap<>();
        squad.getBench().forEach((slot, player) -> {
            if (player != null) {
                benchMap.put(slot, player.getId());
            }
        });
        e.setBenchMap(benchMap);


        Map<String, Integer> formation = calcFormation(squad);
        e.setFormation(formation);

        // --- Captain & ViceCaptain ---
        if (squad.getCaptain() != null)
            e.setCaptainId(squad.getCaptain().getId());

        if (squad.getViceCaptain() != null)
            e.setViceCaptainId(squad.getViceCaptain().getId());

        e.setFirstPickId(squad.getFirstPick() != null ? squad.getFirstPick().getId() : null);
        e.setIrId(squad.getIR() != null ? squad.getIR().getId() : null);

        return e;
    }

    // === Domain -> DTO ===
    public static SquadDto toDto(Squad squad) {
        SquadDto dto = new SquadDto();

        Map<String, List<Integer>> starting = new HashMap<>();
        starting.put("GK", new ArrayList<>());
        starting.put("DEF", new ArrayList<>());
        starting.put("MID", new ArrayList<>());
        starting.put("FWD", new ArrayList<>());

        for (PlayerPosition pp : squad.getStartingLineup().keySet()) {
            for (Player player : squad.getStartingLineup().get(pp)) {
                switch (pp) {
                    case GOALKEEPER -> starting.get("GK").add(player.getId());
                    case DEFENDER -> starting.get("DEF").add(player.getId());
                    case MIDFIELDER -> starting.get("MID").add(player.getId());
                    case FORWARD -> starting.get("FWD").add(player.getId());
                }
            }
        }

        dto.setStartingLineup(starting);

        // --- Bench Map (No null values, reflect domain exactly) ---
        Map<String, Integer> benchMap = new LinkedHashMap<>();
        squad.getBench().forEach((slot, player) -> {
            if (player != null) {
                benchMap.put(slot, player.getId());
            }
        });
        dto.setBench(benchMap);


        Map<String, Integer> formation = calcFormation(squad);
        dto.setFormation(formation);

        if (squad.getCaptain() != null)
            dto.setCaptainId(squad.getCaptain().getId());

        if (squad.getViceCaptain() != null)
            dto.setViceCaptainId(squad.getViceCaptain().getId());

        dto.setFirstPickId(squad.getFirstPick() != null ? squad.getFirstPick().getId() : null);
        dto.setIrId(squad.getIR() != null ? squad.getIR().getId() : null);


        return dto;
    }

    public static SquadDto toDto(
            Map<String, List<Integer>> startingLineup,
            Map<String, Integer> bench,
            Map<String, Integer> formation,
            Integer captainId,
            Integer viceCaptainId,
            Integer IR,
            Integer firstPickId
    ) {
        SquadDto dto = new SquadDto();
        dto.setStartingLineup(startingLineup);
        dto.setBench(bench);
        dto.setFormation(formation);
        dto.setCaptainId(captainId);
        dto.setViceCaptainId(viceCaptainId);
        dto.setIrId(IR);
        dto.setFirstPickId(firstPickId);
        return dto;
    }


    // === DTO -> Domain ===
    public static Squad fromDto(SquadDto dto, PlayerRegistry allPlayers) {
        Squad squad = new Squad();

        Map<PlayerPosition, List<Player>> starting = new HashMap<>();
        starting.put(PlayerPosition.GOALKEEPER, new ArrayList<>());
        starting.put(PlayerPosition.DEFENDER, new ArrayList<>());
        starting.put(PlayerPosition.MIDFIELDER, new ArrayList<>());
        starting.put(PlayerPosition.FORWARD, new ArrayList<>());

        for (String key : dto.getStartingLineup().keySet()){
            for (Integer playerId : dto.getStartingLineup().get(key)){
                switch (key){
                    case "GK" -> starting.get(PlayerPosition.GOALKEEPER).add(allPlayers.getById(playerId));
                    case "DEF" -> starting.get(PlayerPosition.DEFENDER).add(allPlayers.getById(playerId));
                    case "MID" -> starting.get(PlayerPosition.MIDFIELDER).add(allPlayers.getById(playerId));
                    case "FWD" ->  starting.get(PlayerPosition.FORWARD).add(allPlayers.getById(playerId));
                }
                squad.loadPlayer(allPlayers.getById(playerId));
            }
        }
        squad.setStartingLineup(starting);

        // --- Bench ---
        Map<String, Player> bench = new LinkedHashMap<>();
        dto.getBench().forEach((slot, playerId) -> {
            Player player = playerId != null ? allPlayers.getById(playerId) : null;
            bench.put(slot, player);
            if (player != null) squad.loadPlayer(player);
        });
        squad.setBench(bench);

        squad.setCaptain(allPlayers.getById(dto.getCaptainId()));
        squad.setViceCaptain(allPlayers.getById(dto.getViceCaptainId()));

        if (dto.getFirstPickId() != null)
            squad.setFirstPick(allPlayers.getById(dto.getFirstPickId()));

        if (dto.getIrId() != null)
            squad.setIR(allPlayers.getById(dto.getIrId()));

        return squad;
    }

    public static Map<String, Integer> calcFormation(Squad squad){
        Map<String, Integer> formation = new LinkedHashMap<>();
        formation.put("GK", squad.getStartingLineup().get(PlayerPosition.GOALKEEPER).size());
        formation.put("DEF", squad.getStartingLineup().get(PlayerPosition.DEFENDER).size());
        formation.put("MID", squad.getStartingLineup().get(PlayerPosition.MIDFIELDER).size());
        formation.put("FWD", squad.getStartingLineup().get(PlayerPosition.FORWARD).size());

        return formation;
    }
}
