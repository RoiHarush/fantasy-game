package com.fantasy.domain.transfer;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SupplementalDraftPoolService {

    private final SupplementalDraftPoolRepository poolRepository;
    private final LeagueRepository leagueRepository;

    public SupplementalDraftPoolService(SupplementalDraftPoolRepository poolRepository,
                                        LeagueRepository leagueRepository) {
        this.poolRepository = poolRepository;
        this.leagueRepository = leagueRepository;
    }

    @Transactional
    public void reserveNewPlayer(PlayerEntity player) {
        for (LeagueEntity league : leagueRepository.findAll()) {
            if (league.getStatus() != LeagueStatus.ACTIVE
                    && league.getStatus() != LeagueStatus.DRAFT_LIVE) {
                continue;
            }
            if (poolRepository.existsByLeague_IdAndPlayer_Id(league.getId(), player.getId())) {
                continue;
            }

            SupplementalDraftPoolEntity entry = new SupplementalDraftPoolEntity();
            entry.setLeague(league);
            entry.setPlayer(player);
            entry.setDiscoveredAt(player.getFirstSeenAt());
            poolRepository.save(entry);
        }
    }

    @Transactional(readOnly = true)
    public Set<Integer> playerIds(long leagueId) {
        return poolRepository.findByLeague_Id(leagueId).stream()
                .map(entry -> entry.getPlayer().getId())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Transactional(readOnly = true)
    public boolean isEligible(long leagueId, int playerId) {
        return poolRepository.existsByLeague_IdAndPlayer_Id(leagueId, playerId);
    }

    @Transactional(readOnly = true)
    public void requireEligible(long leagueId, int playerId) {
        if (!isEligible(leagueId, playerId)) {
            throw new FantasyTeamException("Player is not eligible for this supplemental draft");
        }
    }

    @Transactional
    public void releasePool(long leagueId) {
        poolRepository.deleteByLeague_Id(leagueId);
    }
}
