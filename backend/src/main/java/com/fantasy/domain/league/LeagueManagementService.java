package com.fantasy.domain.league;

import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.ChipNames;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class LeagueManagementService {

    private static final String CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final LeagueRepository leagueRepository;
    private final UserRepository userRepository;
    private final UserGameDataRepository gameDataRepository;

    public LeagueManagementService(LeagueRepository leagueRepository,
                                   UserRepository userRepository,
                                   UserGameDataRepository gameDataRepository) {
        this.leagueRepository = leagueRepository;
        this.userRepository = userRepository;
        this.gameDataRepository = gameDataRepository;
    }

    @Transactional
    public LeagueDetailsDto createLeague(int userId, CreateLeagueRequest request) {
        UserEntity creator = requireUser(userId);
        ensureUserHasNoLeague(userId);

        String leagueName = requireText(request.name(), "League name", 3, 60);
        int maxParticipants = request.maxParticipants() == null ? 8 : request.maxParticipants();
        if (maxParticipants < 2 || maxParticipants > 20) {
            throw new IllegalArgumentException("League size must be between 2 and 20");
        }

        LeagueEntity league = new LeagueEntity();
        league.setName(leagueName);
        league.setLeagueCode(generateUniqueCode());
        league.setAdmin(creator);
        league.setMaxParticipants(maxParticipants);
        league.setScoringRules(normalizeScoringRules(request.scoringRules()));
        league.addUser(creator);

        LeagueEntity savedLeague = leagueRepository.save(league);
        initializeGameData(creator, savedLeague, request.fantasyTeamName());
        return toDto(savedLeague, creator);
    }

    @Transactional
    public LeagueDetailsDto joinLeague(int userId, JoinLeagueRequest request) {
        UserEntity user = requireUser(userId);
        ensureUserHasNoLeague(userId);

        String leagueCode = requireText(request.leagueCode(), "League code", CODE_LENGTH, 12)
                .toUpperCase(Locale.ROOT);
        LeagueEntity league = leagueRepository.findByLeagueCodeWithLock(leagueCode)
                .orElseThrow(() -> new IllegalArgumentException("League code was not found"));

        if (league.getUsers().size() >= league.getMaxParticipants()) {
            throw new IllegalStateException("League is full");
        }
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE) {
            throw new IllegalStateException("The league is no longer accepting managers");
        }

        league.addUser(user);
        leagueRepository.save(league);
        initializeGameData(user, league, request.fantasyTeamName());
        return toDto(league, user);
    }

    @Transactional(readOnly = true)
    public LeagueDetailsDto getMyLeague(int userId) {
        UserEntity user = requireUser(userId);
        LeagueEntity league = leagueRepository.findFirstByUsers_Id(userId)
                .orElseThrow(() -> new IllegalStateException("User is not in a league"));
        return toDto(league, user);
    }

    @Transactional
    public LeagueDetailsDto updateSettings(int userId, long leagueId, UpdateLeagueSettingsRequest request) {
        UserEntity actingUser = requireUser(userId);
        LeagueEntity league = leagueRepository.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        requireLeagueAdmin(actingUser, league);

        return applySettings(league, request, actingUser, false);
    }

    @Transactional
    public LeagueDetailsDto removeMember(int actingUserId, long leagueId, int memberId) {
        UserEntity actingUser = requireUser(actingUserId);
        LeagueEntity league = leagueRepository.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        requireLeagueAdmin(actingUser, league);

        if (league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE) {
            throw new IllegalStateException("Managers cannot be removed after the initial draft starts");
        }
        if (league.getAdmin().getId().equals(memberId)) {
            throw new IllegalArgumentException("The league admin cannot remove themselves");
        }

        UserEntity member = league.getUsers().stream()
                .filter(user -> user.getId().equals(memberId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Manager is not in this league"));

        gameDataRepository.findByUserId(memberId).ifPresent(gameDataRepository::delete);
        league.removeUser(member);
        return toDto(leagueRepository.save(league), actingUser);
    }

    @Transactional(readOnly = true)
    public List<LeagueDetailsDto> getLeaguesForMaintenance() {
        return leagueRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(LeagueEntity::getName, String.CASE_INSENSITIVE_ORDER))
                .map(league -> toDto(league, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public LeagueDetailsDto getLeagueForMaintenance(long leagueId) {
        return toDto(
                leagueRepository.findById(leagueId)
                        .orElseThrow(() -> new IllegalArgumentException("League was not found")),
                null
        );
    }

    @Transactional
    public LeagueDetailsDto updateSettingsForMaintenance(long leagueId,
                                                          UpdateLeagueSettingsRequest request) {
        LeagueEntity league = leagueRepository.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        return applySettings(league, request, null, true);
    }

    private LeagueDetailsDto applySettings(LeagueEntity league,
                                            UpdateLeagueSettingsRequest request,
                                            UserEntity actingUser,
                                            boolean maintenanceOverride) {

        if (request.name() != null) {
            league.setName(requireText(request.name(), "League name", 3, 60));
        }
        if (request.maxParticipants() != null) {
            int capacity = request.maxParticipants();
            boolean capacityLocked = league.getStatus() == LeagueStatus.DRAFT_LIVE
                    || league.getStatus() == LeagueStatus.ACTIVE;
            if (capacityLocked && !maintenanceOverride && capacity != league.getMaxParticipants()) {
                throw new IllegalStateException(
                        "League size cannot change after the initial draft starts"
                );
            }
            if (capacity < league.getUsers().size() || capacity > 20) {
                throw new IllegalArgumentException(
                        "League size must be between the current participant count and 20"
                );
            }
            league.setMaxParticipants(capacity);
        }
        if (request.scoringRules() != null) {
            league.setScoringRules(normalizeScoringRules(request.scoringRules()));
        }

        return toDto(leagueRepository.save(league), actingUser);
    }

    private void ensureUserHasNoLeague(int userId) {
        if (leagueRepository.existsByUsers_Id(userId)) {
            throw new IllegalStateException("User is already in a league");
        }
    }

    private UserEntity requireUser(int userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));
    }

    private void requireLeagueAdmin(UserEntity user, LeagueEntity league) {
        boolean leagueAdmin = league.getAdmin().getId().equals(user.getId());
        if (!leagueAdmin) {
            throw new AccessDeniedException("Only the league admin can change league settings");
        }
    }

    private void initializeGameData(UserEntity user, LeagueEntity league, String requestedTeamName) {
        String teamName = requestedTeamName == null || requestedTeamName.isBlank()
                ? user.getName() + " FC"
                : requireText(requestedTeamName, "Fantasy team name", 2, 40);

        UserGameDataEntity gameData = gameDataRepository.findByUserId(user.getId())
                .orElseGet(UserGameDataEntity::new);
        gameData.setUser(user);
        gameData.setLeague(league);
        gameData.setFantasyTeamName(teamName);
        if (gameData.getChips().isEmpty()) {
            gameData.setChips(new HashMap<>(Map.of(
                    ChipNames.FIRST_PICK_CAPTAIN, 1,
                    ChipNames.TRIPLE_CAPTAIN, 1,
                    ChipNames.BENCH_BOOST, 1,
                    ChipNames.IR, 2
            )));
        }
        if (gameData.getActiveChips().isEmpty()) {
            gameData.setActiveChips(new HashMap<>(Map.of(
                    ChipNames.FIRST_PICK_CAPTAIN, false,
                    ChipNames.TRIPLE_CAPTAIN, false,
                    ChipNames.BENCH_BOOST, false,
                    ChipNames.IR, false
            )));
        }
        gameDataRepository.save(gameData);
    }

    private Map<String, Integer> normalizeScoringRules(Map<String, Integer> requestedRules) {
        Map<String, Integer> rules = new LinkedHashMap<>(LeagueScoringRules.defaults());
        if (requestedRules == null) {
            return rules;
        }

        requestedRules.forEach((rawKey, points) -> {
            if (rawKey == null || points == null) {
                throw new IllegalArgumentException("Scoring rule keys and values are required");
            }
            String key = rawKey.trim().toUpperCase(Locale.ROOT);
            if (!key.matches("[A-Z0-9_.-]{3,80}")) {
                throw new IllegalArgumentException("Invalid scoring rule key: " + rawKey);
            }
            if (points < -100 || points > 100) {
                throw new IllegalArgumentException("Scoring points must be between -100 and 100");
            }
            rules.put(key, points);
        });
        return rules;
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder code = new StringBuilder(CODE_LENGTH);
            for (int index = 0; index < CODE_LENGTH; index++) {
                code.append(CODE_CHARACTERS.charAt(RANDOM.nextInt(CODE_CHARACTERS.length())));
            }
            String candidate = code.toString();
            if (!leagueRepository.existsByLeagueCodeIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a unique league code");
    }

    private String requireText(String value, String field, int minLength, int maxLength) {
        if (value == null) {
            throw new IllegalArgumentException(field + " is required");
        }
        String normalized = value.trim();
        if (normalized.length() < minLength || normalized.length() > maxLength) {
            throw new IllegalArgumentException(
                    field + " must contain between " + minLength + " and " + maxLength + " characters"
            );
        }
        return normalized;
    }

    private LeagueDetailsDto toDto(LeagueEntity league, UserEntity currentUser) {
        boolean isLeagueAdmin = currentUser != null
                && league.getAdmin().getId().equals(currentUser.getId());
        return new LeagueDetailsDto(
                league.getId(),
                league.getName(),
                league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE
                        ? null
                        : league.getLeagueCode(),
                league.getMaxParticipants(),
                league.getUsers().size(),
                league.getAdmin().getId(),
                isLeagueAdmin,
                Map.copyOf(league.getScoringRules()),
                league.getStatus()
        );
    }
}
