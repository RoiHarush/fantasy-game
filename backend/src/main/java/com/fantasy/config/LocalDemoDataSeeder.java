package com.fantasy.config;

import com.fantasy.application.ReferenceDataBootstrapService;
import com.fantasy.domain.game.GameWeekDto;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueScoringRules;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.ChipNames;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsEntity;
import com.fantasy.domain.team.UserPointsRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import com.fantasy.domain.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Creates a complete, disposable local league for visual development.
 *
 * <p>The runner is both dev-profile-only and explicitly opt-in, so it can never
 * seed production accidentally. It is idempotent and reuses the same local
 * users, league and squads on later restarts.</p>
 */
@Component
@Profile("dev")
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(name = "app.dev-demo.enabled", havingValue = "true")
public class LocalDemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDemoDataSeeder.class);
    private static final String LEAGUE_CODE = "LOCAL1";
    private static final String PRIMARY_USERNAME = "demo";
    private static final List<DemoManager> MANAGERS = List.of(
            new DemoManager(PRIMARY_USERNAME, "Demo", "Manager", "Design United", 184),
            new DemoManager("alex.demo", "Alex", "Morgan", "Pixel Athletic", 163),
            new DemoManager("maya.demo", "Maya", "Cohen", "Gradient City", 151),
            new DemoManager("noam.demo", "Noam", "Levi", "Component Rovers", 137)
    );
    private static final Map<PlayerPosition, Integer> ROSTER_LIMITS = Map.of(
            PlayerPosition.GOALKEEPER, 2,
            PlayerPosition.DEFENDER, 5,
            PlayerPosition.MIDFIELDER, 5,
            PlayerPosition.FORWARD, 3
    );

    private final ReferenceDataBootstrapService bootstrapService;
    private final UserRepository userRepository;
    private final LeagueRepository leagueRepository;
    private final UserGameDataRepository gameDataRepository;
    private final UserSquadRepository squadRepository;
    private final UserPointsRepository pointsRepository;
    private final PlayerRepository playerRepository;
    private final GameWeekService gameWeekService;
    private final PasswordEncoder passwordEncoder;
    private final String password;

    public LocalDemoDataSeeder(ReferenceDataBootstrapService bootstrapService,
                               UserRepository userRepository,
                               LeagueRepository leagueRepository,
                               UserGameDataRepository gameDataRepository,
                               UserSquadRepository squadRepository,
                               UserPointsRepository pointsRepository,
                               PlayerRepository playerRepository,
                               GameWeekService gameWeekService,
                               PasswordEncoder passwordEncoder,
                               @Value("${app.dev-demo.password}") String password) {
        this.bootstrapService = bootstrapService;
        this.userRepository = userRepository;
        this.leagueRepository = leagueRepository;
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.pointsRepository = pointsRepository;
        this.playerRepository = playerRepository;
        this.gameWeekService = gameWeekService;
        this.passwordEncoder = passwordEncoder;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Preparing opt-in local demo league");
        var referenceData = bootstrapService.bootstrapMissingData();

        List<UserEntity> users = MANAGERS.stream().map(this::findOrCreateUser).toList();
        LeagueEntity league = findOrCreateLeague(users);
        List<PlayerEntity> players = playerRepository.findAll().stream()
                .sorted(Comparator.comparingInt(PlayerEntity::getTotalPoints).reversed()
                        .thenComparing(PlayerEntity::getId))
                .toList();

        int displayGameweek = resolveDisplayGameweek();
        int nextGameweek = resolveNextGameweek(displayGameweek);
        Set<Integer> usedPlayerIds = new HashSet<>();

        for (int index = 0; index < users.size(); index++) {
            UserEntity user = users.get(index);
            DemoManager manager = MANAGERS.get(index);
            UserGameDataEntity gameData = findOrCreateGameData(user, league, manager);
            Roster roster = allocateRoster(players, usedPlayerIds);

            UserSquadEntity displaySquad = upsertSquad(gameData, displayGameweek, roster);
            UserSquadEntity nextSquad = nextGameweek == displayGameweek
                    ? displaySquad
                    : upsertSquad(gameData, nextGameweek, roster);

            gameData.setCurrentSquad(displaySquad);
            gameData.setNextSquad(nextSquad);
            gameData.setTotalPoints(manager.totalPoints());
            gameDataRepository.save(gameData);
            upsertPoints(gameData, displayGameweek, Math.max(24, manager.totalPoints() / 3));
        }

        log.info(
                "Local demo ready: username={}, league={}, managers={}, players={}, gameweek={}",
                PRIMARY_USERNAME,
                league.getName(),
                users.size(),
                referenceData.players(),
                displayGameweek
        );
    }

    private UserEntity findOrCreateUser(DemoManager manager) {
        return userRepository.findByUsername(manager.username()).orElseGet(() -> {
            UserEntity user = new UserEntity();
            user.setUsername(manager.username());
            user.setEmail(manager.username() + "@local.test");
            user.setEmailVerified(true);
            user.setPassword(passwordEncoder.encode(password));
            user.setFirstName(manager.firstName());
            user.setLastName(manager.lastName());
            user.setName(manager.firstName() + " " + manager.lastName());
            user.setRole(UserRole.ROLE_USER);
            user.setRegisteredAt(LocalDateTime.now());
            return userRepository.save(user);
        });
    }

    private LeagueEntity findOrCreateLeague(List<UserEntity> users) {
        LeagueEntity league = leagueRepository.findByLeagueCodeIgnoreCase(LEAGUE_CODE)
                .orElseGet(LeagueEntity::new);
        league.setName("Local Design League");
        league.setLeagueCode(LEAGUE_CODE);
        league.setAdmin(users.getFirst());
        league.setUsers(new ArrayList<>(users));
        league.setMaxParticipants(users.size());
        league.setScoringRules(LeagueScoringRules.defaults());
        league.setStatus(LeagueStatus.ACTIVE);
        return leagueRepository.save(league);
    }

    private UserGameDataEntity findOrCreateGameData(UserEntity user,
                                                     LeagueEntity league,
                                                     DemoManager manager) {
        UserGameDataEntity gameData = gameDataRepository.findByUserId(user.getId())
                .orElseGet(UserGameDataEntity::new);
        gameData.setUser(user);
        gameData.setLeague(league);
        gameData.setFantasyTeamName(manager.teamName());
        gameData.setChips(new HashMap<>(Map.of(
                ChipNames.FIRST_PICK_CAPTAIN, 1,
                ChipNames.TRIPLE_CAPTAIN, 1,
                ChipNames.BENCH_BOOST, 1,
                ChipNames.IR, 2
        )));
        gameData.setActiveChips(new HashMap<>(Map.of(
                ChipNames.FIRST_PICK_CAPTAIN, false,
                ChipNames.TRIPLE_CAPTAIN, false,
                ChipNames.BENCH_BOOST, false,
                ChipNames.IR, false
        )));
        return gameDataRepository.save(gameData);
    }

    private int resolveDisplayGameweek() {
        GameWeekDto current = gameWeekService.getCurrentGameweek();
        if (current != null) return current.getId();
        GameWeekDto next = gameWeekService.getNextGameweek();
        if (next != null) return next.getId();
        throw new IllegalStateException("Local demo requires at least one current or upcoming gameweek");
    }

    private int resolveNextGameweek(int displayGameweek) {
        GameWeekDto next = gameWeekService.getNextGameweek();
        return next == null ? displayGameweek : next.getId();
    }

    private Roster allocateRoster(List<PlayerEntity> allPlayers, Set<Integer> usedPlayerIds) {
        Map<PlayerPosition, List<Integer>> byPosition = new EnumMap<>(PlayerPosition.class);
        Map<Integer, Integer> clubCounts = new HashMap<>();

        for (PlayerPosition position : PlayerPosition.values()) {
            int required = ROSTER_LIMITS.get(position);
            List<Integer> selected = allPlayers.stream()
                    .filter(player -> player.getPosition() == position)
                    .filter(player -> !usedPlayerIds.contains(player.getId()))
                    .filter(player -> player.getTeamId() == null
                            || clubCounts.getOrDefault(player.getTeamId(), 0) < 3)
                    .limit(required)
                    .map(player -> {
                        usedPlayerIds.add(player.getId());
                        if (player.getTeamId() != null) {
                            clubCounts.merge(player.getTeamId(), 1, Integer::sum);
                        }
                        return player.getId();
                    })
                    .toList();
            if (selected.size() != required) {
                throw new IllegalStateException("Not enough unowned " + position + " players for local demo squads");
            }
            byPosition.put(position, selected);
        }

        List<Integer> starters = new ArrayList<>();
        starters.add(byPosition.get(PlayerPosition.GOALKEEPER).get(0));
        starters.addAll(byPosition.get(PlayerPosition.DEFENDER).subList(0, 4));
        starters.addAll(byPosition.get(PlayerPosition.MIDFIELDER).subList(0, 4));
        starters.addAll(byPosition.get(PlayerPosition.FORWARD).subList(0, 2));

        Map<String, Integer> bench = new LinkedHashMap<>();
        bench.put("GK", byPosition.get(PlayerPosition.GOALKEEPER).get(1));
        bench.put("S1", byPosition.get(PlayerPosition.DEFENDER).get(4));
        bench.put("S2", byPosition.get(PlayerPosition.MIDFIELDER).get(4));
        bench.put("S3", byPosition.get(PlayerPosition.FORWARD).get(2));

        Map<String, Integer> formation = new LinkedHashMap<>();
        formation.put("GK", 1);
        formation.put("DEF", 4);
        formation.put("MID", 4);
        formation.put("FWD", 2);

        return new Roster(
                starters,
                bench,
                formation,
                byPosition.get(PlayerPosition.MIDFIELDER).get(0),
                byPosition.get(PlayerPosition.FORWARD).get(0)
        );
    }

    private UserSquadEntity upsertSquad(UserGameDataEntity gameData,
                                        int gameweek,
                                        Roster roster) {
        UserSquadEntity squad = squadRepository.findByUser_IdAndGameweek(gameData.getId(), gameweek)
                .orElseGet(UserSquadEntity::new);
        squad.setUser(gameData);
        squad.setGameweek(gameweek);
        squad.setStartingLineup(new ArrayList<>(roster.starters()));
        squad.setBenchMap(new LinkedHashMap<>(roster.bench()));
        squad.setFormation(new LinkedHashMap<>(roster.formation()));
        squad.setCaptainId(roster.captainId());
        squad.setViceCaptainId(roster.viceCaptainId());
        squad.setFirstPickId(null);
        squad.setIrId(null);
        squad.setAutoSubsApplied(false);
        squad.setTripleCaptainActive(false);
        squad.setBenchBoostActive(false);
        return squadRepository.save(squad);
    }

    private void upsertPoints(UserGameDataEntity gameData, int gameweek, int points) {
        UserPointsEntity entity = pointsRepository.findByUser_IdAndGameweek(gameData.getId(), gameweek)
                .orElseGet(UserPointsEntity::new);
        entity.setUser(gameData);
        entity.setGameweek(gameweek);
        entity.setPoints(points);
        pointsRepository.save(entity);
    }

    private record DemoManager(String username,
                               String firstName,
                               String lastName,
                               String teamName,
                               int totalPoints) {}

    private record Roster(List<Integer> starters,
                          Map<String, Integer> bench,
                          Map<String, Integer> formation,
                          int captainId,
                          int viceCaptainId) {}
}
