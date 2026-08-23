package com.fantasy.domain.user.admin;

import com.fantasy.domain.ai.AiRoastDto;
import com.fantasy.domain.ai.AiRoastService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.player.PlayerDataDto;
import com.fantasy.domain.player.PlayerDto;
import com.fantasy.domain.player.CrownSummaryDto;
import com.fantasy.domain.player.PlayerService;
import com.fantasy.domain.score.PointsService;
import com.fantasy.domain.team.FantasyTeamService;
import com.fantasy.domain.team.SquadDto;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.transfer.DraftConfig;
import com.fantasy.domain.transfer.DraftService;
import com.fantasy.domain.transfer.TransferActionDto;
import com.fantasy.domain.transfer.TransferMarketService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/observe")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
public class SuperAdminObserverController {
    private final LeagueRepository leagueRepository;
    private final UserGameDataRepository gameDataRepository;
    private final FantasyTeamService fantasyTeamService;
    private final TransferMarketService transferMarketService;
    private final DraftService draftService;
    private final PlayerService playerService;
    private final PointsService pointsService;
    private final AiRoastService aiRoastService;

    public SuperAdminObserverController(LeagueRepository leagueRepository,
                                        UserGameDataRepository gameDataRepository,
                                        FantasyTeamService fantasyTeamService,
                                        TransferMarketService transferMarketService,
                                        DraftService draftService,
                                        PlayerService playerService,
                                        PointsService pointsService,
                                        AiRoastService aiRoastService) {
        this.leagueRepository = leagueRepository;
        this.gameDataRepository = gameDataRepository;
        this.fantasyTeamService = fantasyTeamService;
        this.transferMarketService = transferMarketService;
        this.draftService = draftService;
        this.playerService = playerService;
        this.pointsService = pointsService;
        this.aiRoastService = aiRoastService;
    }

