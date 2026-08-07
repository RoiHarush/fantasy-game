package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class WaiverPlanService {

    private static final int MAX_PRIORITY_ENTRIES = 30;

    private final WaiverPreferenceRepository waiverRepository;
    private final LeagueTransferWindowRepository windowRepository;
    private final LeagueAccessService leagueAccessService;
    private final LeagueRepository leagueRepository;
    private final GameWeekRepository gameWeekRepository;
    private final UserRepository userRepository;
    private final UserGameDataRepository gameDataRepository;
    private final PlayerRepository playerRepository;

    public WaiverPlanService(WaiverPreferenceRepository waiverRepository,
                             LeagueTransferWindowRepository windowRepository,
                             LeagueAccessService leagueAccessService,
                             LeagueRepository leagueRepository,
                             GameWeekRepository gameWeekRepository,
                             UserRepository userRepository,
                             UserGameDataRepository gameDataRepository,
                             PlayerRepository playerRepository) {
        this.waiverRepository = waiverRepository;
        this.windowRepository = windowRepository;
        this.leagueAccessService = leagueAccessService;
        this.leagueRepository = leagueRepository;
        this.gameWeekRepository = gameWeekRepository;
        this.userRepository = userRepository;
        this.gameDataRepository = gameDataRepository;
        this.playerRepository = playerRepository;
    }

    @Transactional
    public List<WaiverEntryDto> savePlan(int userId, int gameWeekId, SaveWaiverPlanRequest request) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        return savePlanForUser(leagueId, userId, gameWeekId, request);
    }

    @Transactional
    public List<WaiverEntryDto> savePlanForUser(long leagueId,
                                                int userId,
                                                int gameWeekId,
                                                SaveWaiverPlanRequest request) {
        ensureWindowNotStarted(leagueId, gameWeekId);
        LeagueEntity league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));
        ensureLeagueMember(league, userId);
        GameWeekEntity gameWeek = gameWeekRepository.findById(gameWeekId)
                .orElseThrow(() -> new IllegalArgumentException("GameWeek was not found"));
        int nextGameWeekId = gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING")
                .map(GameWeekEntity::getId)
                .orElseThrow(() -> new IllegalStateException("No upcoming gameweek is available"));
        if (gameWeek.getId() != nextGameWeekId) {
            throw new IllegalStateException("Waiver plans can only be prepared for the next gameweek");
        }

        List<WaiverEntryRequest> entries = request == null || request.entries() == null
                ? List.of()
                : request.entries();
        if (entries.size() > MAX_PRIORITY_ENTRIES) {
            throw new IllegalArgumentException("A waiver plan can contain at most 30 priority entries");
        }

        UserSquadEntity nextSquad = gameDataRepository.findByUserId(userId)
                .map(UserGameDataEntity::getNextSquad)
                .orElse(null);
        Set<String> uniquePairs = new HashSet<>();
        List<WaiverPreferenceEntity> preferences = new ArrayList<>();
        for (int index = 0; index < entries.size(); index++) {
            WaiverEntryRequest entry = entries.get(index);
            validateEntry(entry, league, nextSquad, uniquePairs);
            WaiverPreferenceEntity preference = new WaiverPreferenceEntity();
            preference.setLeague(league);
            preference.setUser(user);
            preference.setGameWeek(gameWeek);
            preference.setPriority(index + 1);
            preference.setPlayerInId(entry.playerInId());
            preference.setPlayerOutId(entry.playerOutId());
            preferences.add(preference);
        }

        waiverRepository.deleteByLeague_IdAndUser_IdAndGameWeek_Id(leagueId, userId, gameWeekId);
        waiverRepository.flush();
        return waiverRepository.saveAll(preferences).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<WaiverEntryDto> getPlan(int userId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        return getPlanForUser(leagueId, userId, gameWeekId);
    }

    @Transactional(readOnly = true)
    public List<WaiverEntryDto> getPlanForUser(long leagueId, int userId, int gameWeekId) {
        LeagueEntity league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        ensureLeagueMember(league, userId);
        return waiverRepository.findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(
                        leagueId,
                        userId,
                        gameWeekId
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void deletePlan(int userId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        deletePlanForUser(leagueId, userId, gameWeekId);
    }

    @Transactional
    public void deletePlanForUser(long leagueId, int userId, int gameWeekId) {
        LeagueEntity league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        ensureLeagueMember(league, userId);
        ensureWindowNotStarted(leagueId, gameWeekId);
        waiverRepository.deleteByLeague_IdAndUser_IdAndGameWeek_Id(leagueId, userId, gameWeekId);
    }

    private void ensureLeagueMember(LeagueEntity league, int userId) {
        boolean member = league.getUsers().stream().anyMatch(user -> user.getId().equals(userId));
        if (!member) {
            throw new IllegalArgumentException("User is not a member of the selected league");
        }
    }

    private void ensureWindowNotStarted(long leagueId, int gameWeekId) {
        windowRepository.findByLeague_IdAndGameWeek_IdAndWindowType(
                        leagueId,
                        gameWeekId,
                        TransferWindowType.TRANSFER
                )
                .filter(window -> window.getStatus() != TransferWindowStatus.READY)
                .ifPresent(window -> {
                    throw new IllegalStateException("Waiver plan is locked once the transfer window starts");
                });
    }

    private void validateEntry(WaiverEntryRequest entry,
                               LeagueEntity league,
                               UserSquadEntity nextSquad,
                               Set<String> uniquePairs) {
        if (entry == null || entry.playerInId() == null || entry.playerOutId() == null) {
            throw new IllegalArgumentException("Each waiver entry requires incoming and outgoing players");
        }
        if (entry.playerInId().equals(entry.playerOutId())) {
            throw new IllegalArgumentException("Incoming and outgoing players must be different");
        }
        String pair = entry.playerInId() + ":" + entry.playerOutId();
        if (!uniquePairs.add(pair)) {
            throw new IllegalArgumentException("Duplicate waiver preference: " + pair);
        }

        PlayerEntity incoming = playerRepository.findById(entry.playerInId())
                .orElseThrow(() -> new IllegalArgumentException("Incoming player was not found"));
        PlayerEntity outgoing = playerRepository.findById(entry.playerOutId())
                .orElseThrow(() -> new IllegalArgumentException("Outgoing player was not found"));
        if (league.isPlayerLocked(incoming.getId())) {
            throw new IllegalArgumentException("Incoming player is locked in this league");
        }
        if (league.effectivePosition(incoming) != league.effectivePosition(outgoing)) {
            throw new IllegalArgumentException("Waiver players must have the same position");
        }
        if (nextSquad != null && !containsRosterPlayer(nextSquad, outgoing.getId())) {
            throw new IllegalArgumentException("Outgoing player is not in your squad");
        }
    }

    private boolean containsRosterPlayer(UserSquadEntity squad, int playerId) {
        return squad.getStartingLineup().contains(playerId)
                || squad.getBenchMap().values().stream().anyMatch(id -> Objects.equals(id, playerId));
    }

    private WaiverEntryDto toDto(WaiverPreferenceEntity preference) {
        return new WaiverEntryDto(
                preference.getPriority(),
                preference.getPlayerInId(),
                preference.getPlayerOutId()
        );
    }
}
