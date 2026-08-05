package com.fantasy.domain.league;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LeagueAccessService {

    private final LeagueRepository leagueRepository;
    private final UserRepository userRepository;

    public LeagueAccessService(LeagueRepository leagueRepository, UserRepository userRepository) {
        this.leagueRepository = leagueRepository;
        this.userRepository = userRepository;
    }

    public long requireLeagueIdForUser(int userId) {
        return leagueRepository.findFirstByUsers_Id(userId)
                .map(LeagueEntity::getId)
                .orElseThrow(() -> new IllegalStateException("User is not in a league"));
    }

    public void requireSameLeague(int actingUserId, int targetUserId) {
        UserEntity actingUser = userRepository.findById(actingUserId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));
        if (actingUser.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            return;
        }

        Long actingLeagueId = requireLeagueIdForUser(actingUserId);
        Long targetLeagueId = leagueRepository.findFirstByUsers_Id(targetUserId)
                .map(LeagueEntity::getId)
                .orElseThrow(() -> new AccessDeniedException("Target user is not in your league"));
        if (!actingLeagueId.equals(targetLeagueId)) {
            throw new AccessDeniedException("Users belong to different leagues");
        }
    }

    public void requireLeagueAdmin(int actingUserId, long leagueId) {
        userRepository.findById(actingUserId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));

        LeagueEntity league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        if (!league.getAdmin().getId().equals(actingUserId)) {
            throw new AccessDeniedException("Only the league admin can perform this action");
        }
    }
}
