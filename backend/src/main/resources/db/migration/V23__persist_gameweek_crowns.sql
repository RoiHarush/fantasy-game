ALTER TABLE user_squads ADD COLUMN crown_player_id INTEGER;
ALTER TABLE user_squads ADD COLUMN crown_points INTEGER;
ALTER TABLE user_squads ADD COLUMN crown_awarded_at TIMESTAMP;

ALTER TABLE user_squads ADD CONSTRAINT fk_user_squads_crown_player
    FOREIGN KEY (crown_player_id) REFERENCES players(id);

CREATE INDEX ix_user_squads_gameweek_crown
    ON user_squads (gameweek, crown_player_id);
