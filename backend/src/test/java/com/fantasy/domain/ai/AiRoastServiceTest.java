package com.fantasy.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerFixtureStatsRepository;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;
import com.fantasy.domain.score.LeagueScoringService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserPointsEntity;
import com.fantasy.domain.team.UserPointsRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiRoastServiceTest {

    @TempDir
    Path tempDir;

    private AiRoastRepository roastRepository;
    private UserGameDataRepository gameDataRepository;
    private UserPointsRepository pointsRepository;
    private UserSquadRepository squadRepository;
    private GameWeekRepository gameWeekRepository;
    private FixtureRepository fixtureRepository;
    private PlayerGameweekStatsRepository statsRepository;
    private PlayerFixtureStatsRepository fixtureStatsRepository;
    private LeagueScoringService scoringService;
    private FantasyAiClient aiClient;
    private AiRoastService service;

    @BeforeEach
    void setUp() {
        roastRepository = mock(AiRoastRepository.class);
        gameDataRepository = mock(UserGameDataRepository.class);
        pointsRepository = mock(UserPointsRepository.class);
        squadRepository = mock(UserSquadRepository.class);
        gameWeekRepository = mock(GameWeekRepository.class);
        fixtureRepository = mock(FixtureRepository.class);
        statsRepository = mock(PlayerGameweekStatsRepository.class);
        fixtureStatsRepository = mock(PlayerFixtureStatsRepository.class);
        scoringService = mock(LeagueScoringService.class);
        aiClient = mock(FantasyAiClient.class);
        service = new AiRoastService(
                true,
                30,
                "",
                roastRepository,
                gameDataRepository,
                pointsRepository,
                squadRepository,
                gameWeekRepository,
                fixtureRepository,
                statsRepository,
                fixtureStatsRepository,
                scoringService,
                aiClient,
                new ObjectMapper()
        );
    }

    @Test
    void everyLeagueMemberReadsTheSameSavedFeed() {
        UserGameDataEntity gameData = gameData();
        AiRoastEntity saved = new AiRoastEntity();
        saved.setUser(gameData);
        saved.setLeague(gameData.getLeague());
        saved.setGameweek(1);
        saved.setContent("Already roasted.");
        saved.setProvider("groq");
        saved.setGeneratedAt(LocalDateTime.now());
        saved.setRotationIndex(0);

        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));
        when(roastRepository.findByLeague_IdAndGameweekOrderByRotationIndexAsc(3L, 1))
                .thenReturn(List.of(saved));

        AiRoastDto result = service.find(7, 1).orElseThrow();

        assertEquals("Already roasted.", result.roasts().getFirst().content());
        assertEquals(30, result.rotationSeconds());
        verify(aiClient, never()).complete(any(), any(), anyInt());
        verify(aiClient, never()).completeJson(any(), any(), anyInt(), any(), any());
        verify(roastRepository, never()).save(any());
    }

    @Test
    void superAdminCanReadTheSavedFeedByLeagueWithoutBecomingAMember() {
        UserGameDataEntity gameData = gameData();
        AiRoastEntity saved = new AiRoastEntity();
        saved.setUser(gameData);
        saved.setLeague(gameData.getLeague());
        saved.setGameweek(1);
        saved.setContent("Observer-safe roast.");
        saved.setProvider("fallback");
        saved.setGeneratedAt(LocalDateTime.now());
        saved.setRotationIndex(0);

        when(roastRepository.findByLeague_IdAndGameweekOrderByRotationIndexAsc(3L, 1))
                .thenReturn(List.of(saved));

        AiRoastDto result = service.findForLeague(3L, 1).orElseThrow();

        assertEquals("Observer-safe roast.", result.roasts().getFirst().content());
        verify(gameDataRepository, never()).findByUserId(anyInt());
        verify(roastRepository, never()).save(any());
    }

    @Test
    void usesLeagueScoringFactsAndFallsBackCleanlyWhenAiIsDisabled() {
        UserGameDataEntity gameData = gameData();
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        gameweek.setCalculated(true);
        UserPointsEntity userPoints = points(gameData, 44);
        UserPointsEntity leaderPoints = points(otherGameData(), 61);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(1);
        squad.setUser(gameData);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(Map.of("1", 20));
        squad.setCaptainId(10);
        PlayerGameweekStatsEntity captainStats = stats(10, "Captain Choice");
        PlayerGameweekStatsEntity benchStats = stats(20, "Bench Hero");

        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));
        when(gameDataRepository.findAllByLeagueIdForUpdate(3L)).thenReturn(List.of(gameData));
        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(pointsRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(userPoints));
        when(pointsRepository.findByGameweekAndUser_League_Id(1, 3L)).thenReturn(List.of(userPoints, leaderPoints));
        when(squadRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(squad));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of(captainStats, benchStats));
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(scoringService.calculatePlayerGameweekPoints(eq(captainStats), eq(List.of()), any())).thenReturn(2);
        when(scoringService.calculatePlayerGameweekPoints(eq(benchStats), eq(List.of()), any())).thenReturn(9);
        when(aiClient.completeJson(any(), any(), anyInt(), eq("fantasy_gameweek_roasts"), any()))
                .thenReturn(Optional.empty());
        AtomicReference<AiRoastEntity> generated = new AtomicReference<>();
        when(roastRepository.findByLeague_IdAndGameweekOrderByRotationIndexAsc(3L, 1))
                .thenAnswer(ignored -> generated.get() == null ? List.of() : List.of(generated.get()));
        when(roastRepository.save(any())).thenAnswer(invocation -> {
            AiRoastEntity entity = invocation.getArgument(0);
            generated.set(entity);
            return entity;
        });

        AiRoastDto result = service.generate(7, 1);

        assertFalse(result.roasts().getFirst().generatedByAi());
        assertEquals(1, result.gameweek());
        assertEquals(true, result.roasts().getFirst().content().contains("Bench Hero"));
        verify(scoringService).calculatePlayerGameweekPoints(eq(benchStats), eq(List.of()), any());
        verify(aiClient).completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any());
        verify(aiClient, never()).complete(any(), any(), anyInt());
    }

    @Test
    void acceptsAValidatedStructuredRoastAndMarksItAsAiGenerated() {
        UserGameDataEntity gameData = gameData();
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        gameweek.setCalculated(true);
        UserPointsEntity userPoints = points(gameData, 72);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(1);
        squad.setUser(gameData);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(Map.of());
        squad.setCaptainId(10);
        PlayerGameweekStatsEntity captainStats = stats(10, "Captain Choice");

        when(gameDataRepository.findByUserId(7)).thenReturn(Optional.of(gameData));
        when(gameDataRepository.findAllByLeagueIdForUpdate(3L)).thenReturn(List.of(gameData));
        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(pointsRepository.findByGameweekAndUser_League_Id(1, 3L)).thenReturn(List.of(userPoints));
        when(squadRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(squad));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of(captainStats));
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(scoringService.calculatePlayerGameweekPoints(eq(captainStats), eq(List.of()), any())).thenReturn(8);
        when(aiClient.completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any()))
                .thenReturn(Optional.of("""
                        {"roasts":[{"userGameDataId":70,"content":"Roi United נתנה הצגה של 72 נקודות; אפילו הקפטן נראה כאילו קיבל הוראות."}]}
                        """));
        when(aiClient.providerName()).thenReturn("groq");
        when(aiClient.modelName()).thenReturn("openai/gpt-oss-20b");
        AtomicReference<AiRoastEntity> generated = new AtomicReference<>();
        when(roastRepository.findByLeague_IdAndGameweekOrderByRotationIndexAsc(3L, 1))
                .thenAnswer(ignored -> generated.get() == null ? List.of() : List.of(generated.get()));
        when(roastRepository.save(any())).thenAnswer(invocation -> {
            AiRoastEntity entity = invocation.getArgument(0);
            generated.set(entity);
            return entity;
        });

        AiRoastDto result = service.generate(7, 1);

        assertTrue(result.roasts().getFirst().generatedByAi());
        assertTrue(result.roasts().getFirst().content().contains("72"));
        assertEquals("groq", generated.get().getProvider());
        verify(aiClient).completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any());
    }

    @Test
    void superAdminPreviewUsesSecretFilePromptWithoutSavingOrEnablingThePublicFeature() throws IOException {
        Path promptFile = tempDir.resolve("ai-roast-prompt.txt");
        Files.writeString(promptFile, "פרומפט חיצוני טבעי לבדיקה");
        service = new AiRoastService(
                false, 30, promptFile.toString(), roastRepository, gameDataRepository, pointsRepository, squadRepository,
                gameWeekRepository, fixtureRepository, statsRepository, fixtureStatsRepository, scoringService, aiClient,
                new ObjectMapper()
        );
        UserGameDataEntity gameData = gameData();
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        gameweek.setCalculated(false);
        UserPointsEntity userPoints = points(gameData, 23);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(1);
        squad.setUser(gameData);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(Map.of());
        squad.setCaptainId(10);
        PlayerGameweekStatsEntity captainStats = stats(10, "Live Captain");
        captainStats.getPlayer().setTeamId(5);
        FixtureEntity upcomingFixture = new FixtureEntity();
        upcomingFixture.setId(100);
        upcomingFixture.setGameweekId(1);
        upcomingFixture.setHomeTeamId(5);
        upcomingFixture.setAwayTeamId(6);
        upcomingFixture.setStarted(false);
        upcomingFixture.setFinished(false);

        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(gameDataRepository.findByLeague_Id(3L)).thenReturn(List.of(gameData));
        when(pointsRepository.findByGameweekAndUser_League_Id(1, 3L)).thenReturn(List.of(userPoints));
        when(squadRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(squad));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of(captainStats));
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(fixtureRepository.findByGameweekId(1)).thenReturn(List.of(upcomingFixture));
        when(scoringService.calculatePlayerGameweekPoints(eq(captainStats), eq(List.of()), any())).thenReturn(4);
        AtomicReference<JsonNode> requestedSchema = new AtomicReference<>();
        AtomicReference<String> requestedSystemPrompt = new AtomicReference<>();
        AtomicReference<String> requestedFacts = new AtomicReference<>();
        when(aiClient.completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any()))
                .thenAnswer(invocation -> {
                    requestedSystemPrompt.set(invocation.getArgument(0));
                    requestedFacts.set(invocation.getArgument(1));
                    requestedSchema.set(invocation.getArgument(4));
                    return Optional.of("""
                        {"roasts":{"70":"Roi United עם 23 נקודות כרגע; אפילו Live Captain מחכה שהמחזור יתעורר."}}
                        """);
                });
        when(aiClient.providerName()).thenReturn("groq");
        when(aiClient.modelName()).thenReturn("openai/gpt-oss-20b");

        AiRoastDto result = service.previewForLeague(3L, 1);

        assertEquals(1, result.roasts().size());
        assertTrue(result.roasts().getFirst().generatedByAi());
        assertTrue(result.roasts().getFirst().content().contains("23"));
        JsonNode roastsSchema = requestedSchema.get().path("properties").path("roasts");
        assertEquals("object", roastsSchema.path("type").asText());
        assertFalse(roastsSchema.path("additionalProperties").asBoolean(true));
        assertEquals("string", roastsSchema.path("properties").path("70").path("type").asText());
        assertEquals("70", roastsSchema.path("required").path(0).asText());
        assertEquals("פרומפט חיצוני טבעי לבדיקה", requestedSystemPrompt.get());
        assertTrue(requestedFacts.get().contains("המנהל: Roi"));
        assertFalse(requestedFacts.get().contains("המנהל: Roi Harush"));
        assertTrue(requestedFacts.get().contains("המחזור עדיין לא הסתיים"));
        assertTrue(requestedFacts.get().contains("Live Captain: 4 נקודות; טרם שיחק"));
        assertTrue(requestedFacts.get().contains("אסור לצחוק על אפס"));
        assertTrue(requestedFacts.get().contains("אין עדיין שחקן בהרכב שהתחיל לשחק"));
        assertTrue(requestedFacts.get().contains("אין עדיין שחקן בהרכב שכל משחקיו במחזור הסתיימו"));
        assertFalse(requestedFacts.get().contains("bestPlayer"));
        verify(roastRepository, never()).save(any());
        verify(roastRepository, never()).findByLeague_IdAndGameweekOrderByRotationIndexAsc(anyLong(), anyInt());
    }

    @Test
    void automaticRefreshReplacesTheWholeFeedOnlyAfterACompleteAiResponse() {
        UserGameDataEntity gameData = gameData();
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        gameweek.setCalculated(false);
        UserPointsEntity userPoints = points(gameData, 33);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(1);
        squad.setUser(gameData);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(Map.of());
        squad.setCaptainId(10);
        PlayerGameweekStatsEntity captainStats = stats(10, "Captain Choice");
        AiRoastEntity existing = new AiRoastEntity();
        existing.setUser(gameData);
        existing.setLeague(gameData.getLeague());
        existing.setGameweek(1);
        existing.setContent("Yesterday's feed");
        existing.setProvider("gemini");
        existing.setGeneratedAt(LocalDateTime.now().minusDays(1));
        existing.setRotationIndex(0);

        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(gameDataRepository.findAllByLeagueIdForUpdate(3L)).thenReturn(List.of(gameData));
        when(pointsRepository.findByGameweekAndUser_League_Id(1, 3L)).thenReturn(List.of(userPoints));
        when(squadRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(squad));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of(captainStats));
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(scoringService.calculatePlayerGameweekPoints(eq(captainStats), eq(List.of()), any())).thenReturn(5);
        when(roastRepository.findByLeague_IdAndGameweekOrderByRotationIndexAsc(3L, 1))
                .thenReturn(List.of(existing));
        when(aiClient.completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any()))
                .thenReturn(Optional.of("""
                        {"roasts":{"70":"Roast updated after today's matches."}}
                        """));
        when(aiClient.providerName()).thenReturn("gemini");

        boolean updated = service.refreshForLeague(3L, 1, false);

        assertTrue(updated);
        assertEquals("Roast updated after today's matches.", existing.getContent());
        assertEquals("gemini", existing.getProvider());
        verify(roastRepository).saveAll(any());
    }

    @Test
    void automaticRefreshPreservesThePreviousFeedWhenTheProviderResponseIsIncomplete() {
        UserGameDataEntity gameData = gameData();
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(1);
        UserPointsEntity userPoints = points(gameData, 33);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(1);
        squad.setUser(gameData);
        squad.setStartingLineup(List.of(10));
        squad.setBenchMap(Map.of());
        squad.setCaptainId(10);
        PlayerGameweekStatsEntity captainStats = stats(10, "Captain Choice");

        when(gameWeekRepository.findById(1)).thenReturn(Optional.of(gameweek));
        when(gameDataRepository.findAllByLeagueIdForUpdate(3L)).thenReturn(List.of(gameData));
        when(pointsRepository.findByGameweekAndUser_League_Id(1, 3L)).thenReturn(List.of(userPoints));
        when(squadRepository.findByUser_IdAndGameweek(70, 1)).thenReturn(Optional.of(squad));
        when(statsRepository.findByGameweek(1)).thenReturn(List.of(captainStats));
        when(fixtureStatsRepository.findByGameweek(1)).thenReturn(List.of());
        when(scoringService.calculatePlayerGameweekPoints(eq(captainStats), eq(List.of()), any())).thenReturn(5);
        when(aiClient.completeJson(any(), any(), eq(480), eq("fantasy_gameweek_roasts"), any()))
                .thenReturn(Optional.empty());

        boolean updated = service.refreshForLeague(3L, 1, false);

        assertFalse(updated);
        verify(roastRepository, never()).saveAll(any());
        verify(roastRepository, never()).deleteAll(any());
    }

    private UserGameDataEntity gameData() {
        UserEntity user = new UserEntity();
        user.setId(7);
        user.setName("Roi");
        user.setFirstName("Roi");
        user.setLastName("Harush");
        LeagueEntity league = new LeagueEntity();
        league.setId(3L);
        league.setName("Friends League");

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(70);
        gameData.setUser(user);
        gameData.setLeague(league);
        gameData.setFantasyTeamName("Roi United");
        return gameData;
    }

    private UserGameDataEntity otherGameData() {
        UserEntity user = new UserEntity();
        user.setId(8);
        user.setName("Dana");
        user.setFirstName("Dana");
        user.setLastName("Levy");
        LeagueEntity league = new LeagueEntity();
        league.setId(3L);
        league.setName("Friends League");
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(80);
        gameData.setUser(user);
        gameData.setLeague(league);
        gameData.setFantasyTeamName("Dana FC");
        return gameData;
    }

    private UserPointsEntity points(UserGameDataEntity gameData, int points) {
        UserPointsEntity entity = new UserPointsEntity();
        entity.setUser(gameData);
        entity.setGameweek(1);
        entity.setPoints(points);
        return entity;
    }

    private PlayerGameweekStatsEntity stats(int id, String name) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setViewName(name);
        PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
        stats.setPlayer(player);
        stats.setGameweek(1);
        return stats;
    }
}

