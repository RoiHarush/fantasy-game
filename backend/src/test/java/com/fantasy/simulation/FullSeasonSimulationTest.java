package com.fantasy.simulation;

import com.fantasy.application.SeasonResetService;
import com.fantasy.domain.auth.AuthService;
import com.fantasy.domain.auth.LoginRequest;
import com.fantasy.domain.auth.LoginResponse;
import com.fantasy.domain.auth.RegisterRequest;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekDailyStatusRepository;
import com.fantasy.domain.game.GameweekManager;
import com.fantasy.domain.league.CreateLeagueRequest;
import com.fantasy.domain.league.JoinLeagueRequest;
import com.fantasy.domain.league.LeagueDetailsDto;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueManagementService;
import com.fantasy.domain.league.LeaguePlayerAdminService;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.league.UpdateLeagueSettingsRequest;
import com.fantasy.domain.player.PlayerAssistedDto;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;
import com.fantasy.domain.player.PlayerPenaltyDto;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.player.UpdateAssistRequest;
import com.fantasy.domain.player.UpdatePenaltyRequest;
import com.fantasy.domain.player.UpdatePositionRequest;
import com.fantasy.domain.score.PointsService;
import com.fantasy.domain.team.FantasyTeamService;
import com.fantasy.domain.team.IRSignRequestDto;
import com.fantasy.domain.team.SquadDto;
import com.fantasy.domain.team.UserChipsDto;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.transfer.DraftService;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.SaveWaiverPlanRequest;
import com.fantasy.domain.transfer.TransferMarketService;
import com.fantasy.domain.transfer.TransferRequestDto;
import com.fantasy.domain.transfer.TurnOrderDto;
import com.fantasy.domain.transfer.WaiverEntryRequest;
import com.fantasy.domain.transfer.WaiverPlanService;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A deterministic, API-free simulation of the complete 7-manager season.
 *
 * <p>The test deliberately uses the real Spring services, repositories, Flyway
 * migrations, scoring rules, draft implementation and transfer-window state
 * machine. Only the external FPL feed is replaced by synthetic fixtures and
 * player statistics. Its H2 database exists only for this test run.</p>
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:full-season-simulation;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=false",
        "app.scheduling.enabled=false",
        "app.bootstrap.enabled=false",
        "app.season-reset.enabled=false",
        "app.jwt.secret=ZmFudGFzeS1zZWFzb24tc2ltdWxhdGlvbi10ZXN0LWtleQ==",
        "logging.level.com.fantasy=warn"
})
class FullSeasonSimulationTest {

    private static final int MANAGER_COUNT = 7;
    private static final int GAMEWEEK_COUNT = 38;
    private static final String PASSWORD = "SeasonPass!23";
    private static final Map<PlayerPosition, Integer> DRAFT_LIMITS = Map.of(
            PlayerPosition.GOALKEEPER, 2,
            PlayerPosition.DEFENDER, 5,
            PlayerPosition.MIDFIELDER, 5,
            PlayerPosition.FORWARD, 3
    );

    @Autowired private AuthService authService;
    @Autowired private LeagueManagementService leagueManagementService;
    @Autowired private LeaguePlayerAdminService leaguePlayerAdminService;
    @Autowired private DraftService draftService;
    @Autowired private TransferMarketService transferMarketService;
    @Autowired private WaiverPlanService waiverPlanService;
    @Autowired private FantasyTeamService fantasyTeamService;
    @Autowired private GameweekManager gameweekManager;
    @Autowired private PointsService pointsService;
    @Autowired private SeasonResetService seasonResetService;

    @Autowired private UserRepository userRepository;
    @Autowired private LeagueRepository leagueRepository;
    @Autowired private PlayerRepository playerRepository;
    @Autowired private GameWeekRepository gameWeekRepository;
    @Autowired private FixtureRepository fixtureRepository;
    @Autowired private PlayerGameweekStatsRepository statsRepository;
    @Autowired private UserGameDataRepository gameDataRepository;
    @Autowired private UserSquadRepository squadRepository;
    @Autowired private UserPointsRepository userPointsRepository;
    @Autowired private GameweekDailyStatusRepository dailyStatusRepository;
    @Autowired private LeagueTransferWindowRepository windowRepository;

