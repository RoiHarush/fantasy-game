package com.fantasy.domain.ai;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.*;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.SquadDto;
import com.fantasy.domain.team.ChipNames;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.TransferWindowType;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AlexCoachEngine {
    private static final String ENGINE_VERSION = "alex-v1";

    private final PlayerRepository players;
    private final PlayerGameweekStatsRepository stats;
    private final PlayerFixtureStatsRepository fixtureStats;
    private final FixtureRepository fixtures;
    private final UserGameDataRepository gameData;
    private final LeagueTransferWindowRepository windows;
    private final LeagueScoringService scoring;

    public AlexCoachEngine(PlayerRepository players,
                           PlayerGameweekStatsRepository stats,
                           PlayerFixtureStatsRepository fixtureStats,
                           FixtureRepository fixtures,
                           UserGameDataRepository gameData,
                           LeagueTransferWindowRepository windows,
                           LeagueScoringService scoring) {
        this.players = players;
        this.stats = stats;
        this.fixtureStats = fixtureStats;
        this.fixtures = fixtures;
        this.gameData = gameData;
        this.windows = windows;
        this.scoring = scoring;
    }

    public EngineResult analyze(UserGameDataEntity user, int gameweek, SquadDto draftSquad) {
        UserSquadEntity persisted = user.getNextSquad() != null ? user.getNextSquad() : user.getCurrentSquad();
        if (persisted == null) throw new IllegalStateException("Alex needs a completed squad before analysing it");

        Set<Integer> rosterIds = rosterIds(persisted);
        Map<Integer, PlayerEntity> catalog = players.findAllById(rosterIds).stream()
                .collect(Collectors.toMap(PlayerEntity::getId, Function.identity()));
        if (catalog.size() != rosterIds.size()) throw new IllegalStateException("Some squad players are missing from the catalogue");

        LeagueEntity league = user.getLeague();
        Map<Integer, Score> allScores = scorePlayers(players.findAll(), league, gameweek);
        List<Score> rosterScores = rosterIds.stream().map(allScores::get).filter(Objects::nonNull).toList();
        List<String> warnings = new ArrayList<>();
        SquadDto recommendation = buildLineup(persisted, rosterScores, league, warnings);
        List<CoachAnalysisDto.TransferSuggestion> transfers = buildTransfers(
                user, gameweek, rosterScores, allScores, league
        );
        CoachAnalysisDto.ChipSuggestion chipSuggestion = recommendChip(user, recommendation, rosterScores, league);

        List<CoachAnalysisDto.PlayerScore> playerScores = rosterScores.stream()
                .sorted(Comparator.comparingDouble(Score::value).reversed())
                .map(score -> new CoachAnalysisDto.PlayerScore(
                        score.player().getId(), score.player().getViewName(),
                        league.effectivePosition(score.player()).getCode(), round(score.value()),
                        score.nextDifficulty(), score.availability(), reason(score)
                )).toList();

        String hash = Integer.toHexString(Objects.hash(
                ENGINE_VERSION, gameweek, rosterIds.stream().sorted().toList(),
                playerScores.stream().map(s -> s.playerId() + ":" + s.score()).toList(),
                draftSignature(draftSquad),
                fixtures.findByGameweekId(gameweek).stream()
                        .map(f -> f.getId() + ":" + f.getKickoffTime()).toList()
        ));
        String summary = deterministicSummary(playerScores, transfers);
        return new EngineResult(hash, LocalDateTime.now(), summary, recommendation,
                playerScores, transfers, chipSuggestion, List.copyOf(warnings));
    }

    private Map<Integer, Score> scorePlayers(List<PlayerEntity> all, LeagueEntity league, int targetGw) {
        Map<Integer, List<Integer>> recentPoints = new HashMap<>();
        for (int gw = Math.max(1, targetGw - 4); gw < targetGw; gw++) {
            Map<Integer, List<PlayerFixtureStatsEntity>> fixturesByPlayer = fixtureStats.findByGameweek(gw).stream()
                    .collect(Collectors.groupingBy(s -> s.getPlayer().getId()));
            for (PlayerGameweekStatsEntity stat : stats.findByGameweek(gw)) {
                int points = scoring.calculatePlayerGameweekPoints(
                        stat, fixturesByPlayer.getOrDefault(stat.getPlayer().getId(), List.of()), league
                );
                recentPoints.computeIfAbsent(stat.getPlayer().getId(), ignored -> new ArrayList<>()).add(points);
            }
        }

        Map<Integer, List<FixtureEntity>> upcomingByTeam = new HashMap<>();
        for (int gw = targetGw; gw < Math.min(39, targetGw + 4); gw++) {
            for (FixtureEntity fixture : fixtures.findByGameweekId(gw)) {
                upcomingByTeam.computeIfAbsent(fixture.getHomeTeamId(), ignored -> new ArrayList<>()).add(fixture);
                upcomingByTeam.computeIfAbsent(fixture.getAwayTeamId(), ignored -> new ArrayList<>()).add(fixture);
            }
        }

        Map<Integer, Score> result = new HashMap<>();
        for (PlayerEntity player : all) {
            List<Integer> history = recentPoints.getOrDefault(player.getId(), List.of());
            double recent = history.isEmpty() ? player.getForm() : history.stream().mapToInt(Integer::intValue).average().orElse(0);
            List<Integer> difficulties = new ArrayList<>();
            if (player.getTeamId() == null) {
                result.put(player.getId(), new Score(player, 0, recent, 3, availability(player)));
                continue;
            }
            for (FixtureEntity fixture : upcomingByTeam.getOrDefault(player.getTeamId(), List.of())) {
                Integer difficulty = fixture.getHomeTeamId() == player.getTeamId()
                        ? fixture.getHomeDifficulty() : fixture.getAwayDifficulty();
                if (difficulty != null) difficulties.add(difficulty);
            }
            int nextDifficulty = difficulties.isEmpty() ? 3 : difficulties.getFirst();
            double fixtureScore = difficulties.isEmpty() ? 5 : difficulties.stream().mapToDouble(d -> 6 - d).average().orElse(3) * 2;
            double underlying = Math.min(10, player.getExpectedGoalInvolvements() * 1.7
                    + player.getIctIndex() / 35.0 + player.getPointsPerGame());
            double minutesSecurity = player.isInjured() ? 1 : Math.min(10, 4 + player.getSelectedByPercent() / 8.0);
            int availability = availability(player);
            double multiplier = availability >= 100 ? 1 : availability >= 75 ? .85
                    : availability >= 50 ? .60 : availability >= 25 ? .25 : 0;
            double value = (recent * .40 + fixtureScore * .30 + underlying * .20 + minutesSecurity * .10) * multiplier;
            result.put(player.getId(), new Score(player, value, recent, nextDifficulty, availability));
        }
        return result;
    }

    private SquadDto buildLineup(UserSquadEntity source, List<Score> roster, LeagueEntity league,
                                 List<String> warnings) {
        Map<PlayerPosition, List<Score>> byPosition = roster.stream().collect(Collectors.groupingBy(
                score -> league.effectivePosition(score.player())
        ));
        byPosition.values().forEach(list -> list.sort(Comparator.comparingDouble(Score::value).reversed()));
        if (roster.size() < 15) warnings.add("הסגל עדיין אינו מלא; ההמלצה מבוססת רק על השחקנים הקיימים.");

        int bestDef = 4, bestMid = 4, bestFwd = 2;
        double best = Double.NEGATIVE_INFINITY;
        for (int def = 3; def <= 5; def++) for (int mid = 2; mid <= 5; mid++) {
            int fwd = 10 - def - mid;
            if (fwd < 1 || fwd > 3) continue;
            double total = topSum(byPosition.get(PlayerPosition.GOALKEEPER), 1)
                    + topSum(byPosition.get(PlayerPosition.DEFENDER), def)
                    + topSum(byPosition.get(PlayerPosition.MIDFIELDER), mid)
                    + topSum(byPosition.get(PlayerPosition.FORWARD), fwd);
            if (has(byPosition, PlayerPosition.GOALKEEPER, 1)
                    && has(byPosition, PlayerPosition.DEFENDER, def)
                    && has(byPosition, PlayerPosition.MIDFIELDER, mid)
                    && has(byPosition, PlayerPosition.FORWARD, fwd) && total > best) {
                best = total; bestDef = def; bestMid = mid; bestFwd = fwd;
            }
        }

        Map<String, List<Integer>> starting = new LinkedHashMap<>();
        starting.put("GK", ids(byPosition.get(PlayerPosition.GOALKEEPER), 1));
        starting.put("DEF", ids(byPosition.get(PlayerPosition.DEFENDER), bestDef));
        starting.put("MID", ids(byPosition.get(PlayerPosition.MIDFIELDER), bestMid));
        starting.put("FWD", ids(byPosition.get(PlayerPosition.FORWARD), bestFwd));
        Set<Integer> starters = starting.values().stream().flatMap(Collection::stream).collect(Collectors.toSet());

        Map<String, Integer> bench = new LinkedHashMap<>();
        bench.put("GK", byPosition.getOrDefault(PlayerPosition.GOALKEEPER, List.of()).stream()
                .filter(s -> !starters.contains(s.player().getId())).map(s -> s.player().getId()).findFirst().orElse(null));
        List<Integer> outfieldBench = roster.stream().filter(s -> league.effectivePosition(s.player()) != PlayerPosition.GOALKEEPER)
                .filter(s -> !starters.contains(s.player().getId()))
                .sorted(Comparator.comparingDouble(Score::value).reversed())
                .map(s -> s.player().getId()).toList();
        for (int i = 0; i < 3; i++) bench.put("S" + (i + 1), i < outfieldBench.size() ? outfieldBench.get(i) : null);

        List<Score> captainCandidates = roster.stream().filter(s -> starters.contains(s.player().getId()))
                .filter(s -> !Objects.equals(s.player().getId(), source.getFirstPickId()))
                .sorted(Comparator.comparingDouble(Score::value).reversed()).toList();
        SquadDto dto = new SquadDto();
        dto.setStartingLineup(starting);
        dto.setBench(bench);
        dto.setFormation(Map.of("GK", 1, "DEF", bestDef, "MID", bestMid, "FWD", bestFwd));
        dto.setCaptainId(captainCandidates.isEmpty() ? source.getCaptainId() : captainCandidates.getFirst().player().getId());
        dto.setViceCaptainId(captainCandidates.size() < 2 ? source.getViceCaptainId() : captainCandidates.get(1).player().getId());
        dto.setFirstPickId(source.getFirstPickId());
        dto.setIrId(source.getIrId());
        dto.setTripleCaptainActive(source.isTripleCaptainActive());
        dto.setBenchBoostActive(source.isBenchBoostActive());
        return dto;
    }

    private List<CoachAnalysisDto.TransferSuggestion> buildTransfers(UserGameDataEntity user, int gameweek,
                                                                      List<Score> roster,
                                                                      Map<Integer, Score> allScores,
                                                                      LeagueEntity league) {
        Set<Integer> owned = new HashSet<>();
        for (UserGameDataEntity member : gameData.findAllByLeagueIdWithSquads(league.getId())) {
            UserSquadEntity squad;
            if (Objects.equals(member.getId(), user.getId())) {
                squad = member.getNextSquad() != null ? member.getNextSquad() : member.getCurrentSquad();
            } else {
                // Opponents' future waiver/transfer plans are private. Alex may only use their public squad.
                squad = member.getCurrentSquad();
            }
            if (squad != null) owned.addAll(ownedIds(squad));
        }
        List<Score> free = allScores.values().stream()
                .filter(score -> !owned.contains(score.player().getId()))
                .filter(score -> !league.isPlayerLocked(score.player().getId()))
                .filter(score -> score.availability() > 0)
                .sorted(Comparator.comparingDouble(Score::value).reversed()).toList();
        String confidence = orderConfidence(user, gameweek);
        List<CoachAnalysisDto.TransferSuggestion> result = new ArrayList<>();
        Set<Integer> usedIncoming = new HashSet<>();
        Map<Integer, Long> clubCounts = roster.stream().filter(s -> s.player().getTeamId() != null)
                .collect(Collectors.groupingBy(s -> s.player().getTeamId(), Collectors.counting()));
        for (Score outgoing : roster.stream().sorted(Comparator.comparingDouble(Score::value)).toList()) {
            PlayerPosition position = league.effectivePosition(outgoing.player());
            free.stream().filter(incoming -> league.effectivePosition(incoming.player()) == position)
                    .filter(incoming -> !usedIncoming.contains(incoming.player().getId()))
                    .filter(incoming -> isLegalClubSwap(clubCounts, outgoing.player(), incoming.player()))
                    .filter(incoming -> incoming.value() > outgoing.value() + .35).findFirst().ifPresent(incoming -> {
                        if (result.size() < 3) {
                            usedIncoming.add(incoming.player().getId());
                            result.add(new CoachAnalysisDto.TransferSuggestion(
                                    outgoing.player().getId(), outgoing.player().getViewName(),
                                    incoming.player().getId(), incoming.player().getViewName(), position.getCode(),
                                    round(incoming.value() - outgoing.value()),
                                    incoming.player().getViewName() + " בכושר ובמסלול משחקים עדיף כרגע.", confidence
                            ));
                        }
                    });
        }
        return List.copyOf(result);
    }

    private boolean isLegalClubSwap(Map<Integer, Long> clubCounts, PlayerEntity outgoing, PlayerEntity incoming) {
        if (incoming.getTeamId() == null) return false;
        if (Objects.equals(outgoing.getTeamId(), incoming.getTeamId())) return true;
        return clubCounts.getOrDefault(incoming.getTeamId(), 0L) < 3;
    }

    private String orderConfidence(UserGameDataEntity user, int gw) {
        return windows.findByLeague_IdAndGameWeek_IdAndWindowType(user.getLeague().getId(), gw, TransferWindowType.TRANSFER)
                .map(window -> {
                    int index = window.getCanonicalOrder().indexOf(user.getUser().getId());
                    if (index < 0) return "לא ידוע";
                    int size = window.getCanonicalOrder().size();
                    return index < Math.max(1, size / 3) ? "גבוה" : index < Math.max(2, size * 2 / 3) ? "בינוני" : "נמוך";
                }).orElse("תחזית בלבד");
    }

    private Set<Integer> rosterIds(UserSquadEntity squad) {
        Set<Integer> ids = new LinkedHashSet<>(squad.getStartingLineup());
        squad.getBenchMap().values().stream().filter(Objects::nonNull).forEach(ids::add);
        ids.remove(null);
        return ids;
    }

    private Set<Integer> ownedIds(UserSquadEntity squad) {
        Set<Integer> ids = rosterIds(squad);
        if (squad.getIrId() != null) ids.add(squad.getIrId());
        return ids;
    }

    private CoachAnalysisDto.ChipSuggestion recommendChip(UserGameDataEntity user, SquadDto recommendation,
                                                            List<Score> roster, LeagueEntity league) {
        Set<Integer> starters = recommendation.getStartingLineup().values().stream()
                .flatMap(Collection::stream).collect(Collectors.toSet());
        List<Score> bench = roster.stream().filter(s -> !starters.contains(s.player().getId())).toList();
        double benchAverage = bench.stream().mapToDouble(Score::value).average().orElse(0);
        Score captain = roster.stream().filter(s -> Objects.equals(s.player().getId(), recommendation.getCaptainId()))
                .findFirst().orElse(null);

        if (Boolean.TRUE.equals(user.getActiveChips().get(ChipNames.BENCH_BOOST))) {
            return new CoachAnalysisDto.ChipSuggestion(ChipNames.BENCH_BOOST, "כבר פעיל",
                    "Alex שומר את הבחירה הקיימת ולא משנה צ'יפ פעיל.", "ודאי");
        }
        if (Boolean.TRUE.equals(user.getActiveChips().get(ChipNames.TRIPLE_CAPTAIN))) {
            return new CoachAnalysisDto.ChipSuggestion(ChipNames.TRIPLE_CAPTAIN, "כבר פעיל",
                    "Alex שומר את הבחירה הקיימת ולא משנה צ'יפ פעיל.", "ודאי");
        }
        if (user.getChips().getOrDefault(ChipNames.BENCH_BOOST, 0) > 0 && bench.size() == 4 && benchAverage >= 6.0) {
            return new CoachAnalysisDto.ChipSuggestion(ChipNames.BENCH_BOOST, "שווה לשקול",
                    "גם ארבעת שחקני הספסל מקבלים ציון תחזית חזק למחזור הקרוב.", "בינוני");
        }
        if (user.getChips().getOrDefault(ChipNames.TRIPLE_CAPTAIN, 0) > 0 && captain != null
                && captain.value() >= 7.5 && captain.nextDifficulty() <= 2) {
            return new CoachAnalysisDto.ChipSuggestion(ChipNames.TRIPLE_CAPTAIN, "שווה לשקול",
                    captain.player().getViewName() + " מוביל את התחזית עם משחק קרוב נוח.", "בינוני");
        }
        return new CoachAnalysisDto.ChipSuggestion("NONE", "לשמור כרגע",
                "אין יתרון מספיק ברור כדי לבזבז צ'יפ לפי הנתונים הזמינים.", "גבוה");
    }

    private Object draftSignature(SquadDto draft) {
        if (draft == null) return "no-editor-draft";
        return String.valueOf(draft.getStartingLineup()) + '|' + draft.getBench() + '|'
                + draft.getCaptainId() + '|' + draft.getViceCaptainId() + '|'
                + draft.getFirstPickId() + '|' + draft.getIrId() + '|'
                + draft.isTripleCaptainActive() + '|' + draft.isBenchBoostActive();
    }

    private int availability(PlayerEntity p) {
        if (p.getChanceOfPlayingNextRound() != null) return p.getChanceOfPlayingNextRound();
        if (p.getChanceOfPlayingThisRound() != null) return p.getChanceOfPlayingThisRound();
        return p.isInjured() ? 0 : 100;
    }
    private boolean has(Map<PlayerPosition, List<Score>> map, PlayerPosition pos, int count) { return map.getOrDefault(pos, List.of()).size() >= count; }
    private double topSum(List<Score> scores, int n) { return scores == null || scores.size() < n ? -10000 : scores.stream().limit(n).mapToDouble(Score::value).sum(); }
    private List<Integer> ids(List<Score> scores, int n) { return scores == null ? List.of() : scores.stream().limit(n).map(s -> s.player().getId()).toList(); }
    private double round(double value) { return Math.round(value * 100.0) / 100.0; }
    private String reason(Score score) {
        return score.player().getViewName() + ": כושר אחרון " + round(score.recent())
                + ", קושי משחק קרוב " + score.nextDifficulty() + ", זמינות " + score.availability() + "%";
    }
    private String deterministicSummary(List<CoachAnalysisDto.PlayerScore> scores,
                                        List<CoachAnalysisDto.TransferSuggestion> transfers) {
        String leader = scores.isEmpty() ? "הסגל" : scores.getFirst().playerName();
        String transfer = transfers.isEmpty() ? "לא זוהתה כרגע העברה מובהקת" : "כדאי לבדוק את " + transfers.getFirst().playerInName();
        return "Alex ממליץ לבנות את ההרכב סביב " + leader + ". " + transfer
                + ". ההמלצה מחושבת מנתוני FPL והליגה בלבד, ללא פעולה אוטומטית.";
    }

    private record Score(PlayerEntity player, double value, double recent, int nextDifficulty, int availability) {}
    public record EngineResult(String snapshotHash, LocalDateTime dataAsOf, String summary,
                               SquadDto recommendedSquad,
                               List<CoachAnalysisDto.PlayerScore> playerScores,
                               List<CoachAnalysisDto.TransferSuggestion> transfers,
                               CoachAnalysisDto.ChipSuggestion chipSuggestion,
                               List<String> warnings) {}
}
