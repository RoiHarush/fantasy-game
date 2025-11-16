package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.dto.TransferRequestDto;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.main.InMemoryData;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserSquadEntity;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransferService {
    private static final Logger log = LoggerFactory.getLogger(TransferService.class);

    private final PlayerRepository playerRepo;
    private final GameWeekService gameWeekService;
    private final UserSquadRepository squadRepo;

    public TransferService(PlayerRepository playerRepo,
                           GameWeekService gameWeekService,
                           UserSquadRepository squadRepo) {
        this.playerRepo = playerRepo;
        this.gameWeekService = gameWeekService;
        this.squadRepo = squadRepo;
    }

    @Transactional
    public void makeTransfer(TransferRequestDto request) {
        try {
            User user = InMemoryData.getUsers().findById(request.getUserId());
            if (user == null) throw new RuntimeException("User not found");
            System.out.println(user);

            FantasyTeam team = user.getNextFantasyTeam();
            if (team == null) throw new RuntimeException("User has no next fantasy team");
            System.out.println(team);

            Player playerOut = InMemoryData.getPlayers().findById(request.getPlayerOutId());
            Player playerIn = InMemoryData.getPlayers().findById(request.getPlayerInId());

            try {
                team.makeTransfer(playerIn, playerOut);
            } catch (FantasyTeamException e) {
                log.warn("Transfer failed for user {}: {}", user.getName(), e.getMessage());
                throw e;
            }

            System.out.println(playerOut.getViewName() + ": Owner: " + playerOut.getOwnerId() + "|| State: " + playerOut.getState());
            System.out.println(playerIn.getViewName() + ": Owner: " + playerIn.getOwnerId() + "|| State: " + playerIn.getState());


            updatePlayerInDb(playerIn);
            updatePlayerInDb(playerOut);


            int nextGw = gameWeekService.getNextGameweek().getId();

            UserSquadEntity nextSquadEntity = squadRepo.findByUser_IdAndGameweek(user.getId(), nextGw)
                    .orElseThrow(() -> new RuntimeException("Squad for next game-week doesn't exist!"));

            List<Integer> newStartingLineup = team.getSquad().getStartingLineup().values().stream()
                    .flatMap(List::stream)
                    .map(Player::getId)
                    .collect(Collectors.toCollection(ArrayList::new));
            nextSquadEntity.setStartingLineup(newStartingLineup);

            Map<String, Integer> benchMap = team.getSquad().getBench().entrySet().stream()
                    .filter(e -> e.getValue() != null)
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue().getId(),
                            (a, b) -> a,
                            LinkedHashMap::new
                    ));
            nextSquadEntity.setBenchMap(new LinkedHashMap<>(benchMap));

            Map<String, Integer> formation = new LinkedHashMap<>();
            formation.put("GK", team.getSquad().getStartingLineup().get(PlayerPosition.GOALKEEPER).size());
            formation.put("DEF", team.getSquad().getStartingLineup().get(PlayerPosition.DEFENDER).size());
            formation.put("MID", team.getSquad().getStartingLineup().get(PlayerPosition.MIDFIELDER).size());
            formation.put("FWD", team.getSquad().getStartingLineup().get(PlayerPosition.FORWARD).size());
            nextSquadEntity.setFormation(new LinkedHashMap<>(formation));

            nextSquadEntity.setCaptainId(team.getSquad().getCaptain().getId());
            nextSquadEntity.setViceCaptainId(team.getSquad().getViceCaptain().getId());

            squadRepo.save(nextSquadEntity);

            log.info("User {} completed transfer: {} -> {} for GW {}",
                    user.getName(), playerOut.getViewName(), playerIn.getViewName(), nextGw);
        }catch (Exception e) {
            throw e;
        }
    }


    private void updatePlayerInDb(Player player) {
        PlayerEntity entity = playerRepo.findById(player.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        entity.setOwnerId(player.getOwnerId());
        entity.setState(player.getState());

        playerRepo.save(entity);

        System.out.println("💾 Updated player in DB: " + entity.getViewName() +
                " | Owner=" + entity.getOwnerId() +
                " | State=" + entity.getState());
    }
}