    @Test
    void simulatesACompleteSevenManagerSeasonAndResetsIt() throws Exception {
        seedReferenceData();
        List<Integer> managerIds = registerManagers();
        LeagueDetailsDto league = createLeague(managerIds);
        long leagueId = league.id();
        int adminId = managerIds.getFirst();

        verifyAuthenticationAndLeagueAdministration(managerIds, leagueId);

        PlayerEntity lockedDraftPlayer = firstFreePlayer(PlayerPosition.GOALKEEPER, Set.of());
        PlayerEntity positionOverridePlayer = firstFreePlayer(
                PlayerPosition.MIDFIELDER,
                Set.of(lockedDraftPlayer.getId())
        );
        Set<Integer> reservedPlayers = Set.of(
                lockedDraftPlayer.getId(),
                positionOverridePlayer.getId()
        );
        verifyLeaguePlayerControls(
                adminId,
                managerIds.get(1),
                leagueId,
                lockedDraftPlayer,
                positionOverridePlayer
        );

        draftService.runSnakeDraftForUser(adminId);
        runCompleteDraft(
                adminId,
                leagueId,
                lockedDraftPlayer.getId(),
                reservedPlayers
        );
        leaguePlayerAdminService.setPlayerLocked(adminId, lockedDraftPlayer.getId(), false);
        verifyCompletedDraft(leagueId);
        verifyWatchlist(adminId, positionOverridePlayer.getId());

        UserGameDataEntity captainUser = requireGameData(adminId);
        int firstPickId = captainUser.getNextSquad().getFirstPickId();
        fantasyTeamService.assignFirstPickCaptain(adminId);
        UserChipsDto captainChip = fantasyTeamService.getUserChips(adminId);
        assertAll(
                () -> assertEquals(0, captainChip.getRemaining().get("FIRST_PICK_CAPTAIN")),
                () -> assertTrue(captainChip.getActive().get("FIRST_PICK_CAPTAIN")),
                () -> assertEquals(firstPickId, requireGameData(adminId).getNextSquad().getCaptainId())
        );

        IrCycle firstIrCycle = assignIrToBenchPlayer(adminId);
        seedSyntheticSeasonStats(firstPickId);

        Integer firstIrReplacement = completeTransferWindow(
                leagueId,
                1,
                WindowScenario.DIRECT_TRANSFER_AND_IR,
                adminId,
                firstIrCycle
        );
        assertNotNull(firstIrReplacement);
        fantasyTeamService.releaseIR(adminId, firstIrReplacement);
        verifyIrChip(adminId, 1, false);
        UserSquadEntity squadBeforeGameweekOne = requireGameData(adminId).getNextSquad();
        int captainBeforeGameweekOne = squadBeforeGameweekOne.getCaptainId();
        int expectedCaptainAfterAutosubs = captainBeforeGameweekOne == firstPickId
                ? squadBeforeGameweekOne.getViceCaptainId()
                : captainBeforeGameweekOne;

        for (int gameweek = 1; gameweek <= GAMEWEEK_COUNT; gameweek++) {
            if (gameweek > 1) {
                if (gameweek == 2) {
                    assertThrows(RuntimeException.class,
                            () -> fantasyTeamService.assignFirstPickCaptain(adminId));
                    prepareWaiverPlan(leagueId, gameweek, adminId);
                }
                if (gameweek == 3) {
                    verifyManualTransferOrder(adminId, gameweek, managerIds);
                }

                IrCycle irCycle = null;
                WindowScenario scenario = WindowScenario.PASS_ONLY;
                if (gameweek == 2) scenario = WindowScenario.WAIVER;
                if (gameweek == 5) scenario = WindowScenario.CLUB_LIMIT_REJECTION;
                if (gameweek == 6) scenario = WindowScenario.LOCKED_PLAYER_REJECTION;
                if (gameweek == 10) {
                    irCycle = assignIrToBenchPlayer(adminId);
                    scenario = WindowScenario.IR_ONLY;
                }

                Integer replacement = completeTransferWindow(
                        leagueId,
                        gameweek,
                        scenario,
                        adminId,
                        irCycle
                );
                if (gameweek == 10) {
                    assertNotNull(replacement);
                    fantasyTeamService.releaseIR(adminId, replacement);
                    verifyIrChip(adminId, 0, false);
                    int thirdIrCandidate = requireGameData(adminId).getNextSquad().getBenchMap().get("S3");
                    assertThrows(RuntimeException.class,
                            () -> fantasyTeamService.assignIR(adminId, thirdIrCandidate));
                }
            }

            gameweekManager.openNextGameweek(gameweek, true);
            assertEquals("LIVE", gameWeekRepository.findById(gameweek).orElseThrow().getStatus());

            if (gameweek == 1) {
                verifyLeagueStatAdjustments(
                        adminId,
                        managerIds.get(1),
                        leagueId,
                        firstPickId,
                        gameweek
                );
            }

            gameweekManager.processGameweek(gameweek, true);
            assertTrue(gameWeekRepository.findById(gameweek).orElseThrow().isCalculated());

            if (gameweek == 1) {
                UserSquadEntity processed = squadRepository
                        .findByUser_IdAndGameweek(requireGameData(adminId).getId(), 1)
                        .orElseThrow();
                assertAll(
                        () -> assertTrue(processed.isAutoSubsApplied()),
                        () -> assertEquals(expectedCaptainAfterAutosubs, processed.getCaptainId()),
                        () -> assertNotEquals(firstPickId, processed.getCaptainId()),
                        () -> assertFalse(fantasyTeamService.getUserChips(adminId)
                                .getActive().get("FIRST_PICK_CAPTAIN"))
                );
            }
        }

        verifySeasonResults(managerIds, leagueId);
        verifyResetAndIdentityRestart();
    }

