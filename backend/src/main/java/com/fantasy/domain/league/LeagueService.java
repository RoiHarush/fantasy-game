package com.fantasy.domain.league;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserPointsEntity;
import com.fantasy.domain.user.UserSummaryDto;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeagueService {

    private final LeagueRepository leagueRepo;
    private final UserGameDataRepository gameDataRepo;
    private final UserPointsRepository userPointsRepo;
    private final GameWeekService gameWeekService;

    public LeagueService(LeagueRepository leagueRepo,
                         UserGameDataRepository gameDataRepo,
                         UserPointsRepository userPointsRepo,
                         GameWeekService gameWeekService) {
        this.leagueRepo = leagueRepo;
        this.gameDataRepo = gameDataRepo;
        this.userPointsRepo = userPointsRepo;
        this.gameWeekService = gameWeekService;
    }

    @Transactional(readOnly = true)
    public LeagueDto getLiveLeagueDto() {

        LeagueEntity league = leagueRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No league found in database"));

        List<UserEntity> usersInLeague = league.getUsers();

        Map<Integer, UserGameDataEntity> gameDataMap = gameDataRepo.findAll().stream()
                .collect(Collectors.toMap(gd -> gd.getUser().getId(), gd -> gd));

        int currentGwId = gameWeekService.getCurrentGameweek().getId();

        Map<Integer, Integer> gwPointsMap = userPointsRepo.findByGameweek(currentGwId).stream()
                .collect(Collectors.toMap(
                        upe -> upe.getUser().getId(),
                        UserPointsEntity::getPoints
                ));

        List<UserEntity> sortedUsers = usersInLeague.stream()
                .sorted(Comparator.comparingInt((UserEntity user) -> {
                    UserGameDataEntity gd = gameDataMap.get(user.getId());
                    return (gd != null) ? gd.getTotalPoints() : 0;
                }).reversed())
                .toList();

        List<UserSummaryDto> summaries = new ArrayList<>();
        for (int i = 0; i < sortedUsers.size(); i++) {
            UserEntity user = sortedUsers.get(i);
            int rank = i + 1;

            UserGameDataEntity gameData = gameDataMap.get(user.getId());

            int totalPoints = (gameData != null) ? gameData.getTotalPoints() : 0;
            String teamName = (gameData != null) ? gameData.getFantasyTeamName() : "N/A";
            int gwPoints = (gameData != null) ? gwPointsMap.getOrDefault(gameData.getId(), 0) : 0;

            summaries.add(new UserSummaryDto(
                    user.getId(),
                    user.getName(),
                    teamName,
                    totalPoints,
                    gwPoints,
                    rank
            ));
        }

        return new LeagueDto(league.getName(), summaries);
    }
}
