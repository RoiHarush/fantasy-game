package com.fantasy.config;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.transfer.TransferPickEntity;
import com.fantasy.domain.user.*;
import com.fantasy.application.*;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class StartupLoader {

    private final TeamService teamService;
    private final PlayerService playerService;
    private final GameWeekService gameWeekService;
    private final FixtureService fixtureService;
    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final UserSquadRepository squadRepo;
    private final LeagueRepository leagueRepo;
    private final GameWeekRepository gameWeekRepo;
    private final PlayerRegistry playerRegistry;
    private final Map<String, Integer> seededUserIds = new HashMap<>();
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public StartupLoader(TeamService teamService,
                         PlayerService playerService,
                         GameWeekService gameWeekService,
                         FixtureService fixtureService,
                         PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         UserGameDataRepository gameDataRepo,
                         UserRepository userRepo,
                         UserSquadRepository squadRepo,
                         LeagueRepository leagueRepo,
                         GameWeekRepository gameWeekRepo,
                         PlayerRegistry playerRegistry,
                         PasswordEncoder passwordEncoder) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.gameWeekService = gameWeekService;
        this.fixtureService = fixtureService;
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.squadRepo = squadRepo;
        this.leagueRepo = leagueRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.playerRegistry = playerRegistry;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void run() {
        System.out.println("=== STARTUP SEQUENCE BEGIN ===");

        loadStaticData();
        loadRegistries();

        seedUsersIfNeeded();
        ensureUserMapLoaded();

        createSuperAdminIfNeeded();

        updateUserPoints();
        seedUserSquads();
        seedInitialLeague();

        initializeTransferOrderForAllWeeks();

        System.out.println("=== STARTUP COMPLETE ===");
    }

    private void ensureUserMapLoaded() {
        if (seededUserIds.isEmpty() && userRepo.count() > 0) {
            List<UserEntity> users = userRepo.findAll();
            for (UserEntity user : users) {
                seededUserIds.put(user.getName(), user.getId());
            }

            if (!seededUserIds.containsKey("Tepper")) {
                System.out.println("⚠ Warning: 'Tepper' not found in DB map reload.");
            }
        }
    }

    private void loadStaticData() {
        System.out.println("Loading static data...");

        long teamsCount = teamService.countTeams();
        long playersCount = playerService.countPlayers();
        long fixturesCount = fixtureService.countFixtures();
        long gameweeksCount = gameWeekService.countGameweeks();

        if (teamsCount == 0) {
            System.out.println("→ Loading teams from API...");
            teamService.loadFromApiAndSave();
        } else {
            System.out.println("✔ Teams already exist (" + teamsCount + ")");
        }

        if (playersCount == 0) {
            System.out.println("→ Loading players from API...");
            playerService.loadPlayersFromApi();
            updatePlayersPhotosFromApi();
        } else {
            System.out.println("✔ Players already exist (" + playersCount + ")");
        }

        if (fixturesCount == 0) {
            System.out.println("→ Loading fixtures from API...");
            fixtureService.loadFromApiAndSave();
        } else {
            System.out.println("✔ Fixtures already exist (" + fixturesCount + ")");
        }

        if (gameweeksCount == 0) {
            System.out.println("→ Loading gameweeks from API...");
            gameWeekService.loadFromApiAndSave();
        } else {
            System.out.println("✔ Gameweeks already exist (" + gameweeksCount + ")");
        }
    }

    private void createSuperAdminIfNeeded() {
        String adminUsername = "sup-admin";
        if (!userRepo.existsByUsername(adminUsername)) {
            System.out.println("→ Creating SUPER_ADMIN user...");
            UserEntity adminUser = new UserEntity();
            adminUser.setName("Roi");
            adminUser.setUsername(adminUsername);
            adminUser.setPassword(passwordEncoder.encode("1234"));
            adminUser.setRole(UserRole.ROLE_SUPER_ADMIN);
            adminUser.setRegisteredAt(java.time.LocalDateTime.now());

            userRepo.save(adminUser);
            System.out.println("✔ SUPER_ADMIN created successfully.");
        }
    }

    private void seedUsersIfNeeded() {
        if (userRepo.count() == 0) {
            System.out.println("Seeding initial users...");
            createUser("Omri", "Hapoel Zidon United", Map.of(1, 31, 2, 31, 3, 31, 4, 31, 5, 31));
            createUser("Ifrah", "MONA LISA", Map.of(1, 35, 2, 35, 3, 35, 4, 35, 5, 35));
            createUser("Itamar", "SUSITA FC", Map.of(1, 36, 2, 35, 3, 35, 4, 35, 5, 35));
            createUser("Yakoel", "Yakoel FC", Map.of(1, 36, 2, 36, 3, 36, 4, 36, 5, 35));
            createUser("Tepper", "MACCABI TEPPER UTD", Map.of(1, 41, 2, 41, 3, 41, 4, 40, 5, 40));
            createUser("Eden", "Winner FC", Map.of(1, 41, 2, 41, 3, 41, 4, 41, 5, 40));
            createUser("Yaniv", "The Jews", Map.of(1, 41, 2, 41, 3, 41, 4, 41, 5, 40));
        }
    }

    private void createUser(String name, String teamName, Map<Integer, Integer> gwPoints) {
        UserEntity user = new UserEntity();
        user.setName(name);
        user.setUsername(name.toLowerCase());
        user.setPassword(passwordEncoder.encode("1234"));
        user.setRole(UserRole.ROLE_USER);
        user.setRegisteredAt(LocalDateTime.now());

        UserEntity savedUser = userRepo.save(user);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setUser(savedUser);
        gameData.setFantasyTeamName(teamName);
        gameData.setWatchedPlayers(new ArrayList<>());
        gameData.setChips(new HashMap<>(Map.of("FIRST_PICK_CAPTAIN", 1, "IR", 2)));
        gameData.setActiveChips(new HashMap<>(Map.of("FIRST_PICK_CAPTAIN", false, "IR", false)));

        List<UserPointsEntity> pointsList = new ArrayList<>();
        gwPoints.forEach((gw, pts) -> {
            UserPointsEntity upe = new UserPointsEntity();
            upe.setGameweek(gw);
            upe.setPoints(pts);
            upe.setUser(gameData);
            pointsList.add(upe);
        });

        gameData.setPointsByGameweek(pointsList);
        gameDataRepo.save(gameData);

        seededUserIds.put(name, savedUser.getId());
    }

    private void updateUserPoints() {
        Integer sampleUserId = seededUserIds.get("Tepper");
        if (sampleUserId != null) {
            var sampleGameData = gameDataRepo.findByUserId(sampleUserId);
            if (sampleGameData.isPresent() && sampleGameData.get().getTotalPoints() >= 244) {
                System.out.println("✔ User points already seeded (Skipping update).");
                return;
            }
        }

        System.out.println("Updating users’ total and GW1–5 points...");

        Map<String, Integer> totals = Map.of(
                "Tepper", 244,
                "Eden", 238,
                "Ifrah", 218,
                "Yakoel", 222,
                "Yaniv", 229,
                "Omri", 186,
                "Itamar", 205
        );

        for (var entry : totals.entrySet()) {
            String userName = entry.getKey();
            int total = entry.getValue();

            Integer userId = seededUserIds.get(userName);
            if (userId == null) {
                System.err.println("Could not find seeded user: " + userName);
                continue;
            }

            var gameData = gameDataRepo.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("UserGameData not found for: " + userName + " (ID: " + userId + ")"));

            var pointsList = gameData.getPointsByGameweek();
            if (pointsList == null || pointsList.isEmpty()) continue;

            int base = total / 5;
            int remainder = total % 5;

            List<UserPointsEntity> list = pointsList.stream()
                    .filter(p -> p.getGameweek() >= 1 && p.getGameweek() <= 5)
                    .sorted(Comparator.comparingInt(UserPointsEntity::getGameweek))
                    .toList();

            for (UserPointsEntity upe : list) {
                int gwPoints = base + (remainder > 0 ? 1 : 0);
                remainder = Math.max(0, remainder - 1);
                upe.setPoints(gwPoints);
            }

            gameData.setTotalPoints(total);
            gameDataRepo.save(gameData);
        }

        System.out.println("Users’ points updated successfully.");
    }

    private void seedUserSquads() {
        Integer sampleUserId = seededUserIds.get("Omri");
        if (sampleUserId != null) {
            boolean exists = squadRepo.findByUser_IdAndGameweek(sampleUserId, 6).isPresent();
            if (exists) {
                System.out.println("✔ User squads already seeded (Skipping GW 6-8 seed).");
                return;
            }
        }

        System.out.println("Seeding squads for GWs 6–8...");
        updateGW6();
        updateGW7();
        updateGW8();
    }

    private void updateSquad(int userId, int gameweek, List<Integer> startingLineup, List<Integer> bench,
                             Map<String, Integer> formation, Integer captainId, Integer viceCaptainId, Integer firstPickId) {

        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User game data not found for userId: " + userId));

        UserSquadEntity squad = squadRepo.findByUser_IdAndGameweek(gameData.getId(), gameweek).orElseGet(() -> {
            UserSquadEntity s = new UserSquadEntity();
            s.setUser(gameData);
            s.setGameweek(gameweek);
            return s;
        });

        squad.setStartingLineup(startingLineup);
        squad.setFormation(formation);
        squad.setCaptainId(captainId);
        squad.setViceCaptainId(viceCaptainId);
        squad.setFirstPickId(firstPickId);
        squad.setBenchMap(benchToMap(bench));

        UserSquadEntity savedSquad = squadRepo.save(squad);

        boolean isDataChanged = false;

        if (gameweek == 7) {
            gameData.setCurrentSquad(savedSquad);
            isDataChanged = true;
            System.out.println("Updated CurrentSquad (GW7) for user: " + userId);
        }

        else if (gameweek == 8) {
            gameData.setNextSquad(savedSquad);
            isDataChanged = true;
            System.out.println("Updated NextSquad (GW8) for user: " + userId);
        }

        if (isDataChanged) {
            gameDataRepo.save(gameData);
        }
    }

    private Map<String, Integer> benchToMap(List<Integer> bench) {
        Map<String, Integer> m = new LinkedHashMap<>();
        if (!bench.isEmpty()) m.put("GK", bench.get(0));
        if (bench.size() >= 2) m.put("S1", bench.get(1));
        if (bench.size() >= 3) m.put("S2", bench.get(2));
        if (bench.size() >= 4) m.put("S3", bench.get(3));
        return m;
    }

    private static Map<String, Integer> map(Object... kv) {
        Map<String, Integer> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], (Integer) kv[i + 1]);
        }
        return new LinkedHashMap<>(m);
    }

    private static List<Integer> list(Integer... ids) {
        return new ArrayList<>(Arrays.asList(ids));
    }

    private void updateGW6() {
        updateSquad(seededUserIds.get("Omri"), 6,
                list(64, 283, 97, 736, 6, 575, 408, 582, 515, 419, 382),
                list(220, 158, 317, 261),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                582, 736, 64);

        updateSquad(seededUserIds.get("Ifrah"), 6,
                list(597, 499, 525, 67, 36, 226, 508, 119, 717, 83, 414),
                list(469, 370, 17, 478),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                597, 717,499);

        updateSquad(seededUserIds.get("Itamar"), 6,
                list(430, 366, 74, 505, 224, 403, 238, 612, 384, 47, 427),
                list(628, 726, 38, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                427, 384,430);

        updateSquad(seededUserIds.get("Yakoel"), 6,
                list(666, 681, 314, 573, 7, 410, 374, 485, 669, 324, 299),
                list(733, 661, 260, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                299, 410,666);

        updateSquad(seededUserIds.get("Tepper"), 6,
                list(624, 654, 502, 291, 568, 5, 72, 449, 82, 120, 267),
                list(287, 235, 477, 338),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                82, 449, 235);

        updateSquad(seededUserIds.get("Eden"), 6,
                list(311, 249, 136, 1, 371, 411, 569, 418, 381, 266, 160),
                list(32, 476, 453, 256),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                249, 418, 381);

        updateSquad(seededUserIds.get("Yaniv"), 6,
                list(691, 714, 565, 373, 8, 12, 16, 450, 236, 157, 237),
                list(253, 258, 596, 402),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                450, 565, 16);
    }
    private void updateGW7() {
        updateSquad(seededUserIds.get("Omri"), 7,
                list(64, 283, 97, 736, 6, 575, 408, 582, 50, 21, 158),
                list(220, 382, 261, 317),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                6, 582, 64);

        updateSquad(seededUserIds.get("Ifrah"), 7,
                list(597, 499, 67, 36, 407, 478, 119, 717, 387, 414, 17),
                list(469, 370, 508, 525),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                119, 597,499);

        updateSquad(seededUserIds.get("Itamar"), 7,
                list(430, 367, 74, 38, 224, 403, 238, 712, 384, 47, 427),
                list(366, 726, 505, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                47, 427,430);

        updateSquad(seededUserIds.get("Yakoel"), 7,
                list(666, 681, 733, 260, 7, 258, 374, 485, 84, 324, 299),
                list(314, 661, 573, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                485, 681,666);

        updateSquad(seededUserIds.get("Tepper"), 7,
                list(624, 654, 287, 291, 72, 5, 436, 449, 82, 120, 267),
                list(139, 235, 338, 568),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                449, 82,235);

        updateSquad(seededUserIds.get("Eden"), 7,
                list(249, 136, 1, 256, 411, 476, 418, 381, 266, 160, 200),
                list(32, 625, 569, 371),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                266, 160,381);

        updateSquad(seededUserIds.get("Yaniv"), 7,
                list(691, 714, 253, 373, 8, 41, 145, 16, 450, 236, 237),
                list(565, 596, 402, 157),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                714, 450,16);
    }
    private void updateGW8() {
        updateSquad(seededUserIds.get("Omri"), 8,
                list(64, 283, 97, 220, 6, 408, 317, 382, 582, 21, 50),
                list(736, 158, 575, 261),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                21, 6, 64);

        updateSquad(seededUserIds.get("Ifrah"), 8,
                list(597, 499, 67, 36, 407, 478, 119, 717, 387, 414, 17),
                list(469, 370, 508, 525),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                119, 597,499);

        updateSquad(seededUserIds.get("Itamar"), 8,
                list(430, 367, 74, 38, 224, 403, 238, 712, 384, 47, 427),
                list(366, 726, 505, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                47, 427,430);

        updateSquad(seededUserIds.get("Yakoel"), 8,
                list(666, 681, 733, 260, 7, 258, 374, 485, 84, 324, 299),
                list(314, 661, 573, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                485, 681,666);

        updateSquad(seededUserIds.get("Tepper"), 8,
                list(624, 654, 287, 291, 72, 5, 436, 449, 82, 120, 267),
                list(139, 235, 338, 568),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                449, 82,235);

        updateSquad(seededUserIds.get("Eden"), 8,
                list(249, 136, 1, 256, 476, 411, 418, 381, 266, 160, 200),
                list(32, 569, 371, 625),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                266, 160,381);

        updateSquad(seededUserIds.get("Yaniv"), 8,
                list(691, 714, 253, 373, 8, 41, 16, 450, 236, 157, 237),
                list(565, 145, 596, 402),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                714, 450,16);
    }

    private void seedInitialLeague() {
        if (leagueRepo.count() > 0) {
            System.out.println("✔ League already exists.");
            return;
        }

        if (leagueRepo.count() == 0) {
            System.out.println("Seeding initial league...");
            LeagueEntity league = new LeagueEntity();
            league.setName("Fantasy Draft 2025/26");
            league.setLeagueCode("123ABC");

            Integer adminId = seededUserIds.get("Omri");
            if (adminId == null) {
                throw new RuntimeException("Could not find seeded admin user 'Omri' to create league.");
            }

            UserEntity adminUser = userRepo.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Admin user entity not found in DB, even though it was seeded."));

            league.setAdmin(adminUser);

            List<UserEntity> allUsers = userRepo.findAll();
            allUsers.removeIf(u -> u.getUsername().equals("sup-admin"));
            league.setUsers(allUsers);

            leagueRepo.save(league);
        }
    }

    public void loadRegistries() {
        System.out.println("Loading registries to memory...");

        var players = playerRepo.findAll().stream()
                .map(p -> PlayerMapper.toDomain(p, pointsRepo.findByPlayer_Id(p.getId())))
                .toList();

        playerRegistry.addMany(players);
        System.out.println("✔ Finish loading Players to Registry");
    }

    private void updatePlayersPhotosFromApi() {
        System.out.println("🖼️ Updating player photos using FPL code field...");

        try {
            String url = "https://fantasy.premierleague.com/api/bootstrap-static/";
            var mapper = new ObjectMapper();
            var root = mapper.readTree(new URL(url));
            var elements = root.get("elements");

            Map<Integer, String> apiCodes = new HashMap<>();
            for (JsonNode e : elements) {
                int id = e.get("id").asInt();
                String code = e.get("code").asText(null);
                if (code != null && !code.isBlank()) {
                    apiCodes.put(id, code);
                }
            }

            List<PlayerEntity> players = playerRepo.findAll();
            int updated = 0;

            for (PlayerEntity player : players) {
                String code = apiCodes.get(player.getId());
                if (code != null && !code.equals(player.getPhoto())) {
                    player.setPhoto(code);
                    updated++;
                }
            }

            if (updated > 0) {
                playerRepo.saveAll(players);
            }

            System.out.println("✔ Updated photo codes for " + updated + " players.");

        } catch (Exception e) {
            System.err.println("❌ Failed to update player photos: " + e.getMessage());
        }
    }

    @Transactional
    public void initializeTransferOrderForAllWeeks() {
        List<String> currentOrderNames = new ArrayList<>(List.of(
                "Eden",
                "Omri",
                "Yakoel",
                "Ifrah",
                "Yaniv",
                "Tepper",
                "Itamar"
        ));

        List<Integer> currentOrderIds = currentOrderNames.stream()
                .map(name -> seededUserIds.get(name))
                .collect(Collectors.toCollection(ArrayList::new));

        for (int gwId = 8; gwId <= 38; gwId++) {
            int currentGwId = gwId;

            var gameWeek = gameWeekRepo.findById(currentGwId)
                    .orElseThrow(() -> new RuntimeException("GameWeek not found: " + currentGwId));

            if (gameWeek.getTransferOrder() != null && !gameWeek.getTransferOrder().isEmpty()) {
                System.out.println("⚠ Transfer order for GW" + currentGwId + " already exists. Skipping generation, BUT rotating logic continues.");
                Collections.rotate(currentOrderIds, -1);
                continue;
            }

            List<TransferPickEntity> picks = new ArrayList<>();
            int positionCounter = 0;

            for (int i = 0; i < currentOrderIds.size(); i++) {
                TransferPickEntity pick = new TransferPickEntity();
                pick.setPosition(positionCounter++);
                pick.setUserId(currentOrderIds.get(i));
                pick.setGameWeek(gameWeek);
                picks.add(pick);
            }

            for (int i = currentOrderIds.size() - 1; i >= 0; i--) {
                TransferPickEntity pick = new TransferPickEntity();
                pick.setPosition(positionCounter++);
                pick.setUserId(currentOrderIds.get(i));
                pick.setGameWeek(gameWeek);
                picks.add(pick);
            }

            if (gameWeek.getTransferOrder() == null) {
                gameWeek.setTransferOrder(new ArrayList<>());
            }
            gameWeek.getTransferOrder().clear();
            gameWeek.getTransferOrder().addAll(picks);
            // -----------------------

            gameWeekRepo.save(gameWeek);

            System.out.println("✅ Initialized GW" + currentGwId + ". First picker: " + currentOrderIds.get(0));

            Collections.rotate(currentOrderIds, -1);
        }
    }
}