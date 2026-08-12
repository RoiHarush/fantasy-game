ALTER TABLE user_game_data
    DROP COLUMN IF EXISTS team_logo_data;

DROP TABLE IF EXISTS gameweek_transfer_order;

ALTER TABLE user_squads
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
