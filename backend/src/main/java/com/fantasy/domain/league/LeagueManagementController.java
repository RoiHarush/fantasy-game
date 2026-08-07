package com.fantasy.domain.league;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/leagues")
public class LeagueManagementController {

    private final LeagueManagementService leagueManagementService;

    public LeagueManagementController(LeagueManagementService leagueManagementService) {
        this.leagueManagementService = leagueManagementService;
    }

    @PostMapping
    public ResponseEntity<LeagueDetailsDto> createLeague(@RequestBody CreateLeagueRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.status(201).body(
                leagueManagementService.createLeague(authenticatedUserId(authentication), request)
        );
    }

    @PostMapping("/join")
    public ResponseEntity<LeagueDetailsDto> joinLeague(@RequestBody JoinLeagueRequest request,
                                                       Authentication authentication) {
        return ResponseEntity.ok(
                leagueManagementService.joinLeague(authenticatedUserId(authentication), request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<LeagueDetailsDto> getMyLeague(Authentication authentication) {
        return ResponseEntity.ok(
                leagueManagementService.getMyLeague(authenticatedUserId(authentication))
        );
    }

    @GetMapping("/scoring-rules/defaults")
    public ResponseEntity<Map<String, Integer>> getDefaultScoringRules() {
        return ResponseEntity.ok(LeagueScoringRules.defaults());
    }

    @PutMapping("/{leagueId}/settings")
    public ResponseEntity<LeagueDetailsDto> updateSettings(@PathVariable long leagueId,
                                                           @RequestBody UpdateLeagueSettingsRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(
                leagueManagementService.updateSettings(
                        authenticatedUserId(authentication),
                        leagueId,
                        request
                )
        );
    }

    @DeleteMapping("/{leagueId}/members/{memberId}")
    public ResponseEntity<LeagueDetailsDto> removeMember(@PathVariable long leagueId,
                                                         @PathVariable int memberId,
                                                         Authentication authentication) {
        return ResponseEntity.ok(
                leagueManagementService.removeMember(
                        authenticatedUserId(authentication),
                        leagueId,
                        memberId
                )
        );
    }

    private int authenticatedUserId(Authentication authentication) {
        return Integer.parseInt(authentication.getName());
    }
}
