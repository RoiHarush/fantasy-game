package com.fantasy.config;

import com.fantasy.domain.league.League;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.transfer.TransferPickEntity;
import com.fantasy.domain.user.*;
import com.fantasy.dto.GameWeekDto;
import com.fantasy.main.InMemoryData;
import com.fantasy.application.*;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.URL;
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
    private final UserRepository userRepo;
    private final UserSquadRepository squadRepo;
    private final LeagueRepository leagueRepo;
    private final GameWeekRepository gameWeekRepo;

    @Autowired
    public StartupLoader(TeamService teamService,
                         PlayerService playerService,
                         GameWeekService gameWeekService,
                         FixtureService fixtureService,
                         PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         UserRepository userRepo,
                         UserSquadRepository squadRepo,
                         LeagueRepository leagueRepo,
                         GameWeekRepository gameWeekRepo) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.gameWeekService = gameWeekService;
        this.fixtureService = fixtureService;
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.userRepo = userRepo;
        this.squadRepo = squadRepo;
        this.leagueRepo = leagueRepo;
        this.gameWeekRepo = gameWeekRepo;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void run() {
        System.out.println("=== STARTUP SEQUENCE BEGIN ===");

        loadStaticData();
//        seedUsersIfNeeded();
//        updateUserPoints();
//        seedUserSquads();
//        seedInitialLeague();
//        initializeTransferOrderForGW8();
        loadToMemory();
//        printAll();

        System.out.println("=== STARTUP COMPLETE ===");
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


    private void seedUsersIfNeeded() {
        if (userRepo.count() == 0) {
            System.out.println("Seeding initial users...");
            createUser(1, "Omri", "Hapoel Zidon United", Map.of(1, 31, 2, 31, 3, 31, 4, 31, 5, 31), 155);
            createUser(2, "Ifrah", "MONA LISA", Map.of(1, 35, 2, 35, 3, 35, 4, 35, 5, 35), 175);
            createUser(3, "Itamar", "SUSITA FC", Map.of(1, 36, 2, 35, 3, 35, 4, 35, 5, 35), 176);
            createUser(4, "Yakoel", "Yakoel FC", Map.of(1, 36, 2, 36, 3, 36, 4, 36, 5, 35), 179);
            createUser(5, "Tepper", "MACCABI TEPPER UTD", Map.of(1, 41, 2, 41, 3, 41, 4, 40, 5, 40), 203);
            createUser(6, "Eden", "Winner FC", Map.of(1, 41, 2, 41, 3, 41, 4, 41, 5, 40), 204);
            createUser(7, "Yaniv", "The Jews", Map.of(1, 41, 2, 41, 3, 41, 4, 41, 5, 40), 204);
        }
    }

    private void createUser(int id, String name, String teamName, Map<Integer, Integer> gwPoints, int totalPoints) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName(name);
        user.setUsername(name.toLowerCase());
        user.setPassword("1234");
        user.setFantasyTeamName(teamName);
        user.setWatchedPlayers(new ArrayList<>());
        user.setTotalPoints(totalPoints);

        List<UserPointsEntity> pointsList = new ArrayList<>();
        gwPoints.forEach((gw, pts) -> {
            UserPointsEntity upe = new UserPointsEntity();
            upe.setGameweek(gw);
            upe.setPoints(pts);
            upe.setUser(user);
            pointsList.add(upe);
        });

        user.setPointsByGameweek(pointsList);
        userRepo.save(user);
    }

    private void updateUserPoints() {
        System.out.println("Updating users’ total and GW1–5 points...");

        Map<Integer, Integer> totals = Map.of(
                5, 244,
                6, 238,
                2, 218,
                4, 222,
                7, 229,
                1, 186,
                3, 205
        );

        for (var entry : totals.entrySet()) {
            int userId = entry.getKey();
            int total = entry.getValue();

            var user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            var pointsList = user.getPointsByGameweek();
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

            user.setTotalPoints(total);
            userRepo.save(user);
        }

        System.out.println("Users’ points updated successfully.");
    }

    private void seedUserSquads() {
        System.out.println("Seeding squads for GWs 6–8...");
        updateGW6();
        updateGW7();
        updateGW8();
    }

    private void updateSquad(int userId, int gameweek, List<Integer> startingLineup, List<Integer> bench,
                             Map<String, Integer> formation, Integer captainId, Integer viceCaptainId, Integer firstPickId) {
        UserEntity user = userRepo.findById(userId).orElseThrow();
        UserSquadEntity squad = squadRepo.findByUser_IdAndGameweek(userId, gameweek).orElseGet(() -> {
            UserSquadEntity s = new UserSquadEntity();
            s.setUser(user);
            s.setGameweek(gameweek);
            return s;
        });

        squad.setStartingLineup(startingLineup);
        squad.setFormation(formation);
        squad.setCaptainId(captainId);
        squad.setViceCaptainId(viceCaptainId);
        squad.setFirstPickId(firstPickId);
        squad.setBenchMap(benchToMap(bench));

        squadRepo.save(squad);
    }

    private Map<String, Integer> benchToMap(List<Integer> bench) {
        Map<String, Integer> m = new LinkedHashMap<>();
        if (bench.size() >= 1) m.put("GK", bench.get(0));
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
        updateSquad(1, 6,
                list(64, 283, 97, 736, 6, 575, 408, 582, 515, 419, 382),
                list(220, 158, 317, 261),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                582, 736, 64);

        updateSquad(2, 6,
                list(597, 499, 525, 67, 36, 226, 508, 119, 717, 83, 414),
                list(469, 370, 17, 478),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                597, 717,499);

        updateSquad(3, 6,
                list(430, 366, 74, 505, 224, 403, 238, 612, 384, 47, 427),
                list(628, 726, 38, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                427, 384,430);

        updateSquad(4, 6,
                list(666, 681, 314, 573, 7, 410, 374, 485, 669, 324, 299),
                list(733, 661, 260, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                299, 410,666);

        updateSquad(5, 6,
                list(624, 654, 502, 291, 568, 5, 72, 449, 82, 120, 267),
                list(287, 235, 477, 338),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                82, 449, 235);

        updateSquad(6, 6,
                list(311, 249, 136, 1, 371, 411, 569, 418, 381, 266, 160),
                list(32, 476, 453, 256),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                249, 418, 381);

        updateSquad(7, 6,
                list(691, 714, 565, 373, 8, 12, 16, 450, 236, 157, 237),
                list(253, 258, 596, 402),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                450, 565, 16);
    }
    private void updateGW7() {
        updateSquad(1, 7,
                list(64, 283, 97, 736, 6, 575, 408, 582, 50, 21, 158),
                list(220, 382, 261, 317),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                6, 582, 64);

        updateSquad(2, 7,
                list(597, 499, 67, 36, 407, 478, 119, 717, 387, 414, 17),
                list(469, 370, 508, 525),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                119, 597,499);

        updateSquad(3, 7,
                list(430, 367, 74, 38, 224, 403, 238, 712, 384, 47, 427),
                list(366, 726, 505, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                47, 427,430);

        updateSquad(4, 7,
                list(666, 681, 733, 260, 7, 258, 374, 485, 84, 324, 299),
                list(314, 661, 573, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                485, 681,666);

        updateSquad(5, 7,
                list(624, 654, 287, 291, 72, 5, 436, 449, 82, 120, 267),
                list(139, 235, 338, 568),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                449, 82,235);

        updateSquad(6, 7,
                list(249, 136, 1, 256, 411, 476, 418, 381, 266, 160, 200),
                list(32, 625, 569, 371),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                266, 160,381);

        updateSquad(7, 7,
                list(691, 714, 253, 373, 8, 41, 145, 16, 450, 236, 237),
                list(565, 596, 402, 157),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                714, 450,16);
    }
    private void updateGW8() {
        updateSquad(1, 8,
                list(64, 283, 97, 220, 6, 408, 317, 382, 582, 21, 50),
                list(736, 158, 575, 261),
                map("FWD", 3, "GK", 1, "DEF", 3, "MID", 4),
                21, 6, 64);

        updateSquad(2, 8,
                list(597, 499, 67, 36, 407, 478, 119, 717, 387, 414, 17),
                list(469, 370, 508, 525),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                119, 597,499);

        updateSquad(3, 8,
                list(430, 367, 74, 38, 224, 403, 238, 712, 384, 47, 427),
                list(366, 726, 505, 135),
                map("FWD", 1, "GK", 1, "DEF", 4, "MID", 5),
                47, 427,430);

        updateSquad(4, 8,
                list(666, 681, 733, 260, 7, 258, 374, 485, 84, 324, 299),
                list(314, 661, 573, 413),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                485, 681,666);

        updateSquad(5, 8,
                list(624, 654, 287, 291, 72, 5, 436, 449, 82, 120, 267),
                list(139, 235, 338, 568),
                map("FWD", 2, "GK", 1, "DEF", 4, "MID", 4),
                449, 82,235);

        updateSquad(6, 8,
                list(249, 136, 1, 256, 476, 411, 418, 381, 266, 160, 200),
                list(32, 569, 371, 625),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                266, 160,381);

        updateSquad(7, 8,
                list(691, 714, 253, 373, 8, 41, 16, 450, 236, 157, 237),
                list(565, 145, 596, 402),
                map("FWD", 2, "GK", 1, "DEF", 3, "MID", 5),
                714, 450,16);
    }

    private void seedInitialLeague() {
        if (leagueRepo.count() == 0) {
            System.out.println("Seeding initial league for GW7...");
            LeagueEntity league = new LeagueEntity();
            league.setName("Fantasy Draft 2025/26");
            league.setLeagueCode("123ABC");
            league.setAdmin(userRepo.findById(1).orElseThrow());
            league.setUsers(userRepo.findAll());
            leagueRepo.save(league);
        }
    }

    public void loadToMemory() {
        System.out.println("Loading entities to memory...");

        PlayerRegistry playerRegistry = new PlayerRegistry();
        var players = playerRepo.findAll().stream()
                .map(p -> PlayerMapper.toDomain(p, pointsRepo.findByPlayer_Id(p.getId())))
                .toList();
        playerRegistry.addMany(players);
        InMemoryData.setPlayers(playerRegistry);
        System.out.println("Finish load Players");

        int currentGw = gameWeekService.getCurrentGameweek().getId();
        int nextGw = gameWeekService.getNextGameweek().getId();

        FantasyUserRegistry userRegistry = new FantasyUserRegistry();

        var allSquads = squadRepo.findAllByGameweeks(List.of(currentGw, nextGw))
                .stream()
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));


        var users = userRepo.findAllWithRelations().stream()
                .map(e -> {
                    var squads = allSquads.getOrDefault(e.getId(), List.of());
                    UserSquadEntity currentSquad = squads.stream()
                            .filter(s -> s.getGameweek() == currentGw)
                            .findFirst()
                            .orElse(null);
                    UserSquadEntity nextSquad = squads.stream()
                            .filter(s -> s.getGameweek() == nextGw)
                            .findFirst()
                            .orElse(null);

                    if (e.getChips() == null) {
                        e.setChips(Map.of("FIRST_PICK_CAPTAIN", 1, "IR", 2));
                    }

                    return UserMapper.toDomain(e, currentSquad, nextSquad, InMemoryData.getPlayers());
                })
                .toList();


        userRegistry.addMany(users);
        InMemoryData.setUsers(userRegistry);
        System.out.println("Finish load Users");


        GameWeekDto liveGw = gameWeekService.getCurrentGameweek();
        if (liveGw != null && "LIVE".equalsIgnoreCase(liveGw.getStatus())) {
            LeagueEntity baseLeague = leagueRepo.findAll().getFirst();
            League liveLeague = new League(
                    UserMapper.toDomain(
                            baseLeague.getAdmin(),
                            baseLeague.getAdmin().getCurrentSquad(),
                            baseLeague.getAdmin().getNextSquad(),
                            InMemoryData.getPlayers()
                    ),
                    baseLeague.getName(),
                    baseLeague.getLeagueCode()
            );

            List<User> domainUsers = userRepo.findAll().stream()
                    .filter(u -> u.getId() != baseLeague.getAdmin().getId())
                    .map(u -> UserMapper.toDomain(
                            u,
                            u.getCurrentSquad(),
                            u.getNextSquad(),
                            InMemoryData.getPlayers()
                    ))
                    .toList();

            liveLeague.getUsers().addAll(domainUsers);

            liveLeague.sortUsers();
            InMemoryData.setActiveLeague(liveLeague);
        }

        System.out.println("Data loaded into memory successfully.");
    }

    private void printAll() {
        GameWeekDto liveGw = gameWeekService.getCurrentGameweek();

        if (liveGw == null || !"LIVE".equalsIgnoreCase(liveGw.getStatus())) {
            System.out.println("❌ No LIVE gameweek at the moment.");
            return;
        }

        System.out.println("🟢 Current LIVE Gameweek: " + liveGw.getName() + " (ID: " + liveGw.getId() + ")");

        var gwEntity = gameWeekRepo.findById(liveGw.getId()).orElse(null);
        if (gwEntity == null) {
            System.out.println("⚠️ GameWeek entity not found in DB for ID " + liveGw.getId());
            return;
        }

        var order = gwEntity.getTransferOrder();
        if (order == null || order.isEmpty()) {
            System.out.println("❌ No transfer order defined for GW" + liveGw.getId());
        } else {
            System.out.println("✅ Transfer order for GW" + liveGw.getId() + ": " + order);
        }


        System.out.println("\n===== CURRENT LIVE GAMEWEEK =====");
        System.out.println("ID: " + liveGw.getId() + " | Name: " + liveGw.getName() + " | Status: " + liveGw.getStatus());
        System.out.println("=================================\n");

        List<UserEntity> allUsers = userRepo.findAll();

        for (UserEntity user : allUsers) {
            System.out.println("👤 USER: " + user.getName() + " (" + user.getFantasyTeamName() + ")");

            UserSquadEntity currentSquad = user.getNextSquad();
            if (currentSquad == null) {
                System.out.println("  ⚠️ No current squad found.\n");
                continue;
            }

            // === Starting lineup ===
            List<Integer> startingIds = currentSquad.getStartingLineup();
            List<PlayerEntity> startingPlayers = playerRepo.findAllById(startingIds);

            Map<String, List<PlayerEntity>> byPosition = new HashMap<>();
            for (PlayerEntity p : startingPlayers) {
                byPosition.computeIfAbsent(p.getPosition().name(), k -> new ArrayList<>()).add(p);
            }

            System.out.println("  🟢 Starting Lineup:");
            for (Map.Entry<String, List<PlayerEntity>> entry : byPosition.entrySet()) {
                String pos = entry.getKey();
                String names = entry.getValue().stream()
                        .map(PlayerEntity::getViewName)
                        .collect(Collectors.joining(", "));
                System.out.println("    ▸ " + pos + ": " + names);
            }

            // === Bench ===
            Map<String, Integer> benchMap = currentSquad.getBenchMap();
            if (benchMap != null && !benchMap.isEmpty()) {
                System.out.println("  🪑 Bench:");
                for (Map.Entry<String, Integer> entry : benchMap.entrySet()) {
                    playerRepo.findById(entry.getValue()).ifPresent(p ->
                            System.out.println("    ▸ " + entry.getKey() + ": " + p.getViewName()));
                }
            } else {
                System.out.println("  🪑 Bench: (empty)");
            }

            // === Captain, Vice, First Pick ===
            Optional<PlayerEntity> captain = currentSquad.getCaptainId() != null
                    ? playerRepo.findById(currentSquad.getCaptainId())
                    : Optional.empty();

            Optional<PlayerEntity> vice = currentSquad.getViceCaptainId() != null
                    ? playerRepo.findById(currentSquad.getViceCaptainId())
                    : Optional.empty();

            Optional<PlayerEntity> firstPick = currentSquad.getFirstPickId() != null
                    ? playerRepo.findById(currentSquad.getFirstPickId())
                    : Optional.empty();


            System.out.println("  🏅 Captain: " + captain.map(PlayerEntity::getViewName).orElse("None"));
            System.out.println("  🎖️ Vice Captain: " + vice.map(PlayerEntity::getViewName).orElse("None"));
            System.out.println("  ⭐ First Pick: " + firstPick.map(PlayerEntity::getViewName).orElse("None"));
            System.out.println("User chips status: " + InMemoryData.getUsers().findById(user.getId()).getActiveChips());
            System.out.println();
        }

    }

    private void updatePlayersPhotosFromApi() {
        System.out.println("🖼️ Updating player photos using FPL code field...");

        try {
            String url = "https://fantasy.premierleague.com/api/bootstrap-static/";
            var mapper = new ObjectMapper();
            var root = mapper.readTree(new URL(url));
            var elements = root.get("elements");

            // Map לפי id → code
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
                    player.setPhoto(code); // שומר את המספר עצמו
                    updated++;
                }
            }

            if (updated > 0) {
                playerRepo.saveAll(players);
            }

            System.out.println("✔ Updated photo codes for " + updated + " players.");

        } catch (Exception e) {
            System.err.println("❌ Failed to update player photos: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void initializeTransferOrderForGW8() {
        int gameWeekId = 8;
        var gameWeek = gameWeekRepo.findById(gameWeekId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gameWeekId));

        // הסדר הבסיסי (הראשון) לפי הרשימה שלך
        List<Integer> baseOrder = List.of(
                6, // עדן
                1, // עומרי
                4, // יקואל
                2, // יפרח
                7, // יניב
                5, // טפר
                3  // איתמר
        );

        List<TransferPickEntity> picks = new ArrayList<>();

        // סיבוב ראשון (1 → 7)
        for (int i = 0; i < baseOrder.size(); i++) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(i);
            pick.setUserId(baseOrder.get(i));
            pick.setGameWeek(gameWeek);
            picks.add(pick);
        }

        // סיבוב שני (7 → 1)
        for (int i = baseOrder.size() - 1; i >= 0; i--) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(picks.size());
            pick.setUserId(baseOrder.get(i));
            pick.setGameWeek(gameWeek);
            picks.add(pick);
        }

        gameWeek.setTransferOrder(picks);
        gameWeekRepo.save(gameWeek);

        System.out.println("✅ Snake transfer order initialized for GameWeek 8:");
        for (TransferPickEntity p : picks) {
            System.out.println("Position " + p.getPosition() + " → User " + p.getUserId());
        }
    }


}