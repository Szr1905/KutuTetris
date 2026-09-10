/*
# Add adventure and badge progression

1. Modified Tables
- `player_profile`
- `adventure_level` (integer): highest unlocked level from 1 through 100.
- `badges` (text array): identifiers for badges earned by the player.

2. Security
- Existing single-tenant anon + authenticated CRUD policies on `player_profile` remain unchanged.

3. Important Notes
- Existing players begin at adventure level 1 with no badges.
- Values are additive and preserve all existing profile data.
- The final level unlocks the strongest badge when completed.
*/

ALTER TABLE player_profile
  ADD COLUMN IF NOT EXISTS adventure_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';