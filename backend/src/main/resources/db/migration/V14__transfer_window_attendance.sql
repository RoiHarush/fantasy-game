CREATE TABLE IF NOT EXISTS league_transfer_window_auto_users (
    window_id BIGINT NOT NULL REFERENCES league_transfer_windows(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (window_id, user_id)
);
