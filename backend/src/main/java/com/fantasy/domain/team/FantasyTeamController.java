package com.fantasy.domain.team;

import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.team.Exceptions.IRException;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import com.fantasy.domain.league.LeagueAccessService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/teams")
public class FantasyTeamController {

    private static final Logger log = LoggerFactory.getLogger(FantasyTeamController.class);
    private final FantasyTeamService fantasyTeamService;
    private final UserRepository userRepository;
    private final LeagueAccessService leagueAccessService;

    public FantasyTeamController(FantasyTeamService fantasyTeamService,
                                 UserRepository userRepository,
                                 LeagueAccessService leagueAccessService) {
        this.fantasyTeamService = fantasyTeamService;
        this.userRepository = userRepository;
        this.leagueAccessService = leagueAccessService;
    }

    @GetMapping("/{userId}/squad")
    public ResponseEntity<SquadDto> getSquad(@PathVariable int userId,
                                             @RequestParam(required = false) Integer gw,
                                             Authentication authentication) {
        leagueAccessService.requireSameLeague(authenticatedUserId(authentication), userId);
        return ResponseEntity.ok(fantasyTeamService.getSquadForGameweek(userId, gw));
    }

    @PostMapping("/{userId}/save")
    public ResponseEntity<?> saveTeam(@PathVariable int userId, @RequestBody SquadDto squadDto,
                                      Authentication authentication) {
        try {
            SquadDto saved = fantasyTeamService.saveTeam(authenticatedUserId(authentication), squadDto);
            return ResponseEntity.ok(saved);
        } catch (FantasyTeamException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error saving team", e);
            return ResponseEntity.internalServerError().body("Error saving team");
        }
    }

    @PostMapping("/{userId}/save/prev/{gw}")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> saveTeamForPrevGw(@PathVariable int userId, @PathVariable int gw, @RequestBody SquadDto dto) {
        fantasyTeamService.saveTeamForPrevGameweek(userId, dto, gw);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/chips")
    public ResponseEntity<UserChipsDto> getUserChips(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.getUserChips(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/ir")
    public ResponseEntity<?> assignIR(@PathVariable int userId, @RequestParam int playerId,
                                      Authentication authentication) {
        try {
            return ResponseEntity.ok(fantasyTeamService.assignIR(authenticatedUserId(authentication), playerId));
        } catch (IRException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{userId}/chips/ir/release")
    public ResponseEntity<?> releaseIR(@PathVariable int userId, @RequestParam int playerOutId,
                                       Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.releaseIR(authenticatedUserId(authentication), playerOutId));
    }

    @PostMapping("/{userId}/chips/first-pick-captain")
    public ResponseEntity<?> assignFirstPickCaptain(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.assignFirstPickCaptain(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/first-pick-captain/release")
    public ResponseEntity<?> releaseFirstPickCaptain(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.releaseFirstPickCaptain(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/triple-captain")
    public ResponseEntity<?> assignTripleCaptain(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.assignTripleCaptain(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/triple-captain/release")
    public ResponseEntity<?> releaseTripleCaptain(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.releaseTripleCaptain(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/bench-boost")
    public ResponseEntity<?> assignBenchBoost(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.assignBenchBoost(authenticatedUserId(authentication)));
    }

    @PostMapping("/{userId}/chips/bench-boost/release")
    public ResponseEntity<?> releaseBenchBoost(@PathVariable int userId, Authentication authentication) {
        return ResponseEntity.ok(fantasyTeamService.releaseBenchBoost(authenticatedUserId(authentication)));
    }

    @GetMapping("/ir-status")
    public ResponseEntity<List<IrStatusDto>> getIrStatus(Authentication authentication) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(authenticatedUserId(authentication));
        return ResponseEntity.ok(fantasyTeamService.getIrStatuses(leagueId));
    }

    @GetMapping("/{userId}/watchlist")
    public ResponseEntity<List<Integer>> getWatchlist(@PathVariable int userId, Authentication authentication) {
        int authenticatedUserId = authenticatedUserId(authentication);
        Optional<UserEntity> userEntity = userRepository.findById(authenticatedUserId);
        if (userEntity.isPresent() && userEntity.get().getRole().equals(UserRole.ROLE_SUPER_ADMIN))
            return ResponseEntity.ok(new ArrayList<>());
        return ResponseEntity.ok(fantasyTeamService.getWatchlist(authenticatedUserId));
    }

    @PostMapping("/{userId}/watchlist/add")
    public ResponseEntity<Void> addToWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body,
                                               Authentication authentication) {
        fantasyTeamService.addToWatchlist(authenticatedUserId(authentication), body.get("playerId"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/watchlist/remove")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable int userId, @RequestBody Map<String, Integer> body,
                                                    Authentication authentication) {
        fantasyTeamService.removeFromWatchlist(authenticatedUserId(authentication), body.get("playerId"));
        return ResponseEntity.ok().build();
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
