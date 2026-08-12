ALTER TABLE fixtures
    ADD COLUMN IF NOT EXISTS postponed_from_gameweek_id INTEGER;

CREATE INDEX IF NOT EXISTS ix_fixtures_postponed_from_gameweek
    ON fixtures (postponed_from_gameweek_id);
