CREATE TABLE IF NOT EXISTS league_player_penalty_adjustments (
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    player_gameweek_key VARCHAR(32) NOT NULL,
    penalty_adjustment INTEGER NOT NULL,
    PRIMARY KEY (league_id, player_gameweek_key)
);
