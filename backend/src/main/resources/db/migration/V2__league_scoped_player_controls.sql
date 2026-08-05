CREATE TABLE IF NOT EXISTS league_player_positions (
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position VARCHAR(16) NOT NULL,
    PRIMARY KEY (league_id, player_id)
);

CREATE TABLE IF NOT EXISTS league_locked_players (
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    PRIMARY KEY (league_id, player_id)
);

CREATE TABLE IF NOT EXISTS league_player_assist_adjustments (
    league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    player_gameweek_key VARCHAR(32) NOT NULL,
    assist_adjustment INTEGER NOT NULL,
    PRIMARY KEY (league_id, player_gameweek_key)
);

-- Preserve legacy locks for every pre-existing league, then retire the global
-- lock flag. New locks are always isolated by league.
INSERT INTO league_locked_players (league_id, player_id)
SELECT league.id, player.id
FROM leagues AS league
CROSS JOIN players AS player
WHERE player.state = 'LOCKED'
  AND NOT EXISTS (
      SELECT 1
      FROM league_locked_players AS existing
      WHERE existing.league_id = league.id
        AND existing.player_id = player.id
  );

UPDATE players
SET state = 'NONE'
WHERE state = 'LOCKED';
