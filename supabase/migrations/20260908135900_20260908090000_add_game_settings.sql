/*
# Add game settings to the single player profile

1. Modified Tables
- `player_profile`
- `music_enabled` (boolean): stores whether background music is enabled.
- `sound_enabled` (boolean): stores whether placement and clear sounds are enabled.
- `vibration_enabled` (boolean): stores whether supported devices vibrate during clears.

2. Security
- The existing single-tenant anon + authenticated CRUD policies remain in place.
- No new table or policy is introduced.

3. Important Notes
- All settings default to enabled so existing players keep the full game experience.
- The change is additive and does not remove or rewrite existing player data.
*/

ALTER TABLE player_profile
  ADD COLUMN IF NOT EXISTS music_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS vibration_enabled boolean NOT NULL DEFAULT true;