package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.IRException;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.user.User;
import com.fantasy.dto.SquadDto;
import com.fantasy.dto.UserChipsDto;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserChipMapper;
import com.fantasy.main.InMemoryData;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ChipsService {

    private final UserService userService;
    private final DomainPersistenceService domainPersistenceService;

    public ChipsService(UserService userService,
                        DomainPersistenceService domainPersistenceService) {
        this.userService = userService;
        this.domainPersistenceService = domainPersistenceService;
    }

    public UserChipsDto getUserChips(int userId) {
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");
        return UserChipMapper.toDto(user);
    }


    @Transactional
    public SquadDto assignIR(int userId, int playerId) {
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        try {
            userService.useChip("IR", user);
        }catch (Exception e){
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        Player player = InMemoryData.getPlayers().getById(playerId);
        if (player == null) throw new RuntimeException("Player not found");

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("User has no next fantasy team");

        try {
            team.setIR(player);
        } catch (IRException e) {
            throw new RuntimeException("Invalid IR assignment: " + e.getMessage());
        }

        domainPersistenceService.saveSquad(userId);
        userService.updateChipsInDb(user, "IR");

        return SquadMapper.toDto(team.getSquad());
    }

    public SquadDto assignFirstPickCaptain(int userId){
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        try {
            userService.useChip("FIRST_PICK_CAPTAIN", user);
        }catch (Exception e){
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("User has no next fantasy team");

        try {
            team.setFirstPickCaptain();
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        domainPersistenceService.saveSquad(userId);
        userService.updateChipsInDb(user, "FIRST_PICK_CAPTAIN");

        return SquadMapper.toDto(team.getSquad());
    }

    public SquadDto releaseIR(int userId, int playerOutId){
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        try {
            userService.deactivateChip("IR", user);
        }catch (Exception e){
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("User has no next fantasy team");

        try {
            team.releaseIR(InMemoryData.getPlayers().getById(playerOutId));
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        domainPersistenceService.savePlayer(playerOutId);
        domainPersistenceService.saveSquad(userId);
        userService.updateChipsInDb(user, "IR");

        return SquadMapper.toDto(team.getSquad());
    }

    public SquadDto releaseFirstPickCaptain(int userId){
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        try {
            userService.deactivateChip("FIRST_PICK_CAPTAIN", user);
        }catch (Exception e){
            throw new RuntimeException("Problem with user chips: " + e.getMessage());
        }

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("User has no next fantasy team");

        try {
            team.releaseFirstPickCaptain();
        } catch (IRException e) {
            throw new RuntimeException("Invalid First Pick Captain assignment: " + e.getMessage());
        }

        domainPersistenceService.saveSquad(userId);
        userService.updateChipsInDb(user, "FIRST_PICK_CAPTAIN");

        return SquadMapper.toDto(team.getSquad());
    }
}
