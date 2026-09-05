ALTER TABLE user_game_data
    ADD COLUMN IF NOT EXISTS team_logo_present BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_team_logos (
    user_game_data_id INTEGER PRIMARY KEY
        REFERENCES user_game_data(id) ON DELETE CASCADE,
    logo_bytes BYTEA NOT NULL,
    content_type VARCHAR(50) NOT NULL
);

INSERT INTO user_team_logos (user_game_data_id, logo_bytes, content_type)
SELECT id, team_logo_bytes, COALESCE(team_logo_content_type, 'image/png')
FROM user_game_data
WHERE team_logo_bytes IS NOT NULL
  AND OCTET_LENGTH(team_logo_bytes) > 0;

UPDATE user_game_data
SET team_logo_present = EXISTS (
    SELECT 1
    FROM user_team_logos logo
    WHERE logo.user_game_data_id = user_game_data.id
);

ALTER TABLE user_game_data
    DROP COLUMN IF EXISTS team_logo_bytes;

ALTER TABLE user_game_data
    DROP COLUMN IF EXISTS team_logo_content_type;
