package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.domain.fantasyTeam.FantasyTeam;
import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.dto.SquadDto;
import com.fantasy.main.InMemoryData;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
public class PickTeamService {

    private final UserRepository userRepo;
    private final UserSquadRepository userSquadRepo;
    private final DomainPersistenceService domainPersistenceService;
    private final GameWeekService gameWeekService;

    public PickTeamService(UserRepository userRepo,
                           UserSquadRepository userSquadRepo,
                           DomainPersistenceService domainPersistenceService,
                           GameWeekService gameWeekService) {
        this.userRepo = userRepo;
        this.userSquadRepo = userSquadRepo;
        this.domainPersistenceService = domainPersistenceService;
        this.gameWeekService = gameWeekService;
    }

    @Transactional
    public SquadDto saveTeam(int userId, SquadDto dto) {
        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        FantasyTeam team = user.getNextFantasyTeam();
        if (team == null) throw new RuntimeException("User has no next fantasy team");

        Squad squad = SquadMapper.fromDto(dto, InMemoryData.getPlayers());
        try {
            team.saveSquad(squad, user.getActiveChips().get("FIRST_PICK_CAPTAIN"));
        }catch (FantasyTeamException e){
            System.out.println(e.getMessage());
            throw e;
        }

        domainPersistenceService.saveSquad(userId);

        return SquadMapper.toDto(squad);
    }

    @Transactional
    public void saveTeamForPrevGameweek(int userId, SquadDto dto, int gw){
        if (gw == gameWeekService.getCurrentGameweek().getId() || gw == gameWeekService.getNextGameweek().getId())
            throw new RuntimeException("Not a prev game-week");

        UserEntity userEntity = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserSquadEntity squad = userSquadRepo.findByUser_IdAndGameweek(userId, gw)
                .orElse(new UserSquadEntity());

        squad.setUser(userEntity);
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
