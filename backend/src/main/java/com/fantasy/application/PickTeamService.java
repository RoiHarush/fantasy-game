package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.UserGameData;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.dto.SquadDto;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class PickTeamService {

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final PlayerRegistry playerRegistry;
    private final PlayerRepository playerRepo;


    public PickTeamService(UserGameDataRepository gameDataRepo,
                           UserSquadRepository userSquadRepo,
                           GameWeekService gameWeekService,
                           PlayerRegistry playerRegistry,
                           PlayerRepository playerRepo) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.playerRegistry = playerRegistry;
        this.playerRepo = playerRepo;
    }

    @Transactional
    public SquadDto saveTeam(int userId, SquadDto dto) {

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Squad squad = SquadMapper.fromDto(dto, playerRegistry);

        try {
            team.saveSquad(squad, user.getActiveChips().get("FIRST_PICK_CAPTAIN"));
        } catch (FantasyTeamException e) {
            System.out.println(e.getMessage());
            throw e;
        }

        List<PlayerEntity> playersToUpdate = new ArrayList<>();

        List<Player> allSquadPlayers = new ArrayList<>();
        squad.getStartingLineup().values().forEach(allSquadPlayers::addAll);
        squad.getBench().values().forEach(allSquadPlayers::add);

        for (Player p : allSquadPlayers) {
            if (p != null) {
                PlayerEntity pEntity = playerRepo.findById(p.getId()).orElse(null);
                if (pEntity != null) {
                    pEntity.setState(p.getState());
                    playersToUpdate.add(pEntity);
                }
            }
        }

        playerRepo.saveAll(playersToUpdate);

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) {
            throw new RuntimeException("Next squad entity not found");
        }

        UserSquadEntity updatedEntity = SquadMapper.toEntity(
                squad,
                team.getGameweek()
        );

        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);

        userSquadRepo.save(updatedEntity);

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void saveTeamForPrevGameweek(int userId, SquadDto dto, int gw) {
        if (gw == gameWeekService.getCurrentGameweek().getId() || gw == gameWeekService.getNextGameweek().getId())
            throw new RuntimeException("Not a prev game-week");

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData not found"));

        UserSquadEntity squad = userSquadRepo.findByUser_IdAndGameweek(userId, gw)
                .orElse(new UserSquadEntity());

        squad.setUser(gameDataEntity);
        squad.setGameweek(gw);

        squad.setStartingLineup(dto.getStartingLineup().values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList()));
        squad.setBenchMap(dto.getBench());
        squad.setFormation(dto.getFormation());
        squad.setCaptainId(dto.getCaptainId());
        squad.setViceCaptainId(dto.getViceCaptainId());
        squad.setIrId(dto.getIrId());
        squad.setFirstPickId(dto.getFirstPickId());

        userSquadRepo.save(squad);
    }
}