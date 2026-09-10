/*
# Block Blast - Create game tables (single-tenant, no auth)

1. New Tables
- `player_profile`: stores the player's name, coins, best score, and selected theme.
  - `id` (serial, primary key)
  - `player_name` (text, default 'Player')
  - `coins` (integer, default 100)
  - `best_score` (integer, default 0)
  - `current_theme` (text, default 'classic')
  - `created_at` (timestamptz)
- `leaderboard`: stores top scores with player names.
  - `id` (serial, primary key)
  - `player_name` (text, not null)
  - `score` (integer, not null)
  - `coins` (integer, default 0)
  - `created_at` (timestamptz)
- `purchases`: records purchases made in the shop.
  - `id` (serial, primary key)
  - `player_name` (text, not null)
  - `item_id` (text, not null)
  - `item_name` (text, not null)
  - `cost` (integer, not null)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD because the app is single-tenant with no sign-in (public/shared data).

3. Notes
- The app uses a single player profile stored in player_profile (id=1).
- Leaderboard is globally visible to all players.
- Purchases track shop transaction history.
*/

CREATE TABLE IF NOT EXISTS player_profile (
  id integer PRIMARY KEY DEFAULT 1,
  player_name text NOT NULL DEFAULT 'Player',
  coins integer NOT NULL DEFAULT 100,
  best_score integer NOT NULL DEFAULT 0,
  current_theme text NOT NULL DEFAULT 'classic',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT single_profile CHECK (id = 1)
);

ALTER TABLE player_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profile" ON player_profile;
CREATE POLICY "anon_select_profile" ON player_profile FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profile" ON player_profile;
CREATE POLICY "anon_insert_profile" ON player_profile FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profile" ON player_profile;
CREATE POLICY "anon_update_profile" ON player_profile FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profile" ON player_profile;
CREATE POLICY "anon_delete_profile" ON player_profile FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leaderboard" ON leaderboard;
CREATE POLICY "anon_select_leaderboard" ON leaderboard FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leaderboard" ON leaderboard;
CREATE POLICY "anon_insert_leaderboard" ON leaderboard FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leaderboard" ON leaderboard;
CREATE POLICY "anon_update_leaderboard" ON leaderboard FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leaderboard" ON leaderboard;
CREATE POLICY "anon_delete_leaderboard" ON leaderboard FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  cost integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_purchases" ON purchases;
CREATE POLICY "anon_select_purchases" ON purchases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_purchases" ON purchases;
CREATE POLICY "anon_insert_purchases" ON purchases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_purchases" ON purchases;
CREATE POLICY "anon_update_purchases" ON purchases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_purchases" ON purchases;
CREATE POLICY "anon_delete_purchases" ON purchases FOR DELETE
  TO anon, authenticated USING (true);

-- Seed the single profile row if it doesn't exist
INSERT INTO player_profile (id, player_name, coins, best_score, current_theme)
VALUES (1, 'Player', 100, 0, 'classic')
ON CONFLICT (id) DO NOTHING;

-- Add index for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard (score DESC);
