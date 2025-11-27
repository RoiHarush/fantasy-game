package com.fantasy.application;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.dto.PlayerMatchStatsDto;
import com.fantasy.infrastructure.mappers.PlayerMatchStatsMapper;
import com.fantasy.infrastructure.repositories.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
public class PlayerMatchStatsService {

    private final PlayerGameweekStatsRepository statsRepo;
    private final TeamRepository teamRepo;
    private final FixtureRepository fixtureRepo;
    private final UserSquadRepository userSquadRepo;
    private final PlayerRegistry playerRegistry;

    public PlayerMatchStatsService(PlayerGameweekStatsRepository statsRepo,
                                   TeamRepository teamRepo,
                                   FixtureRepository fixtureRepo,
                                   UserSquadRepository userSquadRepo,
                                   PlayerRegistry playerRegistry) {
        this.statsRepo = statsRepo;
        this.teamRepo = teamRepo;
        this.fixtureRepo = fixtureRepo;
        this.userSquadRepo = userSquadRepo;
        this.playerRegistry = playerRegistry;
    }

    public List<PlayerMatchStatsDto> getAllMatchStats(int playerId) {
        Player player = playerRegistry.findById(playerId);
        if (player == null)
            throw new RuntimeException("Player not found: " + playerId);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Player's team not found for teamId: " + player.getTeamId()));

        var allStats = statsRepo.findByPlayer_Id(playerId);

        List<PlayerMatchStatsDto> results = new ArrayList<>();

        for (var e : allStats) {
            var opponent = teamRepo.findById(e.getOpponentTeamId()).orElse(null);

            var homeTeam = e.isWasHome() ? playerTeam : opponent;
            var awayTeam = e.isWasHome() ? opponent : playerTeam;

            Integer homeScore = null;
            Integer awayScore = null;
            var fixtureOpt = fixtureRepo.findByHomeTeamIdAndAwayTeamIdAndGameweekId(
                    homeTeam != null ? homeTeam.getId() : -1,
                    awayTeam != null ? awayTeam.getId() : -1,
                    e.getGameweek()
            );

            if (fixtureOpt.isPresent()) {
                var fixture = fixtureOpt.get();
                homeScore = fixture.getHomeTeamScore();
                awayScore = fixture.getAwayTeamScore();
            }

            var dto = PlayerMatchStatsMapper.toDto(player, e, homeTeam, awayTeam, homeScore, awayScore, false);
            results.add(dto);
        }

        return results;
    }


    public PlayerMatchStatsDto getMatchStats(int playerId, int gw, Integer userId) {
        Player player = playerRegistry.findById(playerId);
        if (player == null)
            throw new RuntimeException("Player not found: " + playerId);

        var statsOpt = statsRepo.findByPlayer_IdAndGameweek(playerId, gw);

        var playerTeam = teamRepo.findById(player.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found for player " + playerId));

        TeamEntity opponent = null;
        boolean wasHome = true;

        if (statsOpt.isPresent()) {
            var e = statsOpt.get();
            opponent = teamRepo.findById(e.getOpponentTeamId()).orElse(null);
            wasHome = e.isWasHome();
        } else {
            var fixtureOpt = fixtureRepo.findByGameweekAndTeam(gw, player.getTeamId());
            if (fixtureOpt.isPresent()) {
                var f = fixtureOpt.get();
                if (f.getHomeTeamId() == player.getTeamId()) {
                    opponent = teamRepo.findById(f.getAwayTeamId()).orElse(null);
                    wasHome = true;
                } else {
                    opponent = teamRepo.findById(f.getHomeTeamId()).orElse(null);
                    wasHome = false;
                }
            }
        }

        var homeTeam = wasHome ? playerTeam : opponent;
        var awayTeam = wasHome ? opponent : playerTeam;

        Integer homeScore = null;
        Integer awayScore = null;

        var fixtureOpt = fixtureRepo.findByHomeTeamIdAndAwayTeamIdAndGameweekId(
                homeTeam != null ? homeTeam.getId() : -1,
                awayTeam != null ? awayTeam.getId() : -1,
                gw
        );

        if (fixtureOpt.isPresent()) {
            var fixture = fixtureOpt.get();
            homeScore = fixture.getHomeTeamScore();
            awayScore = fixture.getAwayTeamScore();
        }

        boolean isCaptain = false;
        if (userId != null) {
            var squadOpt = userSquadRepo.findByUser_IdAndGameweek(userId, gw);

            if (squadOpt.isPresent()) {
                Integer captainId = squadOpt.get().getCaptainId();
                if (captainId != null && captainId == playerId) {
                    isCaptain = true;
                }
            }
        }

        if (statsOpt.isEmpty()) {
            return PlayerMatchStatsDto.empty(player, homeTeam, awayTeam, homeScore, awayScore);
        }

        return PlayerMatchStatsMapper.toDto(
                player, statsOpt.get(), homeTeam, awayTeam, homeScore, awayScore, isCaptain
        );
    }
}