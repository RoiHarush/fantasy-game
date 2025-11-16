package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.game.GameweekRollover;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.infrastructure.repositories.PlayerGameweekStatsRepository;
import com.fantasy.main.InMemoryData;

import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GameweekManager {

    private final UserRepository userRepository;
    private final UserSquadRepository squadRepository;
    private final GameWeekRepository gameweekRepository;

    private final PlayerGameweekStatsRepository statsRepo;
    private final UserSquadRepository squadRepo;
    private final PointsService pointsService;

    public GameweekManager(UserRepository userRepository,
                           UserSquadRepository squadRepository,
                           GameWeekRepository gameweekRepository,
                           PlayerGameweekStatsRepository statsRepo,
                           UserSquadRepository squadRepo,
                           PointsService pointsService) {
        this.userRepository = userRepository;
        this.squadRepository = squadRepository;
        this.gameweekRepository = gameweekRepository;
        this.statsRepo = statsRepo;
        this.squadRepo = squadRepo;
        this.pointsService = pointsService;

    }

    @Transactional
    public void openNextGameweek(int newGw) {
        var users = userRepository.findAllWithRelations();

        for (UserEntity entity : users) {
            var domainUser = UserMapper.toDomain(
                    entity,
                    entity.getCurrentSquad(),
                    entity.getNextSquad(),
                    InMemoryData.getPlayers()
            );

            GameweekRollover.rolloverToNextGameweek(domainUser, newGw);

            var newNextSquadEntity = SquadMapper.toEntity(
                    domainUser.getNextFantasyTeam().getSquad(),
                    domainUser.getNextFantasyTeam().getGameweek()
            );
            newNextSquadEntity.setUser(entity);
            squadRepository.save(newNextSquadEntity);

            entity.setCurrentSquad(entity.getNextSquad());
            entity.setNextSquad(newNextSquadEntity);

            userRepository.save(entity);

            var memoryUser = InMemoryData.getUsers().findById(entity.getId());
            if (memoryUser != null) {
                memoryUser.setCurrentFantasyTeam(domainUser.getCurrentFantasyTeam());
                memoryUser.setNextFantasyTeam(domainUser.getNextFantasyTeam());
            }
        }

        updateGameweeksStatus(newGw);
    }

    public void processGameweek(int gameweekId) {
        Map<Integer, Integer> minutesMap = statsRepo.findAll().stream()
                .filter(s -> s.getGameweek() == gameweekId)
                .collect(Collectors.toMap(
                        s -> s.getPlayer().getId(),
                        PlayerGameweekStatsEntity::getMinutesPlayed,
                        (a, b) -> b
                ));

        for (User user : InMemoryData.getUsers().getUsers()){
            Squad squad = user.getCurrentFantasyTeam().getSquad();

            squad.autoSub(minutesMap);

            var squadEntity = squadRepo.findByUser_IdAndGameweek(user.getId(), gameweekId)
                    .orElseThrow(() -> new RuntimeException("Squad entity not found for GW " + gameweekId));

            UserSquadEntity updatedEntity = SquadMapper.toEntity(squad, gameweekId);

            squadEntity.setStartingLineup(updatedEntity.getStartingLineup());
            squadEntity.setBenchMap(updatedEntity.getBenchMap());
            squadEntity.setFormation(updatedEntity.getFormation());
            squadEntity.setCaptainId(updatedEntity.getCaptainId());
            squadEntity.setViceCaptainId(updatedEntity.getViceCaptainId());

            squadRepo.save(squadEntity);

            pointsService.calculateAndPersist(user.getId(), gameweekId);
        }
    }

    private void updateGameweeksStatus(int newGw) {
        var nextGw = gameweekRepository.findById(newGw)
                .orElseThrow(() -> new RuntimeException("Next gameweek not found"));
        var prevGw = gameweekRepository.findById(newGw - 1)
                .orElseThrow(() -> new RuntimeException("Previous gameweek not found"));

        prevGw.setStatus("FINISHED");
        nextGw.setStatus("LIVE");

        gameweekRepository.save(prevGw);
        gameweekRepository.save(nextGw);
    }
}
