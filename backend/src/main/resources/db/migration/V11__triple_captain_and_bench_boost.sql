ALTER TABLE user_squads
    ADD COLUMN IF NOT EXISTS triple_captain_active BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE user_squads
    ADD COLUMN IF NOT EXISTS bench_boost_active BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO user_chips (user_id, chip_name, count)
SELECT game_data.id, 'TRIPLE_CAPTAIN', 1
FROM user_game_data AS game_data
WHERE NOT EXISTS (
    SELECT 1
    FROM user_chips AS chip
    WHERE chip.user_id = game_data.id
      AND chip.chip_name = 'TRIPLE_CAPTAIN'
);

INSERT INTO user_chips (user_id, chip_name, count)
SELECT game_data.id, 'BENCH_BOOST', 1
FROM user_game_data AS game_data
WHERE NOT EXISTS (
    SELECT 1
    FROM user_chips AS chip
    WHERE chip.user_id = game_data.id
      AND chip.chip_name = 'BENCH_BOOST'
);

INSERT INTO user_active_chips (user_id, chip_name, active)
SELECT game_data.id, 'TRIPLE_CAPTAIN', FALSE
FROM user_game_data AS game_data
WHERE NOT EXISTS (
    SELECT 1
    FROM user_active_chips AS chip
    WHERE chip.user_id = game_data.id
      AND chip.chip_name = 'TRIPLE_CAPTAIN'
);

INSERT INTO user_active_chips (user_id, chip_name, active)
SELECT game_data.id, 'BENCH_BOOST', FALSE
FROM user_game_data AS game_data
WHERE NOT EXISTS (
    SELECT 1
    FROM user_active_chips AS chip
    WHERE chip.user_id = game_data.id
      AND chip.chip_name = 'BENCH_BOOST'
);