    private void seedReferenceData() {
        List<GameWeekEntity> gameweeks = new ArrayList<>();
        List<FixtureEntity> fixtures = new ArrayList<>();
        LocalDateTime base = LocalDateTime.of(2035, 8, 1, 15, 0);
        for (int gameweek = 1; gameweek <= GAMEWEEK_COUNT; gameweek++) {
            LocalDateTime kickoff = base.plusDays((long) (gameweek - 1) * 7);
            GameWeekEntity entity = new GameWeekEntity(
                    gameweek,
                    "Simulation GW " + gameweek,
                    kickoff,
                    kickoff.plusHours(3),
                    "UPCOMING"
            );
            entity.setTransferOpenTime(kickoff.minusHours(24));
            gameweeks.add(entity);

            FixtureEntity fixture = new FixtureEntity(
                    10_000 + gameweek,
                    gameweek,
                    1,
                    2,
                    kickoff,
                    2,
                    1
            );
            fixture.setStarted(true);
            fixture.setFinished(true);
            fixture.setMinutes(90);
            fixture.setHomeDifficulty(3);
            fixture.setAwayDifficulty(3);
            fixtures.add(fixture);
        }
        gameWeekRepository.saveAll(gameweeks);
        fixtureRepository.saveAll(fixtures);

        List<PlayerEntity> players = new ArrayList<>();
        int nextId = 1_000;
        nextId = addPlayers(players, nextId, PlayerPosition.GOALKEEPER, 24);
        nextId = addPlayers(players, nextId, PlayerPosition.DEFENDER, 50);
        nextId = addPlayers(players, nextId, PlayerPosition.MIDFIELDER, 50);
        addPlayers(players, nextId, PlayerPosition.FORWARD, 36);
        playerRepository.saveAll(players);
    }

    private int addPlayers(List<PlayerEntity> players,
                           int firstId,
                           PlayerPosition position,
                           int count) {
        for (int offset = 0; offset < count; offset++) {
            int id = firstId + offset;
            PlayerEntity player = new PlayerEntity();
            player.setId(id);
            player.setFirstName("Synthetic");
            player.setLastName(position.getCode() + id);
            player.setViewName(position.getCode() + " Player " + id);
            player.setPosition(position);
            player.setTeamId((id % 20) + 1);
            player.setInjured(false);
            player.setChanceOfPlayingThisRound(100);
            player.setChanceOfPlayingNextRound(100);
            players.add(player);
        }
        return firstId + count;
    }

    private List<Integer> registerManagers() {
        List<Integer> ids = new ArrayList<>();
        for (int index = 1; index <= MANAGER_COUNT; index++) {
            String username = "season.manager." + index;
            authService.register(new RegisterRequest(
                    "Season Manager " + index,
                    username,
                    username + "@example.com",
                    PASSWORD
            ));
            var registeredUser = userRepository.findByUsername(username).orElseThrow();
            registeredUser.setEmailVerified(true);
            userRepository.save(registeredUser);
            ids.add(registeredUser.getId());

            LoginResponse loggedIn = authService.login(new LoginRequest(username, PASSWORD));
            assertEquals(registeredUser.getId(), loggedIn.user.getId());
        }

        assertThrows(IllegalArgumentException.class, () -> authService.register(
                new RegisterRequest("Duplicate Manager", "season.manager.1", PASSWORD)
        ));
        assertThrows(RuntimeException.class, () -> authService.login(
                new LoginRequest("season.manager.1", "wrong-password")
        ));
        return ids;
    }

    private LeagueDetailsDto createLeague(List<Integer> managerIds) {
        LeagueDetailsDto league = leagueManagementService.createLeague(
                managerIds.getFirst(),
                new CreateLeagueRequest(
                        "Seven Friends Simulation",
                        MANAGER_COUNT,
                        "Simulation FC 1",
                        null
                )
        );
        for (int index = 1; index < managerIds.size(); index++) {
            LeagueDetailsDto joined = leagueManagementService.joinLeague(
                    managerIds.get(index),
                    new JoinLeagueRequest(league.leagueCode(), "Simulation FC " + (index + 1))
            );
            assertEquals(index + 1, joined.participantCount());
        }
        return leagueManagementService.getMyLeague(managerIds.getFirst());
    }

    private void verifyAuthenticationAndLeagueAdministration(List<Integer> managerIds, long leagueId) {
        int adminId = managerIds.getFirst();
        int regularManagerId = managerIds.get(1);
        Map<String, Integer> overrides = Map.of(
                "ASSIST.ALL", 5,
                "PENALTY_CONCEDED.ALL", -4
        );
        LeagueDetailsDto updated = leagueManagementService.updateSettings(
                adminId,
                leagueId,
                new UpdateLeagueSettingsRequest(
                        "Seven Friends 2035",
                        MANAGER_COUNT,
                        overrides
                )
        );
        assertAll(
                () -> assertEquals("Seven Friends 2035", updated.name()),
                () -> assertEquals(MANAGER_COUNT, updated.maxParticipants()),
                () -> assertEquals(MANAGER_COUNT, updated.participantCount()),
                () -> assertEquals(5, updated.scoringRules().get("ASSIST.ALL")),
                () -> assertEquals(-4, updated.scoringRules().get("PENALTY_CONCEDED.ALL"))
        );

        assertThrows(AccessDeniedException.class, () -> leagueManagementService.updateSettings(
                regularManagerId,
                leagueId,
                new UpdateLeagueSettingsRequest("Illegal Rename", null, null)
        ));
    }

