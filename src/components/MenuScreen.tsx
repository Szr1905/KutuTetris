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
  const [lang, setLang] = useState<"tr" | "en">("tr");

  const t = {
    tr: {
      player: "Oyuncu",
      best: "En İyi Skor",
      play: "Oyna",
      moreGames: "Diğer Oyunlar",
      settings: "⚙ Ayarlar",
      settingsTitle: "Ayarlar",
      soundEffects: "Ses Efektleri",
      vibration: "Titreşim",
      language: "Dil / Language",
    },
    en: {
      player: "Player",
      best: "Best Score",
      play: "Play",
      moreGames: "More Games",
      settings: "⚙ Settings",
      settingsTitle: "Settings",
      soundEffects: "Sound Effects",
      vibration: "Vibration",
      language: "Language / Dil",
    },
  }[lang];

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #3b28cc 0%, #2563eb 50%, #1d4ed8 100%)",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "'Fredoka', 'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes blockFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
        .btn-3d {
          position: relative;
          display: flex;
          alignItems: center;
          justifyContent: center;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          transition: transform 0.1s ease, filter 0.15s ease;
          user-select: none;
          WebkitUserSelect: none;
        }
        .btn-3d:active {
          transform: translateY(4px) scale(0.98) !important;
          box-shadow: 0 2px 0px rgba(0,0,0,0.4) !important;
        }
      `}</style>

      {/* Arka Plan Parlama Efekti ve 3D Yüzen Bloklar */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 320,
            height: 320,
            background: "radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, rgba(37, 99, 235, 0) 70%)",
            borderRadius: "50%",
            animation: "glowPulse 4s ease-in-out infinite",
          }}
        />
        {[...Array(14)].map((_, i) => {
          const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#ec4899"];
          const left = (i * 29) % 95;
          const top = (i * 47) % 95;
          const size = 28 + (i % 4) * 12;
          const delay = i * 0.25;
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
                opacity: 0.12,
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.4)",
                animation: `blockFloat ${6 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, textAlign: "center" }}>
        
        {/* Renkli ve 3D Kabartmalı Logo Başlığı */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, marginBottom: -6 }}>
            {["B", "L", "O", "C", "K"].map((letter, idx) => {
              const letterColors = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff"];
              return (
                <span
                  key={idx}
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    color: letterColors[idx % letterColors.length],
                    textShadow: `
                      0 1px 0 #b30000,
                      0 2px 0 #800000,
                      0 3px 0 #660000,
                      0 4px 0 #4d0000,
                      0 6px 12px rgba(0,0,0,0.5)
                    `,
                    letterSpacing: -1,
                    display: "inline-block",
                    transform: idx % 2 === 0 ? "rotate(-3deg)" : "rotate(3deg)",
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
            {["T", "E", "T", "R", "I", "S"].map((letter, idx) => {
              return (
                <span
                  key={idx}
                  style={{
                    fontSize: 50,
                    fontWeight: 900,
                    color: "#ffffff",
                    textShadow: `
                      0 1px 0 #93c5fd,
                      0 2px 0 #3b82f6,
                      0 3px 0 #1d4ed8,
                      0 4px 0 #1e40af,
                      0 6px 12px rgba(0,0,0,0.6)
                    `,
                    letterSpacing: 0,
                    display: "inline-block",
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>

        {/* İstatistikler / Kapsül Kartları */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {/* Oyuncu Adı Kapsülü */}
          <div
            onClick={onEditName}
            style={{
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 20,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                👤
              </div>
              <span style={{ fontSize: 14, color: "#93c5fd", fontWeight: 700 }}>{t.player}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>
              {playerName}
              <span style={{ fontSize: 13, opacity: 0.7 }}>✏️</span>
            </div>
          </div>

          {/* En İyi Skor Kapsülü */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 20,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #facc15, #eab308)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                🏆
              </div>
              <span style={{ fontSize: 14, color: "#93c5fd", fontWeight: 700 }}>{t.best}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#facc15", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
              {bestScore}
            </div>
          </div>
        </div>

        {/* CANLI TURUNCU OYNA BUTONU (3D Kabartmalı) */}
        <button
          onClick={onPlay}
          className="btn-3d"
          style={{
            width: "100%",
            height: 68,
            background: "linear-gradient(180deg, #ff9e00 0%, #ff6b00 100%)",
            boxShadow: `
              inset 0 3px 2px rgba(255, 255, 255, 0.6),
              inset 0 -4px 6px rgba(0, 0, 0, 0.3),
              0 8px 0px #b34700,
              0 12px 20px rgba(0, 0, 0, 0.35)
            `,
            marginBottom: 22,
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "#ff6b00",
                paddingLeft: 3,
              }}
            >
              ▶
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                letterSpacing: 0.5,
              }}
            >
              {t.play}
            </span>
          </div>
        </button>

        {/* CANLI YEŞİL DİĞER OYUNLAR BUTONU (3D Kabartmalı) */}
        <button
          onClick={onMoreGames}
          className="btn-3d"
          style={{
            width: "100%",
            height: 62,
            background: "linear-gradient(180deg, #2ecc71 0%, #10b981 100%)",
            boxShadow: `
              inset 0 3px 2px rgba(255, 255, 255, 0.6),
              inset 0 -4px 6px rgba(0, 0, 0, 0.3),
              0 7px 0px #047857,
              0 10px 18px rgba(0, 0, 0, 0.3)
            `,
            marginBottom: 16,
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🎮
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                letterSpacing: 0.5,
              }}
            >
              {t.moreGames}
            </span>
          </div>
        </button>

        {/* Ayarlar Butonu */}
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            background: "transparent",
            color: "#93c5fd",
            border: "none",
            padding: "10px 16px",
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "'Fredoka', sans-serif",
            cursor: "pointer",
            marginTop: 4,
            transition: "opacity 0.2s, transform 0.15s",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {t.settings}
        </button>
      </div>

      {/* Ayarlar Modal */}
      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(6px)",
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
              background: "#1e293b",
              border: "2px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 26,
              padding: 26,
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: "'Fredoka', sans-serif", fontSize: 26, color: "#38bdf8" }}>{t.settingsTitle}</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#ffffff",
                  fontSize: 20,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Dil Değiştirici */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "12px 16px",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700 }}>🌐 {t.language}</span>
              <button
                onClick={() => setLang(lang === "tr" ? "en" : "tr")}
                style={{
                  background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {lang === "tr" ? "TR 🇹🇷" : "EN 🇬🇧"}
              </button>
            </div>

            {[
              { key: "sound_enabled" as const, label: t.soundEffects, icon: "🔊", value: soundEnabled },
              { key: "vibration_enabled" as const, label: t.vibration, icon: "▦", value: vibrationEnabled },
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
                  borderRadius: 16,
                  color: "#ffffff",
                  padding: "14px 16px",
                  marginBottom: 12,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span>{setting.icon} {setting.label}</span>
                <span
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 20,
                    background: setting.value ? "#22c55e" : "rgba(255,255,255,0.2)",
                    padding: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: setting.value ? "flex-end" : "flex-start",
                    transition: "background 0.2s",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}