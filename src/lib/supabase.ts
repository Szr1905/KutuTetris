import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PlayerProfile = {
  id: number;
  player_name: string;
  coins: number;
  best_score: number;
  current_theme: string;
  music_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  adventure_level: number;
  badges: string[];
  total_blocks_placed: number;
};

export type LeaderboardEntry = {
  id: string;
  player_name: string;
  score: number;
  coins: number;
  created_at: string;
};

export async function getProfile(): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from("player_profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data as PlayerProfile | null;
}

export async function updateProfile(
  updates: Partial<Pick<PlayerProfile, "player_name" | "coins" | "best_score" | "current_theme" | "music_enabled" | "sound_enabled" | "vibration_enabled" | "adventure_level" | "badges" | "total_blocks_placed">>
): Promise<boolean> {
  const { error } = await supabase
    .from("player_profile")
    .update(updates)
    .eq("id", 1);
  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }
  return true;
}

export async function submitScore(
  playerName: string,
  score: number,
  coins: number
): Promise<boolean> {
  const { error } = await supabase
    .from("leaderboard")
    .insert({ player_name: playerName, score, coins });
  if (error) {
    console.error("Error submitting score:", error);
    return false;
  }
  return true;
}

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
  return (data as LeaderboardEntry[]) || [];
}
