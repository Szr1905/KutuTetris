import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PlayerProfile = {
  id: string; // Her kullanıcı için benzersiz string (UUID/LocalID)
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

// Cihaza özel benzersiz ID al veya oluştur
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem("game_device_id");
  if (!deviceId) {
    deviceId = "user_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem("game_device_id", deviceId);
  }
  return deviceId;
}

export async function getProfile(): Promise<PlayerProfile | null> {
  const deviceId = getOrCreateDeviceId();

  const { data, error } = await supabase
    .from("player_profile")
    .select("*")
    .eq("id", deviceId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  // Cihaz için henüz kayıt oluşmadıysa yeni kullanıcı profili aç
  if (!data) {
    const defaultProfile: PlayerProfile = {
      id: deviceId,
      player_name: localStorage.getItem("playerName") || "Player",
      coins: parseInt(localStorage.getItem("coins") || "0", 10),
      best_score: parseInt(localStorage.getItem("bestScore") || "0", 10),
      current_theme: localStorage.getItem("currentTheme") || "classic",
      music_enabled: true,
      sound_enabled: true,
      vibration_enabled: true,
      adventure_level: parseInt(localStorage.getItem("adventureLevel") || "1", 10),
      badges: JSON.parse(localStorage.getItem("badges") || "[]"),
      total_blocks_placed: parseInt(localStorage.getItem("totalBlocksPlaced") || "0", 10),
    };

    const { data: newData, error: insertError } = await supabase
      .from("player_profile")
      .upsert(defaultProfile)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return defaultProfile;
    }
    return newData as PlayerProfile;
  }

  return data as PlayerProfile | null;
}

export async function updateProfile(
  updates: Partial<Pick<PlayerProfile, "player_name" | "coins" | "best_score" | "current_theme" | "music_enabled" | "sound_enabled" | "vibration_enabled" | "adventure_level" | "badges" | "total_blocks_placed">>
): Promise<boolean> {
  const deviceId = getOrCreateDeviceId();

  const { error } = await supabase
    .from("player_profile")
    .upsert({ id: deviceId, ...updates });

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