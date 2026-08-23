package com.fantasy.domain.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlexCoachService {
    private static final String ANALYSIS_PROMPT = """
            אתה Alex, עוזר מאמן לפנטזי פרמייר ליג. כתוב בעברית טבעית וקצרה,
            אבל שמות שחקנים השאר באנגלית. השתמש אך ורק בניתוח המחושב שקיבלת.
            אסור לשנות מזהי שחקנים, להמציא מידע או לטעון שבוצעה פעולה. הסבר את
            ההמלצה ב-2 עד 4 משפטים והזכר סיכון מהותי אחד אם קיים.
            """;
    private static final String CHAT_PROMPT = """
            אתה Alex, עוזר מאמן לפנטזי. ענה בעברית קצרה וברורה ושמור שמות שחקנים
            באנגלית. השתמש רק בניתוח המצורף. אל תמציא חדשות, פציעות או מידע על
            תכניות עתידיות של יריבים. לעולם אל תטען ששינית הרכב או העברה.
            """;

    private final boolean enabled;
    private final int analysisLimit;
    private final int followupLimit;
    private final UserGameDataRepository gameData;
    private final GameWeekRepository gameweeks;
    private final AlexCoachEngine engine;
    private final AiCoachThreadRepository threads;
    private final AiCoachMessageRepository messages;
    private final AiCoachUsageRepository usage;
    private final FantasyAiClient ai;
    private final ObjectMapper mapper;

    public AlexCoachService(@Value("${app.ai.coach-enabled:false}") boolean enabled,
                            @Value("${app.ai.daily-analysis-limit:5}") int analysisLimit,
                            @Value("${app.ai.followup-limit:10}") int followupLimit,
                            UserGameDataRepository gameData,
                            GameWeekRepository gameweeks,
                            AlexCoachEngine engine,
                            AiCoachThreadRepository threads,
                            AiCoachMessageRepository messages,
                            AiCoachUsageRepository usage,
                            FantasyAiClient ai,
                            ObjectMapper mapper) {
        this.enabled = enabled;
        this.analysisLimit = analysisLimit;
        this.followupLimit = followupLimit;
        this.gameData = gameData;
        this.gameweeks = gameweeks;
        this.engine = engine;
        this.threads = threads;
        this.messages = messages;
        this.usage = usage;
        this.ai = ai;
        this.mapper = mapper;
    }

    public boolean isEnabled() { return enabled; }

    @Transactional(readOnly = true)
    public Optional<CoachAnalysisDto> find(int actualUserId, int gameweek) {
        if (!enabled) return Optional.empty();
        UserGameDataEntity user = requireUser(actualUserId);
        return threads.findByUser_IdAndGameweek(user.getId(), gameweek).map(this::readWithContext);
    }

    @Transactional
    public CoachAnalysisDto analyze(int actualUserId, int gameweek, CoachAnalyzeRequest request) {
        requireEnabled();
        gameweeks.findById(gameweek).orElseThrow(() -> new IllegalArgumentException("Gameweek was not found"));
        UserGameDataEntity user = requireUser(actualUserId);
        if (user.getLeague() == null) throw new IllegalStateException("Join a league before asking Alex");
        threads.deleteByUser_IdAndGameweekLessThan(user.getId(), Math.max(1, gameweek - 1));

        AlexCoachEngine.EngineResult result = engine.analyze(user, gameweek, request == null ? null : request.draftSquad());
        Optional<AiCoachThreadEntity> existing = threads.findByUser_IdAndGameweek(user.getId(), gameweek);
        if (existing.isPresent() && existing.get().getSnapshotHash().equals(result.snapshotHash())) {
            return readWithContext(existing.get());
        }
        long used = usage.countByUser_IdAndUsageTypeAndCreatedAtGreaterThanEqual(
                user.getId(), "ANALYSIS", LocalDate.now().atStartOfDay()
        );
        if (used >= analysisLimit) throw new IllegalStateException("הגעת למכסת הניתוחים היומית של Alex");

        String deterministic = result.summary();
        Optional<String> prose = ai.complete(ANALYSIS_PROMPT, analysisFacts(result), 260)
                .map(this::sanitize).filter(text -> !text.isBlank());
        CoachAnalysisDto dto = new CoachAnalysisDto(
                true, gameweek, result.snapshotHash(), result.dataAsOf(), prose.isPresent(),
                prose.orElse(deterministic), result.recommendedSquad(), result.playerScores(),
                result.transfers(), result.chipSuggestion(), result.warnings(), new CoachAnalysisDto.Quota(0, 0), List.of()
        );
        AiCoachThreadEntity thread = existing.orElseGet(AiCoachThreadEntity::new);
        thread.setUser(user);
        thread.setLeague(user.getLeague());
        thread.setGameweek(gameweek);
        thread.setSnapshotHash(result.snapshotHash());
        thread.setAnalysisJson(write(dto));
        thread.setProvider(prose.isPresent() ? ai.providerName() : "deterministic");
        thread.setModel(prose.isPresent() ? ai.modelName() : "alex-local-v1");
        thread.setGeneratedAt(LocalDateTime.now());
        thread.setDataAsOf(result.dataAsOf());
        AiCoachThreadEntity saved = threads.save(thread);
        recordUsage(user, gameweek, "ANALYSIS");
        return readWithContext(saved);
    }

    @Transactional
    public CoachAnalysisDto ask(int actualUserId, int gameweek, CoachMessageRequest request) {
        requireEnabled();
        UserGameDataEntity user = requireUser(actualUserId);
        String question = request == null || request.message() == null ? "" : request.message().trim();
        if (question.isBlank()) throw new IllegalArgumentException("Question is required");
        if (question.length() > 500) throw new IllegalArgumentException("Question is too long");
        long used = usage.countByUser_IdAndGameweekAndUsageType(user.getId(), gameweek, "FOLLOWUP");
        if (used >= followupLimit) throw new IllegalStateException("הגעת למכסת שאלות ההמשך למחזור הזה");
        AiCoachThreadEntity thread = threads.findByUser_IdAndGameweek(user.getId(), gameweek)
                .orElseThrow(() -> new IllegalStateException("Run an Alex analysis before asking a follow-up"));
        CoachAnalysisDto analysis = read(thread.getAnalysisJson());

        saveMessage(thread, "user", question);
        String fallback = "לפי הניתוח הנוכחי, " + analysis.summary()
                + " אם הנתונים או ההרכב השתנו, הפעל ניתוח חדש לפני קבלת החלטה.";
        String payload = "ניתוח מחושב:\n" + compactAnalysis(analysis) + "\n\nשאלה: " + question;
        String answer = ai.complete(CHAT_PROMPT, payload, 300).map(this::sanitize)
                .filter(text -> !text.isBlank()).orElse(fallback);
        saveMessage(thread, "assistant", answer);
        recordUsage(user, gameweek, "FOLLOWUP");
        return readWithContext(thread);
    }

    private CoachAnalysisDto readWithContext(AiCoachThreadEntity thread) {
        CoachAnalysisDto dto = read(thread.getAnalysisJson());
        List<CoachAnalysisDto.Message> history = messages.findByThread_IdOrderByCreatedAtAsc(thread.getId()).stream()
                .map(message -> new CoachAnalysisDto.Message(message.getRole(), message.getContent(), message.getCreatedAt()))
                .toList();
        long analyses = usage.countByUser_IdAndUsageTypeAndCreatedAtGreaterThanEqual(
                thread.getUser().getId(), "ANALYSIS", LocalDate.now().atStartOfDay());
        long followups = usage.countByUser_IdAndGameweekAndUsageType(thread.getUser().getId(), thread.getGameweek(), "FOLLOWUP");
        return new CoachAnalysisDto(true, dto.gameweek(), dto.snapshotHash(), dto.dataAsOf(),
                dto.generatedByAi(), dto.summary(), dto.recommendedSquad(), dto.playerScores(),
                dto.transfers(), dto.chipSuggestion(), dto.warnings(), new CoachAnalysisDto.Quota(
                Math.max(0, analysisLimit - (int) analyses), Math.max(0, followupLimit - (int) followups)
        ), history);
    }

    private void saveMessage(AiCoachThreadEntity thread, String role, String content) {
        AiCoachMessageEntity message = new AiCoachMessageEntity();
        message.setThread(thread); message.setRole(role); message.setContent(content); message.setCreatedAt(LocalDateTime.now());
        messages.save(message);
    }
    private void recordUsage(UserGameDataEntity user, int gw, String type) {
        AiCoachUsageEntity entry = new AiCoachUsageEntity();
        entry.setUser(user); entry.setGameweek(gw); entry.setUsageType(type); entry.setCreatedAt(LocalDateTime.now());
        usage.save(entry);
    }
    private UserGameDataEntity requireUser(int actualUserId) {
        return gameData.findByUserId(actualUserId)
                .orElseThrow(() -> new IllegalStateException("Fantasy team data was not found"));
    }
    private void requireEnabled() {
        if (!enabled) throw new IllegalStateException("Alex is not enabled in this environment");
    }
    private String analysisFacts(AlexCoachEngine.EngineResult result) {
        try {
            return "ניתוח מחושב (JSON, נתונים בלבד):\n" + mapper.writeValueAsString(result);
        } catch (JsonProcessingException e) { return result.summary(); }
    }
    private String compactAnalysis(CoachAnalysisDto dto) {
        try {
            return mapper.writeValueAsString(new Object[]{dto.summary(), dto.playerScores(), dto.transfers(), dto.chipSuggestion(), dto.warnings()});
        } catch (JsonProcessingException e) { return dto.summary(); }
    }
    private String write(CoachAnalysisDto dto) {
        try { return mapper.writeValueAsString(dto); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Unable to store Alex analysis", e); }
    }
    private CoachAnalysisDto read(String value) {
        try { return mapper.readValue(value, CoachAnalysisDto.class); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Unable to read Alex analysis", e); }
    }
    private String sanitize(String content) {
        String normalized = content.replaceAll("[\\r\\n]{3,}", "\n\n").trim();
        return normalized.length() <= 1800 ? normalized : normalized.substring(0, 1800).trim();
    }
}