    private void verifyLeaguePlayerControls(int adminId,
                                            int regularManagerId,
                                            long leagueId,
                                            PlayerEntity lockedDraftPlayer,
                                            PlayerEntity positionOverridePlayer) {
        assertThrows(AccessDeniedException.class, () -> leaguePlayerAdminService.setPlayerLocked(
                regularManagerId,
                lockedDraftPlayer.getId(),
                true
        ));

        leaguePlayerAdminService.setPlayerLocked(adminId, lockedDraftPlayer.getId(), true);
        assertEquals(
                List.of(lockedDraftPlayer.getId()),
                leaguePlayerAdminService.getLockedPlayers(adminId).stream()
                        .map(player -> player.getId())
                        .toList()
        );

        UpdatePositionRequest positionRequest = new UpdatePositionRequest();
        positionRequest.setPlayerId(positionOverridePlayer.getId());
        positionRequest.setPositionId(PlayerPosition.FORWARD.getId());
        leaguePlayerAdminService.updatePlayerPosition(adminId, positionRequest);
        LeagueEntity league = leagueRepository.findById(leagueId).orElseThrow();
        assertEquals(PlayerPosition.FORWARD, league.effectivePosition(positionOverridePlayer));

        positionRequest.setPositionId(positionOverridePlayer.getPosition().getId());
        leaguePlayerAdminService.updatePlayerPosition(adminId, positionRequest);
        league = leagueRepository.findById(leagueId).orElseThrow();
        assertEquals(positionOverridePlayer.getPosition(), league.effectivePosition(positionOverridePlayer));
    }

    private void runCompleteDraft(int adminId,
                                  long leagueId,
                                  int lockedPlayerId,
                                  Set<Integer> reservedPlayers) {
        Map<String, Object> initialState = transferMarketService.getCurrentWindowState(adminId);
        List<Integer> draftBaseOrder = ((List<?>) initialState.get("initialOrder")).stream()
                .map(value -> ((Number) value).intValue())
                .toList();
        assertAll(
                () -> assertTrue((Boolean) initialState.get("isOpen")),
                () -> assertTrue((Boolean) initialState.get("isDraftMode")),
                () -> assertEquals(105, ((List<?>) initialState.get("order")).size())
        );

        boolean lockedRejectionChecked = false;
        boolean duplicateRejectionChecked = false;
        Integer firstDraftedPlayer = null;
        int completedPicks = 0;

        while ((Boolean) transferMarketService.getCurrentWindowState(adminId).get("isOpen")) {
            Map<String, Object> state = transferMarketService.getCurrentWindowState(adminId);
            int currentUserId = ((Number) state.get("currentUserId")).intValue();

            if (!lockedRejectionChecked) {
                assertThrows(RuntimeException.class,
                        () -> transferMarketService.processDraftPick(currentUserId, lockedPlayerId));
                lockedRejectionChecked = true;
            }
            if (firstDraftedPlayer != null && !duplicateRejectionChecked) {
                int alreadyOwned = firstDraftedPlayer;
                assertThrows(RuntimeException.class,
                        () -> transferMarketService.processDraftPick(currentUserId, alreadyOwned));
                duplicateRejectionChecked = true;
            }

            PlayerEntity player = nextDraftPlayer(currentUserId, leagueId, reservedPlayers);
            transferMarketService.processDraftPick(currentUserId, player.getId());
            if (firstDraftedPlayer == null) firstDraftedPlayer = player.getId();
            completedPicks++;
        }

        assertEquals(105, completedPicks);
        assertTrue(lockedRejectionChecked);
        assertTrue(duplicateRejectionChecked);

        List<Integer> expectedFirstRound = new ArrayList<>(draftBaseOrder);
        expectedFirstRound.add(expectedFirstRound.removeFirst());
        List<Integer> expectedWindowOrder = new ArrayList<>(expectedFirstRound);
        List<Integer> reverseRound = new ArrayList<>(expectedFirstRound);
        Collections.reverse(reverseRound);
        expectedWindowOrder.addAll(reverseRound);
        assertEquals(expectedWindowOrder, transferMarketService.getCurrentTurnOrder(adminId, 1));
        assertEquals(15, rosterIds(requireGameData(adminId).getNextSquad(), false).size());
        assertNotNull(fantasyTeamService.getSquadForGameweek(adminId, 1));
    }

