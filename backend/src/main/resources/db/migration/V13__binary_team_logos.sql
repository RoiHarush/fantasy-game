ALTER TABLE user_game_data
    ADD COLUMN IF NOT EXISTS team_logo_bytes BYTEA;

-- V12 may already be present in a development database. Its Base64 TEXT column is
-- deliberately left untouched so Flyway history remains immutable; application
-- reads and writes use only the binary column from this migration onward.
