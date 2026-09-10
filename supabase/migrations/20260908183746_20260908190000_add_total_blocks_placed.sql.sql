/*
# Add total_blocks_placed column to player_profile

1. Modified Tables
- `player_profile`: adds `total_blocks_placed` integer column (default 0) to track
  the cumulative number of blocks a player has placed across all games. Used for
  awarding "Azimli" (50 blocks) and "Hızlı El" (200 blocks) badges.

2. Security
- No policy changes. The existing anon/authenticated CRUD policies on
  player_profile already cover the new column.

3. Notes
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ to avoid errors on re-run.
- No data loss: purely additive column with a safe default.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profile'
    AND column_name = 'total_blocks_placed'
  ) THEN
    ALTER TABLE player_profile ADD COLUMN total_blocks_placed integer NOT NULL DEFAULT 0;
  END IF;
END $$;
