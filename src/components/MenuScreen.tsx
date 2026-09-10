import { useState } from "react";
import type { Theme } from "../lib/themes";

type MenuScreenProps = {
  theme: Theme;
  playerName: string;
  coins: number;
  bestScore: number;
  onPlay: () => void;
  onShop: () => void;
  onLeaderboard: () => void;
  onMoreGames: () => void;
  musicEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onSettingsChange: (key: "music_enabled" | "sound_enabled" | "vibration_enabled", value: boolean) => void;
  onEditName: () => void;
};

export default function MenuScreen({
  theme,
  playerName,
  coins,
  bestScore,
  onPlay,
  onShop,
  onLeaderboard,
  onMoreGames,
  musicEnabled,
  soundEnabled,
  vibrationEnabled,
  onSettingsChange,
  onEditName,
}: MenuScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background blocks */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(12)].map((_, i) => {
          const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#ec4899"];
          const left = (i * 37) % 100;
          const top = (i * 53) % 100;
          const size = 30 + (i % 4) * 15;
          const delay = i * 0.3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: colors[i % colors.length],
                borderRadius: 8,
                opacity: 0.06,
                animation: `floatBlock ${8 + (i % 5)}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, textAlign: "center" }}>
        {/* Title */}
        <div style={{ marginBottom: 8, animation: "titleBounce 0.6s ease" }}>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 700,
              fontFamily: "'Fredoka', sans-serif",
              margin: 0,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${theme.accent}, #ffffff)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: -1,
            }}
          >
            Kutu
          </h1>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 700,
              fontFamily: "'Fredoka', sans-serif",
              margin: 0,
              lineHeight: 1,
              color: theme.accent,
              letterSpacing: -1,
            }}
          >
            Tetris
          </h1>
        </div>

        {/* Decorative blocks */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                background: c,
                borderRadius: 4,
                animation: `blockPulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: `0 2px 8px ${c}66`,
              }}
            />
          ))}
        </div>

        {/* Player card */}
        <div
          style={{
            background: theme.headerBg,
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div
              style={{ fontSize: 13, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}
            >
              Oyuncu
            </div>
            <div
              onClick={onEditName}
              style={{
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {playerName}
              <span style={{ fontSize: 13, opacity: 0.5 }}>✏️</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: 13, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}
            >
              En İyi
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>
              {bestScore}
            </div>
          </div>
        </div>

        {/* Coins display */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "10px 20px",
            marginBottom: 28,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          🪙 {coins} Coin
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          style={{
            width: "100%",
            background: theme.accent,
            color: "#fff",
            border: "none",
            borderRadius: 18,
            padding: "18px 32px",
            fontSize: 24,
            fontWeight: 800,
            fontFamily: "'Fredoka', sans-serif",
            cursor: "pointer",
            marginBottom: 12,
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: `0 8px 24px ${theme.accent}44`,
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ▶ Oyna
        </button>

        {/* Secondary buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onShop}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              color: theme.textColor,
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🛒 Rozetler
          </button>
          <button
            onClick={onLeaderboard}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              color: theme.textColor,
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🏆 Serüven
          </button>
        </div>

        {/* More Games button */}
        <button
          onClick={onMoreGames}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            color: theme.textColor,
            border: "none",
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            marginTop: 12,
            transition: "background 0.2s, transform 0.15s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🎮 Diğer Oyunlar
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            width: "100%",
            background: "transparent",
            color: theme.textColor,
            border: "none",
            padding: "14px 16px",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            marginTop: 4,
            opacity: 0.75,
          }}
        >
          ⚙ Ayarlar
        </button>
      </div>

      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: theme.headerBg,
              borderRadius: 22,
              padding: 26,
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontFamily: "'Fredoka', sans-serif", fontSize: 24 }}>Ayarlar</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{ background: "transparent", border: "none", color: theme.textColor, fontSize: 22, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            {[
              { key: "music_enabled" as const, label: "Müzik", icon: "♫", value: musicEnabled },
              { key: "sound_enabled" as const, label: "Ses Efektleri", icon: "🔊", value: soundEnabled },
              { key: "vibration_enabled" as const, label: "Titreşim", icon: "▦", value: vibrationEnabled },
            ].map((setting) => (
              <button
                key={setting.key}
                onClick={() => onSettingsChange(setting.key, !setting.value)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 14,
                  color: theme.textColor,
                  padding: "14px 16px",
                  marginBottom: 10,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span>{setting.icon} {setting.label}</span>
                <span
                  style={{
                    width: 42,
                    height: 24,
                    borderRadius: 20,
                    background: setting.value ? theme.accent : "rgba(255,255,255,0.18)",
                    padding: 3,
                    display: "flex",
                    justifyContent: setting.value ? "flex-end" : "flex-start",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff" }} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
