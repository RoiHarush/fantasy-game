package com.fantasy.application;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SeasonResetServiceTest {

    @Test
    void clearsApplicationDataAndPreservesSchemaHistory() {
        String url = "jdbc:h2:mem:season-reset;MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
        var dataSource = new DriverManagerDataSource(url, "sa", "");
        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        jdbc.update("INSERT INTO teams (id, name, short_name, code, asset_code) "
                + "VALUES (1, 'Arsenal', 'ARS', 1, 3)");
        jdbc.update("INSERT INTO players (id, first_name, last_name, view_name, position, team_id) "
                + "VALUES (1, 'Test', 'Player', 'Player', 'FORWARD', 1)");
        jdbc.update("INSERT INTO gameweeks (id, name) VALUES (1, 'Gameweek 1')");
        jdbc.update("INSERT INTO fixtures (id, gameweek_id, home_team_id, away_team_id) "
                + "VALUES (1, 1, 1, 2)");
        jdbc.update("INSERT INTO users (username, email, email_verified, password, name, role, registered_at) "
                + "VALUES ('owner', 'owner@example.com', TRUE, 'hash', 'Owner', 'ROLE_USER', CURRENT_TIMESTAMP)");
        jdbc.update("INSERT INTO leagues (name, league_code, admin_id) "
                + "SELECT 'League', 'ABC123', id FROM users WHERE username = 'owner'");
        jdbc.update("INSERT INTO league_users (league_id, user_id) "
                + "SELECT leagues.id, users.id FROM leagues CROSS JOIN users");
        jdbc.update("INSERT INTO push_subscriptions "
                + "(user_id, endpoint, p256dh, auth_secret, created_at, updated_at) "
                + "SELECT id, 'https://push.example/subscription', 'p256dh', 'auth', "
                + "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM users WHERE username = 'owner'");
        jdbc.update("INSERT INTO notification_deliveries "
                + "(event_id, user_id, channel, delivered_at) "
                + "SELECT 'test-event', id, 'PUSH', CURRENT_TIMESTAMP "
                + "FROM users WHERE username = 'owner'");

        var summary = new SeasonResetService(jdbc).resetAllData();

        assertEquals(47, summary.clearedTables());
        assertEquals(0, count(jdbc, "teams"));
        assertEquals(0, count(jdbc, "players"));
        assertEquals(0, count(jdbc, "fixtures"));
        assertEquals(0, count(jdbc, "gameweeks"));
        assertEquals(0, count(jdbc, "users"));
        assertEquals(0, count(jdbc, "leagues"));
        assertEquals(0, count(jdbc, "push_subscriptions"));
        assertEquals(0, count(jdbc, "notification_deliveries"));
        assertEquals(26, jdbc.queryForObject(
                "SELECT COUNT(*) FROM \"flyway_schema_history\" WHERE \"version\" IS NOT NULL",
                Integer.class
        ));

        jdbc.update("INSERT INTO users (username, email, email_verified, password, name, role, registered_at) "
                + "VALUES ('first-new-user', 'first@example.com', TRUE, 'hash', 'First', 'ROLE_USER', CURRENT_TIMESTAMP)");
        assertEquals(1, jdbc.queryForObject(
                "SELECT id FROM users WHERE username = 'first-new-user'",
                Integer.class
        ));
    }

    private int count(JdbcTemplate jdbc, String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
    }
}
