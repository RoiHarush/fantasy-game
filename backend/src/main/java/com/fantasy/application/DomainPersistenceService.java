package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import com.fantasy.main.InMemoryData;
import org.springframework.stereotype.Service;

@Service
public class DomainPersistenceService {

    private final UserRepository userRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekRepository gameWeekRepo;
    private final PlayerRepository playerRepo;
    private final GameWeekService gameWeekService;

    public DomainPersistenceService(UserRepository userRepo,
                                    UserSquadRepository userSquadRepo,
                                    GameWeekRepository gameWeekRepo,
                                    PlayerRepository playerRepo,
                                    GameWeekService gameWeekService) {
        this.userRepo = userRepo;
        this.userSquadRepo = userSquadRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.playerRepo = playerRepo;
        this.gameWeekService = gameWeekService;
    }

    public void saveSquad(int userId) {
        int nextGw = gameWeekService.getNextGameweek().getId();

        UserEntity userEntity = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User entity not found"));

        UserSquadEntity nextSquadEntity = userEntity.getNextSquad();
        if (nextSquadEntity == null || nextSquadEntity.getGameweek() != nextGw)
            throw new RuntimeException("Next squad not found for gameweek " + nextGw);

        User userDomain = InMemoryData.getUsers().findById(userId);
        FantasyTeam team = userDomain.getNextFantasyTeam();

        UserSquadEntity updatedEntity = SquadMapper.toEntity(team.getSquad(), nextGw);
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(userEntity);

        userSquadRepo.save(updatedEntity);
    }

    public void savePlayer(int playerId) {
        PlayerEntity playerEntity = playerRepo.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player entity not found"));

        Player playerDomain = InMemoryData.getPlayers().findById(playerId);

        playerEntity.setOwnerId(playerDomain.getOwnerId());
        playerEntity.setState(playerDomain.getState());

        playerRepo.save(playerEntity);
    }
}