    @GetMapping("/leagues/{leagueId}")
    public ObservedLeague league(@PathVariable long leagueId) {
        LeagueEntity league = requireLeague(leagueId);
        Map<Integer, UserGameDataEntity> dataByUser = gameDataRepository.findByLeague_Id(leagueId).stream()
                .filter(data -> data.getUser() != null)
                .collect(java.util.stream.Collectors.toMap(data -> data.getUser().getId(), data -> data));
        List<ObservedManager> managers = league.getUsers().stream()
                .map(user -> {
                    UserGameDataEntity data = dataByUser.get(user.getId());
                    return new ObservedManager(
                            user.getId(),
                            user.getFullName(),
                            user.getFirstName(),
                            user.getLastName(),
                            user.getUsername(),
                            user.getEmail(),
                            user.isEmailVerified(),
                            data == null ? user.getName() : data.getFantasyTeamName(),
                            teamLogoPath(user.getId(), data),
                            data == null ? 0 : data.getTotalPoints(),
                            league.getAdmin() != null && league.getAdmin().getId().equals(user.getId())
                    );
                })
                .sorted(Comparator.comparingInt(ObservedManager::totalPoints).reversed()
                        .thenComparing(ObservedManager::managerName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new ObservedLeague(
                league.getId(), league.getName(), league.getLeagueCode(), league.getStatus().name(),
                league.getAdmin() == null ? null : league.getAdmin().getId(),
                league.getMaxParticipants(), Map.copyOf(league.getScoringRules()), managers
        );
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/squad")
    public SquadDto squad(@PathVariable long leagueId,
                          @PathVariable int userId,
                          @RequestParam(required = false) Integer gw) {
        requireLeagueMember(leagueId, userId);
        return fantasyTeamService.getSquadForGameweek(userId, gw);
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/players")
    public List<PlayerDto> players(@PathVariable long leagueId, @PathVariable int userId) {
        requireLeagueMember(leagueId, userId);
        return playerService.getAllPlayers(userId);
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/squad-data/{gameweekId}")
    public List<PlayerDataDto> squadData(@PathVariable long leagueId,
                                         @PathVariable int userId,
                                         @PathVariable int gameweekId) {
        requireLeagueMember(leagueId, userId);
        return playerService.getSquadDataForGameweek(userId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/points/{gameweekId}")
    public int points(@PathVariable long leagueId,
                      @PathVariable int userId,
                      @PathVariable int gameweekId) {
        requireLeagueMember(leagueId, userId);
        return pointsService.getUserPointsForGameWeek(userId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/players-of-the-week/{gameweekId}")
    public CrownSummaryDto playersOfTheWeek(@PathVariable long leagueId,
                                             @PathVariable int userId,
                                             @PathVariable int gameweekId) {
        requireLeagueMember(leagueId, userId);
        if (gameweekId < 1 || gameweekId > 38) {
            throw new IllegalArgumentException("Gameweek must be between 1 and 38");
        }
        return playerService.getCrownSummary(userId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/roasts/{gameweekId}")
    public ResponseEntity<AiRoastDto> roast(@PathVariable long leagueId,
                                            @PathVariable int gameweekId) {
        requireLeague(leagueId);
        if (gameweekId < 1 || gameweekId > 38) {
            throw new IllegalArgumentException("Gameweek must be between 1 and 38");
        }
        return aiRoastService.findForLeague(leagueId, gameweekId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/leagues/{leagueId}/roasts/{gameweekId}/preview")
    public AiRoastDto previewRoast(@PathVariable long leagueId,
                                   @PathVariable int gameweekId) {
        requireLeague(leagueId);
        if (gameweekId < 1 || gameweekId > 38) {
            throw new IllegalArgumentException("Gameweek must be between 1 and 38");
        }
        return aiRoastService.previewForLeague(leagueId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/window")
    public Map<String, Object> window(@PathVariable long leagueId) {
        requireLeague(leagueId);
        return transferMarketService.getCurrentWindowStateForLeague(leagueId);
    }

    @GetMapping("/leagues/{leagueId}/draft")
    public DraftConfig draft(@PathVariable long leagueId) {
        requireLeague(leagueId);
        return draftService.getDraftConfigForLeague(leagueId);
    }

    @GetMapping("/leagues/{leagueId}/order/{gameweekId}")
    public List<Integer> order(@PathVariable long leagueId, @PathVariable int gameweekId) {
        requireLeague(leagueId);
        return transferMarketService.getConfiguredTransferOrderForLeague(leagueId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/users/{userId}/attendance/{gameweekId}")
    public Map<String, Object> attendance(@PathVariable long leagueId,
                                          @PathVariable int userId,
                                          @PathVariable int gameweekId) {
        requireLeagueMember(leagueId, userId);
        return transferMarketService.getAttendancePreferenceForLeague(leagueId, userId, gameweekId);
    }

    @GetMapping("/leagues/{leagueId}/history/{gameweekId}")
    public List<TransferActionDto> history(@PathVariable long leagueId, @PathVariable int gameweekId) {
        requireLeague(leagueId);
        return transferMarketService.getTransferHistoryForLeague(leagueId, gameweekId);
    }

    private LeagueEntity requireLeague(long leagueId) {
        return leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
    }

    private void requireLeagueMember(long leagueId, int userId) {
        boolean member = requireLeague(leagueId).getUsers().stream().anyMatch(user -> user.getId() == userId);
        if (!member) throw new IllegalArgumentException("Manager is not in the selected league");
    }

    private String teamLogoPath(int userId, UserGameDataEntity data) {
        if (data == null || data.getTeamLogoBytes() == null || data.getTeamLogoBytes().length == 0) {
            return "/UI/team-placeholder.svg";
        }
        return "/api/users/" + userId + "/team-logo?v=" + data.getTeamLogoVersion();
    }

    public record ObservedLeague(
            long id,
            String name,
            String leagueCode,
            String status,
            Integer adminId,
            int maxParticipants,
            Map<String, Integer> scoringRules,
            List<ObservedManager> managers
    ) {}

    public record ObservedManager(
            int userId,
            String managerName,
            String firstName,
            String lastName,
            String username,
            String email,
            boolean emailVerified,
            String fantasyTeamName,
            String logoPath,
            int totalPoints,
            boolean leagueAdmin
    ) {}
}
