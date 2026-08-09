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

        assertEquals(11, flyway.migrate().migrationsExecuted);

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
            assertTrue(hasColumn(metadata, "WAIVER_PREFERENCES", "PLAN_TYPE"));
            assertTrue(hasTable(metadata, "LEAGUE_DRAFT_CONFIG_ORDER"));
            assertTrue(hasTable(metadata, "LEAGUE_SUPPLEMENTAL_DRAFT_POOL"));
            assertTrue(hasTable(metadata, "WAIVER_PLAN_PROGRESS"));
            assertTrue(hasTable(metadata, "LEAGUE_TRANSFER_WINDOW_CANONICAL_ORDER"));
            assertFalse(hasColumn(metadata, "PLAYERS", "OWNER_ID"));
            assertFalse(hasColumn(metadata, "PLAYERS", "STATE"));

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
