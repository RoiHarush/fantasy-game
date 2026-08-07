ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS asset_code INTEGER;

-- V6 stored FPL's external club code in teams.code. Preserve it exclusively
-- for image URLs, then make the application's team identity unambiguous.
UPDATE teams
SET asset_code = code
WHERE asset_code IS NULL;

UPDATE teams
SET code = id;

ALTER TABLE teams
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE teams
    ADD CONSTRAINT ck_teams_code_matches_id CHECK (code = id);

CREATE UNIQUE INDEX uk_teams_code
    ON teams (code);
