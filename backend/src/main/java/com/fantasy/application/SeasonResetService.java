package com.fantasy.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SeasonResetService {

    private static final Logger log = LoggerFactory.getLogger(SeasonResetService.class);

    private static final List<String> DELETE_ORDER = List.of(
            "user_squad_starting",
            "user_squad_bench",
            "user_squad_formation",
            "user_chips",
            "user_active_chips",
            "user_watched_players",
            "user_points",
            "gameweek_transfer_order",
            "league_transfer_window_order",
            "league_transfer_window_canonical_order",
            "league_transfer_window_ir_order",
            "league_transfer_window_auto_users",
            "league_transfer_actions",
            "waiver_preferences",
            "waiver_plan_progress",
            "league_player_penalty_adjustments",
            "league_player_assist_adjustments",
            "league_locked_players",
            "league_player_positions",
            "league_supplemental_draft_pool",
            "league_transfer_windows",
            "league_draft_config_order",
            "league_draft_config",
            "league_scoring_rules",
            "user_squads",
            "user_game_data",
            "league_users",
            "gameweek_daily_status",
            "player_fixture_stats",
            "player_gameweek_stats",
            "player_points",
            "leagues",
            "users",
            "fixtures",
            "gameweeks",
            "players",
            "teams"
    );

    private static final List<String> IDENTITY_TABLES = List.of(
            "users",
            "leagues",
            "player_gameweek_stats",
            "player_fixture_stats",
            "player_points",
            "user_game_data",
            "user_squads",
            "user_points",
            "gameweek_daily_status",
            "gameweek_transfer_order",
            "league_transfer_windows",
            "league_transfer_actions",
            "league_supplemental_draft_pool",
            "league_draft_config",
            "waiver_preferences",
            "waiver_plan_progress"
    );

    private final JdbcTemplate jdbcTemplate;

    public SeasonResetService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Deletes all application data while preserving the Flyway-managed schema.
     * The explicit order keeps the operation portable between H2 and PostgreSQL.
     */
    @Transactional
    public ResetSummary resetAllData() {
        log.warn("Starting destructive season reset");

        jdbcTemplate.update(
                "UPDATE user_game_data SET current_squad_id = NULL, next_squad_id = NULL"
        );

        int deletedRows = 0;
        for (String table : DELETE_ORDER) {
            int deleted = jdbcTemplate.update("DELETE FROM " + table);
            deletedRows += deleted;
            log.info("Season reset deleted {} rows from {}", deleted, table);
        }

        for (String table : IDENTITY_TABLES) {
            jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN id RESTART WITH 1");
        }

        log.warn(
                "Season reset completed; deleted {} rows and reset {} identity counters",
                deletedRows,
                IDENTITY_TABLES.size()
        );
        return new ResetSummary(deletedRows, DELETE_ORDER.size());
    }

    public record ResetSummary(int deletedRows, int clearedTables) {
    }
}
