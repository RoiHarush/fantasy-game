UPDATE gameweeks
SET transfer_open_time = NULL,
    transfer_window_processed = TRUE
WHERE id = 1;

DELETE FROM league_transfer_windows
WHERE gameweek_id = 1
  AND window_type = 'TRANSFER'
  AND status = 'READY';
