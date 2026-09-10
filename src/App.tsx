import { useState, useEffect, useCallback } from "react";
import MenuScreen from "./components/MenuScreen";
import GameScreen from "./components/GameScreen";
import ShopScreen from "./components/ShopScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import MoreGamesScreen from "./components/MoreGamesScreen";
import TicTacToeScreen from "./components/games/TicTacToeScreen";
import WaterSortScreen from "./components/games/WaterSortScreen";
import OnetScreen from "./components/games/OnetScreen";
import SudokuScreen from "./components/games/SudokuScreen";
import BlockSlideScreen from "./components/games/BlockSlideScreen";
import IntroScreen from "./components/IntroScreen";
import AdventureScreen from "./components/AdventureScreen";
import BadgesScreen from "./components/BadgesScreen";
import { getTheme, THEMES } from "./lib/themes";
import {
  getProfile,
  updateProfile,
  submitScore,
  type PlayerProfile,
} from "./lib/supabase";

type Screen = "menu" | "game" | "adventure" | "badges" | "leaderboard" | "more-games" | "tic-tac-toe" | "water-sort" | "onet" | "sudoku" | "block-slide";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownedThemes, setOwnedThemes] = useState<string[]>(["classic"]);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [gameLevel, setGameLevel] = useState(1);
  const [gameMode, setGameMode] = useState<"main" | "adventure">("main");

  const currentTheme = profile ? getTheme(profile.current_theme) : THEMES[0];

  // Load profile
  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        // Load owned themes from localStorage
        const stored = localStorage.getItem("ownedThemes");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as string[];
            setOwnedThemes(parsed.includes("classic") ? parsed : ["classic", ...parsed.filter((t) => t !== "classic")]);
          } catch {
            setOwnedThemes(["classic"]);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const handlePlay = (level: number = 1, mode: "main" | "adventure" = "main") => {
    setGameLevel(level);
    setGameMode(mode);
    setScreen("game");
  };

  const handleGameOver = useCallback(
    async (score: number, coinsEarned: number, levelCompleted: boolean, stats: { maxCombo: number; maxMultiClear: number; blocksPlaced: number }) => {
      if (!profile) return;
      const newCoins = profile.coins + coinsEarned;
      const newBest = Math.max(profile.best_score, score);
      const totalBlocksPlaced = (profile.total_blocks_placed || 0) + stats.blocksPlaced;

      const newBadges = [...profile.badges];
      const addBadge = (id: string, condition: boolean) => {
        if (condition && !newBadges.includes(id)) newBadges.push(id);
      };

      addBadge("first-line", score > 0);
      addBadge("combo-3", stats.maxCombo >= 3);
      addBadge("combo-5", stats.maxCombo >= 5);
      addBadge("combo-10", stats.maxCombo >= 10);
      addBadge("score-100", score >= 100);
      addBadge("score-500", score >= 500);
      addBadge("score-1000", score >= 1000);
      addBadge("score-2500", score >= 2500);
      addBadge("score-5000", score >= 5000);
      addBadge("score-10000", score >= 10000);
      addBadge("multi-2", stats.maxMultiClear >= 2);
      addBadge("multi-3", stats.maxMultiClear >= 3);
      addBadge("multi-4", stats.maxMultiClear >= 4);
      addBadge("place-50", totalBlocksPlaced >= 50);
      addBadge("place-200", totalBlocksPlaced >= 200);

      let newLevel = profile.adventure_level;
      if (levelCompleted && gameMode === "adventure") {
        newLevel = Math.min(100, profile.adventure_level + 1);
        addBadge("level-10", newLevel >= 10);
        addBadge("level-25", newLevel >= 25);
        addBadge("level-50", newLevel >= 50);
        addBadge("level-75", newLevel >= 75);
        addBadge("level-100", newLevel >= 100);
      }

      await updateProfile({
        coins: newCoins,
        best_score: newBest,
        adventure_level: newLevel,
        badges: newBadges,
        total_blocks_placed: totalBlocksPlaced,
      });

      await submitScore(profile.player_name, score, coinsEarned);

      setProfile({ ...profile, coins: newCoins, best_score: newBest, adventure_level: newLevel, badges: newBadges, total_blocks_placed: totalBlocksPlaced });
      if (levelCompleted && gameMode === "adventure") {
        setGameLevel(newLevel);
        setScreen("game");
      } else {
        setScreen("menu");
      }
    },
    [profile, gameMode]
  );

  const handleBuy = useCallback(
    (themeId: string, cost: number) => {
      if (!profile || profile.coins < cost) return;
      const newCoins = profile.coins - cost;
      const newOwned = [...ownedThemes, themeId];

      setProfile({ ...profile, coins: newCoins });
      setOwnedThemes(newOwned);
      localStorage.setItem("ownedThemes", JSON.stringify(newOwned));
      updateProfile({ coins: newCoins, current_theme: themeId });
    },
    [profile, ownedThemes]
  );

  const handleEquip = useCallback(
    (themeId: string) => {
      if (!profile || !ownedThemes.includes(themeId)) return;
      setProfile({ ...profile, current_theme: themeId });
      updateProfile({ current_theme: themeId });
    },
    [profile, ownedThemes]
  );

  const handleBuyCoins = useCallback(
    (amount: number) => {
      if (!profile) return;
      const newCoins = profile.coins + amount;
      setProfile({ ...profile, coins: newCoins });
      updateProfile({ coins: newCoins });
    },
    [profile]
  );

  const handleSaveName = useCallback(() => {
    if (!profile || !tempName.trim()) {
      setEditingName(false);
      return;
    }
    const name = tempName.trim().slice(0, 20);
    setProfile({ ...profile, player_name: name });
    updateProfile({ player_name: name });
    setEditingName(false);
  }, [profile, tempName]);

  const handleMiniGameScore = useCallback(
    (score: number) => {
      if (!profile) return;
      const newCoins = profile.coins + score;
      setProfile({ ...profile, coins: newCoins });
      updateProfile({ coins: newCoins });
    },
    [profile]
  );

  const handleSettingsChange = useCallback(
    (key: "music_enabled" | "sound_enabled" | "vibration_enabled" | "adventure_level" | "badges", value: any) => {
      if (!profile) return;
      setProfile({ ...profile, [key]: value });
      updateProfile({ [key]: value });
    },
    [profile]
  );

  if (loading) {
    return (
      <div
        style={{
          background: "#0f1525",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: "'Nunito', sans-serif",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  return (
    <>
      {showIntro && <IntroScreen onDone={() => setShowIntro(false)} />}

      {screen === "menu" && (
        <MenuScreen
          theme={currentTheme}
          playerName={profile?.player_name || "Player"}
          coins={profile?.coins || 0}
          bestScore={profile?.best_score || 0}
          onPlay={() => handlePlay(1, "main")}
          onShop={() => setScreen("badges")}
          onLeaderboard={() => setScreen("adventure")}
          onMoreGames={() => setScreen("more-games")}
          musicEnabled={profile?.music_enabled ?? true}
          soundEnabled={profile?.sound_enabled ?? true}
          vibrationEnabled={profile?.vibration_enabled ?? true}
          onSettingsChange={handleSettingsChange}
          onEditName={() => {
            setTempName(profile?.player_name || "");
            setEditingName(true);
          }}
        />
      )}

      {screen === "game" && (
        <GameScreen
          key={`${gameMode}-${gameLevel}`}
          theme={currentTheme}
          bestScore={profile?.best_score || 0}
          adventureLevel={gameLevel}
          mode={gameMode}
          soundEnabled={profile?.sound_enabled ?? true}
          vibrationEnabled={profile?.vibration_enabled ?? true}
          onExit={() => setScreen("menu")}
          onGameOver={handleGameOver}
        />
      )}

      {screen === "adventure" && (
        <AdventureScreen
          theme={currentTheme}
          currentLevel={profile?.adventure_level || 1}
          onBack={() => setScreen("menu")}
          onPlay={() => handlePlay(profile?.adventure_level || 1, "adventure")}
        />
      )}

      {screen === "badges" && (
        <BadgesScreen
          theme={currentTheme}
          badges={profile?.badges || []}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "leaderboard" && (
        <LeaderboardScreen
          theme={currentTheme}
          playerBestScore={profile?.best_score || 0}
          playerName={profile?.player_name || "Player"}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "more-games" && (
        <MoreGamesScreen
          theme={currentTheme}
          onBack={() => setScreen("menu")}
          onSelectGame={(gameId) => setScreen(gameId as Screen)}
        />
      )}

      {screen === "tic-tac-toe" && (
        <TicTacToeScreen
          theme={currentTheme}
          onBack={() => setScreen("more-games")}
          onScore={handleMiniGameScore}
        />
      )}

      {screen === "water-sort" && (
        <WaterSortScreen
          theme={currentTheme}
          onBack={() => setScreen("more-games")}
          onScore={handleMiniGameScore}
        />
      )}

      {screen === "onet" && (
        <OnetScreen
          theme={currentTheme}
          onBack={() => setScreen("more-games")}
          onScore={handleMiniGameScore}
        />
      )}

      {screen === "sudoku" && (
        <SudokuScreen
          theme={currentTheme}
          onBack={() => setScreen("more-games")}
          onScore={handleMiniGameScore}
        />
      )}

      {screen === "block-slide" && (
        <BlockSlideScreen
          theme={currentTheme}
          onBack={() => setScreen("more-games")}
          onScore={handleMiniGameScore}
        />
      )}

      {/* Name edit modal */}
      {editingName && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditingName(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: currentTheme.headerBg,
              borderRadius: 20,
              padding: "32px 36px",
              textAlign: "center",
              maxWidth: 320,
              width: "90%",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✏️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px 0", color: currentTheme.textColor }}>
              İsim Değiştir
            </h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                border: `2px solid ${currentTheme.accent}55`,
                borderRadius: 12,
                padding: "12px 16px",
                color: currentTheme.textColor,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20,
                textAlign: "center",
              }}
              placeholder="İsmin..."
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditingName(false)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.1)",
                  color: currentTheme.textColor,
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                İptal
              </button>
              <button
                onClick={handleSaveName}
                style={{
                  flex: 1,
                  background: currentTheme.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