    private PlayerEntity nextDraftPlayer(int userId,
                                         long leagueId,
                                         Set<Integer> reservedPlayers) {
        LeagueEntity league = leagueRepository.findById(leagueId).orElseThrow();
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        Map<PlayerPosition, Long> currentCounts = playerRepository
                .findAllById(rosterIds(squad, false))
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        league::effectivePosition,
                        () -> new EnumMap<>(PlayerPosition.class),
                        java.util.stream.Collectors.counting()
                ));

        PlayerPosition required = List.of(PlayerPosition.values()).stream()
                .filter(position -> currentCounts.getOrDefault(position, 0L) < DRAFT_LIMITS.get(position))
                .findFirst()
                .orElseThrow();
        return findFreePlayerForUser(userId, leagueId, required, reservedPlayers);
    }

    private void verifyCompletedDraft(long leagueId) {
        LeagueEntity league = leagueRepository.findById(leagueId).orElseThrow();
        assertEquals(LeagueStatus.ACTIVE, league.getStatus());

        Set<Integer> leagueOwnership = new HashSet<>();
        for (UserGameDataEntity data : gameDataRepository.findAllByLeagueIdWithSquads(leagueId)) {
            UserSquadEntity squad = data.getNextSquad();
            Set<Integer> roster = rosterIds(squad, false);
            assertAll(
                    () -> assertEquals(15, roster.size()),
                    () -> assertEquals(11, squad.getStartingLineup().size()),
                    () -> assertEquals(4, squad.getBenchMap().values().stream().filter(Objects::nonNull).count()),
                    () -> assertEquals(Map.of("GK", 1, "DEF", 3, "MID", 4, "FWD", 3), squad.getFormation()),
                    () -> assertNotEquals(squad.getFirstPickId(), squad.getCaptainId()),
                    () -> assertNotEquals(squad.getFirstPickId(), squad.getViceCaptainId())
            );
            assertTrue(leagueOwnership.addAll(roster), "A drafted player is owned by more than one manager");

            Map<PlayerPosition, Long> counts = playerRepository.findAllById(roster).stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            league::effectivePosition,
                            () -> new EnumMap<>(PlayerPosition.class),
                            java.util.stream.Collectors.counting()
                    ));
            DRAFT_LIMITS.forEach((position, expected) ->
                    assertEquals(expected.longValue(), counts.getOrDefault(position, 0L))
            );
        }
        assertEquals(105, leagueOwnership.size());
    }

    private void verifyWatchlist(int userId, int playerId) {
        fantasyTeamService.addToWatchlist(userId, playerId);
        assertEquals(List.of(playerId), fantasyTeamService.getWatchlist(userId));
        fantasyTeamService.removeFromWatchlist(userId, playerId);
        assertTrue(fantasyTeamService.getWatchlist(userId).isEmpty());
    }

    private IrCycle assignIrToBenchPlayer(int userId) {
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        Integer irPlayerId = squad.getBenchMap().get("S3");
        assertNotNull(irPlayerId);
        fantasyTeamService.assignIR(userId, irPlayerId);
        UserSquadEntity updated = requireGameData(userId).getNextSquad();
        assertAll(
                () -> assertEquals(irPlayerId, updated.getIrId()),
                () -> assertEquals(14, rosterIds(updated, false).size()),
                () -> assertEquals(15, rosterIds(updated, true).size()),
                () -> assertNullBenchSlot(updated, "S3")
        );
        return new IrCycle(userId, irPlayerId);
    }

    private void assertNullBenchSlot(UserSquadEntity squad, String slot) {
        assertEquals(null, squad.getBenchMap().get(slot));
    }

    private void verifyIrChip(int userId, int remaining, boolean active) {
        UserChipsDto chips = fantasyTeamService.getUserChips(userId);
        assertAll(
                () -> assertEquals(remaining, chips.getRemaining().get("IR")),
                () -> assertEquals(active, chips.getActive().get("IR")),
                () -> assertEquals(null, requireGameData(userId).getNextSquad().getIrId()),
                () -> assertEquals(15, rosterIds(requireGameData(userId).getNextSquad(), false).size())
        );
    }

    private void seedSyntheticSeasonStats(int noMinutesPlayerId) {
        List<PlayerEntity> players = playerRepository.findAll();
        List<PlayerGameweekStatsEntity> allStats = new ArrayList<>(players.size() * GAMEWEEK_COUNT);
        for (int gameweek = 1; gameweek <= GAMEWEEK_COUNT; gameweek++) {
            for (PlayerEntity player : players) {
                PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
                stats.setPlayer(player);
                stats.setGameweek(gameweek);
                stats.setOpponentTeamId((player.getTeamId() % 20) + 1);
                stats.setWasHome((player.getId() + gameweek) % 2 == 0);
                int minutes = gameweek == 1 && player.getId() == noMinutesPlayerId ? 0 : 90;
                stats.setMinutesPlayed(minutes);
                stats.setStarted(minutes > 0);
                stats.setGoals((player.getId() + gameweek) % 23 == 0 ? 1 : 0);
                stats.setAssists((player.getId() + gameweek) % 17 == 0 ? 1 : 0);
                stats.setGoalsConceded((player.getTeamId() + gameweek) % 4 == 0 ? 0 : 1);
                stats.setYellowCards((player.getId() + gameweek) % 41 == 0 ? 1 : 0);
                stats.setRedCards((player.getId() + gameweek) % 211 == 0 ? 1 : 0);
                stats.setPenaltiesSaved(
                        player.getPosition() == PlayerPosition.GOALKEEPER
                                && (player.getId() + gameweek) % 97 == 0 ? 1 : 0
                );
                stats.setPenaltiesMissed((player.getId() + gameweek) % 173 == 0 ? 1 : 0);
                stats.setOwnGoals((player.getId() + gameweek) % 257 == 0 ? 1 : 0);
                stats.setPenaltiesConceded((player.getId() + gameweek) % 101 == 0 ? 1 : 0);
                allStats.add(stats);
            }
        }
        statsRepository.saveAll(allStats);
    }

    private Integer completeTransferWindow(long leagueId,
                                           int gameweek,
                                           WindowScenario scenario,
                                           int adminId,
                                           IrCycle irCycle) throws Exception {
        transferMarketService.openTransferWindow(leagueId, gameweek);
        boolean mainScenarioExecuted = false;
        boolean wrongTurnChecked = false;
        Integer irReplacement = null;

        if (scenario == WindowScenario.WAIVER) {
            assertThrows(IllegalStateException.class, () -> waiverPlanService.savePlan(
                    ((Number) transferMarketService.getCurrentWindowState(adminId).get("currentUserId")).intValue(),
                    gameweek,
                    new SaveWaiverPlanRequest(List.of())
            ));
        }

        while ((Boolean) transferMarketService.getCurrentWindowState(adminId).get("isOpen")) {
            Map<String, Object> state = transferMarketService.getCurrentWindowState(adminId);
            int currentUserId = ((Number) state.get("currentUserId")).intValue();
            String round = state.get("currentRound").toString();

            if ("IR".equals(round)) {
                assertNotNull(irCycle);
                assertEquals(irCycle.userId(), currentUserId);
                PlayerEntity irPlayer = playerRepository.findById(irCycle.playerId()).orElseThrow();
                PlayerEntity replacement = findFreePlayerForUser(
                        currentUserId,
                        leagueId,
                        irPlayer.getPosition(),
                        Set.of()
                );
                IRSignRequestDto request = new IRSignRequestDto();
                request.setUserId(currentUserId);
                request.setPlayerId(replacement.getId());
                transferMarketService.replaceIRPlayer(request);
                irReplacement = replacement.getId();
                continue;
            }

            if (!wrongTurnChecked) {
                int anotherUser = ((List<?>) state.get("initialOrder")).stream()
                        .map(value -> ((Number) value).intValue())
                        .filter(id -> id != currentUserId)
                        .findFirst()
                        .orElseThrow();
                assertThrows(IllegalStateException.class, () -> transferMarketService.passTurn(anotherUser));
                wrongTurnChecked = true;
            }

            if (!mainScenarioExecuted && scenario == WindowScenario.WAIVER) {
                Thread.sleep(2);
                transferMarketService.processAutomaticTurn(leagueId);
                mainScenarioExecuted = true;
                continue;
            }

            if (!mainScenarioExecuted && scenario == WindowScenario.DIRECT_TRANSFER_AND_IR) {
                performValidTransfer(currentUserId, leagueId);
                mainScenarioExecuted = true;
                continue;
            }

            if (!mainScenarioExecuted && scenario == WindowScenario.CLUB_LIMIT_REJECTION) {
                verifyClubLimitRejection(currentUserId, leagueId);
                mainScenarioExecuted = true;
            }

            if (!mainScenarioExecuted && scenario == WindowScenario.LOCKED_PLAYER_REJECTION) {
                verifyLockedIncomingRejection(currentUserId, leagueId, adminId);
                mainScenarioExecuted = true;
            }

            transferMarketService.passTurn(currentUserId);
        }

        assertTrue(wrongTurnChecked);
        if (scenario == WindowScenario.WAIVER
                || scenario == WindowScenario.DIRECT_TRANSFER_AND_IR
                || scenario == WindowScenario.CLUB_LIMIT_REJECTION
                || scenario == WindowScenario.LOCKED_PLAYER_REJECTION) {
            assertTrue(mainScenarioExecuted);
        }
        return irReplacement;
    }

    private void prepareWaiverPlan(long leagueId, int gameweek, int requestingUserId) {
        List<Integer> order = transferMarketService.getCurrentTurnOrder(requestingUserId, gameweek);
        assertFalse(order.isEmpty());
        int waiverUserId = order.getFirst();
        transferMarketService.setAttendancePreference(waiverUserId, gameweek, true);
        UserSquadEntity squad = requireGameData(waiverUserId).getNextSquad();
        int outgoingId = squad.getStartingLineup().getFirst();
        PlayerEntity outgoing = playerRepository.findById(outgoingId).orElseThrow();

        Set<Integer> ownRoster = rosterIds(squad, true);
        PlayerEntity ownedByAnotherManager = playerRepository
                .findAllById(allOwnedPlayerIds(leagueId))
                .stream()
                .filter(player -> !ownRoster.contains(player.getId()))
                .filter(player -> player.getPosition() == outgoing.getPosition())
                .findFirst()
                .orElseThrow();
        PlayerEntity validIncoming = findFreePlayerForUser(
                waiverUserId,
                leagueId,
                outgoing.getPosition(),
                Set.of()
        );

        var saved = waiverPlanService.savePlan(
                waiverUserId,
                gameweek,
                new SaveWaiverPlanRequest(List.of(
                        new WaiverEntryRequest(ownedByAnotherManager.getId(), outgoingId),
                        new WaiverEntryRequest(validIncoming.getId(), outgoingId)
                ))
        );
        assertEquals(2, saved.size());
        assertEquals(2, waiverPlanService.getPlan(waiverUserId, gameweek).size());
    }

    private void verifyManualTransferOrder(int adminId,
                                           int gameweek,
                                           List<Integer> managerIds) {
        List<Integer> manual = new ArrayList<>(managerIds.reversed());
        manual.addAll(managerIds);
        TurnOrderDto dto = new TurnOrderDto();
        dto.setOrder(manual);
        transferMarketService.setManualTurnOrder(adminId, gameweek, dto);
        assertEquals(manual, transferMarketService.getCurrentTurnOrder(adminId, gameweek));

        TurnOrderDto invalid = new TurnOrderDto();
        invalid.setOrder(List.of(adminId, adminId, adminId));
        assertThrows(IllegalArgumentException.class,
                () -> transferMarketService.setManualTurnOrder(adminId, gameweek, invalid));
    }

    private void performValidTransfer(int userId, long leagueId) {
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        int outgoingId = squad.getStartingLineup().getFirst();
        PlayerEntity outgoing = playerRepository.findById(outgoingId).orElseThrow();
        PlayerEntity incoming = findFreePlayerForUser(
                userId,
                leagueId,
                outgoing.getPosition(),
                Set.of()
        );
        TransferRequestDto request = transferRequest(userId, outgoingId, incoming.getId());
        transferMarketService.processTransfer(request);
        assertTrue(rosterIds(requireGameData(userId).getNextSquad(), false).contains(incoming.getId()));
        assertFalse(rosterIds(requireGameData(userId).getNextSquad(), false).contains(outgoingId));
    }

    private void verifyClubLimitRejection(int userId, long leagueId) {
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        List<PlayerEntity> roster = playerRepository.findAllById(rosterIds(squad, false));
        List<PlayerEntity> forcedClubPlayers = roster.subList(0, 3);
        Map<Integer, Integer> originalTeams = new HashMap<>();
        forcedClubPlayers.forEach(player -> {
            originalTeams.put(player.getId(), player.getTeamId());
            player.setTeamId(999);
        });

        PlayerEntity outgoing = roster.stream()
                .filter(player -> forcedClubPlayers.stream().noneMatch(forced -> forced.getId().equals(player.getId())))
                .findFirst()
                .orElseThrow();
        PlayerEntity incoming = findFreePlayerForUser(
                userId,
                leagueId,
                outgoing.getPosition(),
                Set.of()
        );
        int incomingOriginalTeam = incoming.getTeamId();
        incoming.setTeamId(999);
        playerRepository.saveAll(forcedClubPlayers);
        playerRepository.save(incoming);

        try {
            assertThrows(RuntimeException.class, () -> transferMarketService.processTransfer(
                    transferRequest(userId, outgoing.getId(), incoming.getId())
            ));
        } finally {
            forcedClubPlayers.forEach(player -> player.setTeamId(originalTeams.get(player.getId())));
            incoming.setTeamId(incomingOriginalTeam);
            playerRepository.saveAll(forcedClubPlayers);
            playerRepository.save(incoming);
        }
    }

    private void verifyLockedIncomingRejection(int userId, long leagueId, int adminId) {
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        int outgoingId = squad.getStartingLineup().getFirst();
        PlayerEntity outgoing = playerRepository.findById(outgoingId).orElseThrow();
        PlayerEntity incoming = findFreePlayerForUser(
                userId,
                leagueId,
                outgoing.getPosition(),
                Set.of()
        );
        leaguePlayerAdminService.setPlayerLocked(adminId, incoming.getId(), true);
        try {
            assertThrows(RuntimeException.class, () -> transferMarketService.processTransfer(
                    transferRequest(userId, outgoingId, incoming.getId())
            ));
        } finally {
            leaguePlayerAdminService.setPlayerLocked(adminId, incoming.getId(), false);
        }
    }

    private TransferRequestDto transferRequest(int userId, int outgoingId, int incomingId) {
        TransferRequestDto request = new TransferRequestDto();
        request.setUserId(userId);
        request.setPlayerOutId(outgoingId);
        request.setPlayerInId(incomingId);
        return request;
    }

    private void verifyLeagueStatAdjustments(int adminId,
                                             int regularManagerId,
                                             long leagueId,
                                             int playerId,
                                             int gameweek) {
        PlayerGameweekStatsEntity source = statsRepository
                .findByPlayer_IdAndGameweek(playerId, gameweek)
                .orElseThrow();

        UpdateAssistRequest assist = new UpdateAssistRequest();
        assist.setPlayerId(playerId);
        assist.setGameweek(gameweek);
        assist.setAction("ADD");
        assertThrows(AccessDeniedException.class,
                () -> leaguePlayerAdminService.updateAssist(regularManagerId, assist));
        PlayerAssistedDto assisted = leaguePlayerAdminService.updateAssist(adminId, assist);
        assertEquals(source.getAssists() + 1, assisted.getNumOfAssist());
        assist.setAction("REMOVE");
        assertEquals(source.getAssists(), leaguePlayerAdminService.updateAssist(adminId, assist).getNumOfAssist());
        assist.setAction("ADD");
        leaguePlayerAdminService.updateAssist(adminId, assist);

        UpdatePenaltyRequest penalty = new UpdatePenaltyRequest();
        penalty.setPlayerId(playerId);
        penalty.setGameweek(gameweek);
        penalty.setAction("ADD");
        PlayerPenaltyDto penalized = leaguePlayerAdminService.updatePenalty(adminId, penalty);
        assertEquals(source.getPenaltiesConceded() + 1, penalized.getPenaltiesConceded());
        penalty.setAction("REMOVE");
        assertEquals(
                source.getPenaltiesConceded(),
                leaguePlayerAdminService.updatePenalty(adminId, penalty).getPenaltiesConceded()
        );
        penalty.setAction("ADD");
        leaguePlayerAdminService.updatePenalty(adminId, penalty);

        LeagueEntity league = leagueRepository.findById(leagueId).orElseThrow();
        assertAll(
                () -> assertEquals(source.getAssists() + 1,
                        league.effectiveAssists(playerId, gameweek, source.getAssists())),
                () -> assertEquals(source.getPenaltiesConceded() + 1,
                        league.effectivePenaltiesConceded(
                                playerId,
                                gameweek,
                                source.getPenaltiesConceded()
                        ))
        );
    }

    private void verifySeasonResults(List<Integer> managerIds, long leagueId) {
        assertLeagueOwnershipUnique(leagueId);
        for (Integer managerId : managerIds) {
            assertAll(
                    () -> assertEquals(GAMEWEEK_COUNT, pointsService.getUserHistory(managerId).size()),
                    () -> assertTrue(pointsService.getUserTotalPoints(managerId) > 0),
                    () -> assertEquals(
                            pointsService.getUserHistory(managerId).getLast().getTotalPoints(),
                            pointsService.getUserTotalPoints(managerId)
                    )
            );
        }

        assertAll(
                () -> assertEquals((long) MANAGER_COUNT * GAMEWEEK_COUNT, userPointsRepository.count()),
                () -> assertEquals(GAMEWEEK_COUNT, dailyStatusRepository.count()),
                () -> assertEquals((long) playerRepository.count() * GAMEWEEK_COUNT, statsRepository.count()),
                () -> assertEquals(GAMEWEEK_COUNT + 1L, windowRepository.count()),
                () -> assertEquals((long) MANAGER_COUNT * (GAMEWEEK_COUNT + 1), squadRepository.count()),
                () -> assertEquals("FINISHED", gameWeekRepository.findById(37).orElseThrow().getStatus()),
                () -> assertEquals("LIVE", gameWeekRepository.findById(38).orElseThrow().getStatus()),
                () -> assertTrue(gameWeekRepository.findById(38).orElseThrow().isCalculated())
        );

        System.out.printf(
                "%nSEASON SIMULATION PASSED: managers=%d, draftPicks=%d, gameweeks=%d, "
                        + "userPointRows=%d, transferWindows=%d, syntheticStats=%d%n",
                MANAGER_COUNT,
                MANAGER_COUNT * 15,
                GAMEWEEK_COUNT,
                userPointsRepository.count(),
                windowRepository.count(),
                statsRepository.count()
        );
    }

    private void assertLeagueOwnershipUnique(long leagueId) {
        Set<Integer> allOwned = new HashSet<>();
        for (UserGameDataEntity data : gameDataRepository.findAllByLeagueIdWithSquads(leagueId)) {
            Set<Integer> roster = rosterIds(data.getNextSquad(), true);
            for (Integer playerId : roster) {
                assertTrue(allOwned.add(playerId), "Player " + playerId + " has duplicate ownership");
            }
        }
        assertEquals(MANAGER_COUNT * 15, allOwned.size());
    }

    private void verifyResetAndIdentityRestart() {
        SeasonResetService.ResetSummary reset = seasonResetService.resetAllData();
        assertTrue(reset.deletedRows() > 0);
        assertAll(
                () -> assertEquals(0, userRepository.count()),
                () -> assertEquals(0, leagueRepository.count()),
                () -> assertEquals(0, playerRepository.count()),
                () -> assertEquals(0, gameWeekRepository.count()),
                () -> assertEquals(0, fixtureRepository.count()),
                () -> assertEquals(0, squadRepository.count()),
                () -> assertEquals(0, statsRepository.count()),
                () -> assertEquals(0, windowRepository.count())
        );

        authService.register(new RegisterRequest(
                "First Manager After Reset",
                "after.reset",
                "after.reset@example.com",
                PASSWORD
        ));
        assertEquals(1, userRepository.findByUsername("after.reset").orElseThrow().getId());
        System.out.println("SEASON RESET PASSED: all simulation data removed and user identity restarted at 1");
    }

    private UserGameDataEntity requireGameData(int userId) {
        return gameDataRepository.findByUserId(userId).orElseThrow();
    }

    private PlayerEntity firstFreePlayer(PlayerPosition position, Set<Integer> excluded) {
        return playerRepository.findAll().stream()
                .sorted(Comparator.comparing(PlayerEntity::getId))
                .filter(player -> player.getPosition() == position)
                .filter(player -> !excluded.contains(player.getId()))
                .findFirst()
                .orElseThrow();
    }

    private PlayerEntity findFreePlayerForUser(int userId,
                                               long leagueId,
                                               PlayerPosition position,
                                               Set<Integer> excluded) {
        LeagueEntity league = leagueRepository.findById(leagueId).orElseThrow();
        Set<Integer> owned = allOwnedPlayerIds(leagueId);
        UserSquadEntity squad = requireGameData(userId).getNextSquad();
        Map<Integer, Long> clubCounts = playerRepository.findAllById(rosterIds(squad, false)).stream()
                .filter(player -> player.getTeamId() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        PlayerEntity::getTeamId,
                        java.util.stream.Collectors.counting()
                ));
        return playerRepository.findAll().stream()
                .sorted(Comparator.comparing(PlayerEntity::getId))
                .filter(player -> league.effectivePosition(player) == position)
                .filter(player -> !owned.contains(player.getId()))
                .filter(player -> !excluded.contains(player.getId()))
                .filter(player -> !league.isPlayerLocked(player.getId()))
                .filter(player -> player.getTeamId() == null
                        || clubCounts.getOrDefault(player.getTeamId(), 0L) < 3)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No free " + position + " player is available"));
    }

    private Set<Integer> allOwnedPlayerIds(long leagueId) {
        Set<Integer> owned = new HashSet<>();
        for (UserGameDataEntity data : gameDataRepository.findAllByLeagueIdWithSquads(leagueId)) {
            if (data.getNextSquad() != null) owned.addAll(rosterIds(data.getNextSquad(), true));
        }
        return owned;
    }

    private Set<Integer> rosterIds(UserSquadEntity squad, boolean includeIr) {
        Set<Integer> ids = new LinkedHashSet<>(squad.getStartingLineup());
        squad.getBenchMap().values().stream().filter(Objects::nonNull).forEach(ids::add);
        if (includeIr && squad.getIrId() != null) ids.add(squad.getIrId());
        return ids;
    }

    private enum WindowScenario {
        PASS_ONLY,
        DIRECT_TRANSFER_AND_IR,
        WAIVER,
        CLUB_LIMIT_REJECTION,
        LOCKED_PLAYER_REJECTION,
        IR_ONLY
    }

    private record IrCycle(int userId, int playerId) {}
}
