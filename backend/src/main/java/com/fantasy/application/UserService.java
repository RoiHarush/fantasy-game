package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.IrStatusDto;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserDto;
import com.fantasy.main.InMemoryData;
import com.fantasy.api.WatchlistSocketController;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final UserSquadRepository userSquadRepo;
    private final GameWeekService gameWeekService;
    private final WatchlistSocketController watchlistSocketController;

    public UserService(UserRepository userRepo,
                       UserSquadRepository userSquadRepo,
                       GameWeekService gameWeekService,
                       WatchlistSocketController watchlistSocketController) {
        this.userSquadRepo = userSquadRepo;
        this.gameWeekService = gameWeekService;
        this.userRepo = userRepo;
        this.watchlistSocketController = watchlistSocketController;
    }

    public List<UserDto> getAllUsers() {
        return InMemoryData.getUsers().getUsers().stream()
                .map(UserMapper::toDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(int id) {
        User user = InMemoryData.getUsers().findById(id);
        if (user == null)
            throw new RuntimeException("User not found");

        return UserMapper.toDto(user);
    }

    public SquadDto getSquadForGameweek(int userId, Integer gw) {
        int currentGw = gameWeekService.getCurrentGameweek().getId();
        int nextGw = gameWeekService.getNextGameweek().getId();
        int effectiveGw = gw != null ? gw : currentGw;

        if (effectiveGw < currentGw) {
            return userSquadRepo.findByUser_IdAndGameweek(userId, effectiveGw)
                    .map(entity -> {
                        Squad squad = SquadMapper.toDomain(entity, InMemoryData.getPlayers());
                        return SquadMapper.toDto(squad);
                    })
                    .orElse(null);
        }


        User user = InMemoryData.getUsers().findById(userId);
        if (user == null) return null;

        Squad squad;
        if (effectiveGw == currentGw) {
            squad = user.getCurrentFantasyTeam().getSquad();
        } else if (effectiveGw == nextGw) {
            squad = user.getNextFantasyTeam().getSquad();
        } else {
            return null;
        }

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void useChip(String chip, User user) {
        if (user.getChips().get(chip) == null)
            throw new RuntimeException("User has no chip such as: " + chip);

        if (!user.hasChipAvailable(chip))
            throw new RuntimeException("User has used all his amount of: " + chip);

        user.useChip(chip);
    }

    @Transactional
    public void deactivateChip(String chip, User user){
        if (user.getChips().get(chip) == null)
            throw new RuntimeException("User has no chip such as: " + chip);

        user.deactivateChip(chip);
    }

    public void updateChipsInDb(User user, String chip) {
        UserEntity userEntity = userRepo.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User entity not found"));

        if (!user.getChips().containsKey(chip))
            throw new RuntimeException("Chip not found in DB for user: " + chip);

        userEntity.setChips(user.getChips());
        userEntity.setActiveChips(user.getActiveChips());

        userRepo.save(userEntity);
    }

    public List<IrStatusDto> getIrStatuses() {
        return InMemoryData.getUsers().getUsers().stream()
                .map(user -> {
                    var squad = user.getNextFantasyTeam() != null ? user.getNextFantasyTeam().getSquad() : null;
                    var ir = squad != null ? squad.getIR() : null;

                    return new IrStatusDto(
                            user.getId(),
                            user.getName(),
                            user.getFantasyTeamName(),
                            ir != null,
                            ir != null ? ir.getViewName() : null
                    );
                })
                .collect(Collectors.toList());
    }

    public void addToWatchlist(int userId, int playerId) {
        User domainUser = InMemoryData.getUsers().findById(userId);
        var userEntity = userRepo.findById(userId).orElseThrow();

        if (!domainUser.getWatchedPlayers().contains(playerId)) {
            domainUser.getWatchedPlayers().add(playerId);
            userEntity.setWatchedPlayers(new ArrayList<>(domainUser.getWatchedPlayers()));
            userRepo.save(userEntity);

            watchlistSocketController.sendWatchlistUpdate(userId, domainUser.getWatchedPlayers());
        }

    }

    public void removeFromWatchlist(int userId, int playerId) {
        User domainUser = InMemoryData.getUsers().findById(userId);
        var userEntity = userRepo.findById(userId).orElseThrow();

        domainUser.getWatchedPlayers().remove(Integer.valueOf(playerId));
        userEntity.setWatchedPlayers(new ArrayList<>(domainUser.getWatchedPlayers()));
        userRepo.save(userEntity);

        watchlistSocketController.sendWatchlistUpdate(userId, domainUser.getWatchedPlayers());
    }

    public List<Integer> getWatchlist(int userId) {
        return new ArrayList<>(InMemoryData.getUsers().findById(userId).getWatchedPlayers());
    }

}