package com.fantasy.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseMigrationTest {

    @Test
    void createsACompleteFreshSchemaAndRemovesLegacyOwnership() throws Exception {
        String url = "jdbc:h2:mem:flyway-baseline;MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
        Flyway flyway = Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .load();

        assertEquals(21, flyway.migrate().migrationsExecuted);

        try (var connection = DriverManager.getConnection(url, "sa", "")) {
            var metadata = connection.getMetaData();
            assertTrue(hasColumn(metadata, "LEAGUES", "STATUS"));
            assertTrue(hasColumn(metadata, "USER_GAME_DATA", "LEAGUE_ID"));
            assertTrue(hasColumn(metadata, "TEAMS", "CODE"));
            assertTrue(hasColumn(metadata, "TEAMS", "ASSET_CODE"));
            assertTrue(hasColumn(metadata, "LEAGUE_TRANSFER_ACTIONS", "PLAYER_IN_ID"));
            assertTrue(hasColumn(metadata, "PLAYERS", "FIRST_SEEN_AT"));
            assertTrue(hasColumn(metadata, "LEAGUE_DRAFT_CONFIG", "DRAFT_TYPE"));
            assertTrue(hasColumn(metadata, "LEAGUE_DRAFT_CONFIG", "ORDER_SOURCE"));
            assertTrue(hasColumn(metadata, "USERS", "FIRST_NAME"));
            assertTrue(hasColumn(metadata, "USERS", "LAST_NAME"));
            assertTrue(hasColumn(metadata, "USERS", "EMAIL"));
            assertTrue(hasColumn(metadata, "USERS", "EMAIL_VERIFIED"));
            assertTrue(hasTable(metadata, "AUTH_TOKENS"));
            assertTrue(hasTable(metadata, "AI_ROASTS"));
            assertTrue(hasTable(metadata, "PUSH_SUBSCRIPTIONS"));
            assertTrue(hasTable(metadata, "NOTIFICATION_DELIVERIES"));
            assertTrue(hasColumn(metadata, "WAIVER_PREFERENCES", "PLAN_TYPE"));
            assertTrue(hasColumn(metadata, "USER_SQUADS", "TRIPLE_CAPTAIN_ACTIVE"));
            assertTrue(hasColumn(metadata, "USER_SQUADS", "BENCH_BOOST_ACTIVE"));
            assertTrue(hasColumn(metadata, "USER_GAME_DATA", "TEAM_LOGO_BYTES"));
            assertTrue(hasColumn(metadata, "USER_GAME_DATA", "TEAM_LOGO_CONTENT_TYPE"));
            assertTrue(hasColumn(metadata, "USER_GAME_DATA", "TEAM_LOGO_VERSION"));
            assertTrue(hasTable(metadata, "LEAGUE_DRAFT_CONFIG_ORDER"));
            assertTrue(hasTable(metadata, "LEAGUE_SUPPLEMENTAL_DRAFT_POOL"));
            assertTrue(hasTable(metadata, "WAIVER_PLAN_PROGRESS"));
            assertTrue(hasTable(metadata, "LEAGUE_TRANSFER_WINDOW_CANONICAL_ORDER"));
            assertTrue(hasTable(metadata, "PLAYER_FIXTURE_STATS"));
            assertTrue(hasTable(metadata, "LEAGUE_TRANSFER_WINDOW_AUTO_USERS"));
            assertTrue(hasColumn(metadata, "USER_SQUADS", "VERSION"));
            assertTrue(hasTable(metadata, "AUTO_SUBSTITUTIONS"));
            assertTrue(hasColumn(metadata, "FIXTURES", "POSTPONED_FROM_GAMEWEEK_ID"));
            assertFalse(hasColumn(metadata, "PLAYERS", "OWNER_ID"));
            assertFalse(hasColumn(metadata, "PLAYERS", "STATE"));
            assertFalse(hasColumn(metadata, "USER_GAME_DATA", "TEAM_LOGO_DATA"));
            assertFalse(hasTable(metadata, "GAMEWEEK_TRANSFER_ORDER"));

            try (var statement = connection.createStatement()) {
                statement.executeUpdate("INSERT INTO teams (id, name, short_name, code, asset_code) "
                        + "VALUES (1, 'Arsenal', 'ARS', 1, 3)");
            }
            try (var statement = connection.createStatement();
                 var result = statement.executeQuery("SELECT id, code, asset_code FROM teams WHERE id = 1")) {
                assertTrue(result.next());
                assertEquals(result.getInt("id"), result.getInt("code"));
                assertEquals(3, result.getInt("asset_code"));
            }
        }
    }

    private boolean hasColumn(java.sql.DatabaseMetaData metadata,
                              String table,
                              String column) throws Exception {
        try (var columns = metadata.getColumns(null, "PUBLIC", table, column)) {
            return columns.next();
        }
    }

    private boolean hasTable(java.sql.DatabaseMetaData metadata,
                             String table) throws Exception {
        try (var tables = metadata.getTables(null, "PUBLIC", table, new String[] {"TABLE"})) {
            return tables.next();
        }
    }
}
