import { useState, useEffect } from "react";
import type { Theme } from "../lib/themes";
import type { LeaderboardEntry } from "../lib/supabase";
import { getLeaderboard } from "../lib/supabase";

type LeaderboardScreenProps = {
  theme: Theme;
  playerBestScore: number;
  playerName: string;
  onBack: () => void;
};

export default function LeaderboardScreen({
  theme,
  playerBestScore,
  playerName,
  onBack,
}: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getLeaderboard(50);
      setEntries(data);
      setLoading(false);
    })();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

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
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            color: theme.textColor,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Geri
        </button>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Fredoka', sans-serif",
            margin: 0,
          }}
        >
          🏆 Skor Tablosu
        </h2>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Player's best */}
        <div
          style={{
            background: `${theme.accent}22`,
            border: `1px solid ${theme.accent}55`,
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Senin Skorun
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{playerName}</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Fredoka', sans-serif", color: theme.accent }}>
              {playerBestScore}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, opacity: 0.5, fontSize: 16 }}>
            Yükleniyor...
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              opacity: 0.5,
              fontSize: 16,
            }}
          >
            Henüz skor yok. İlk oyunu oynayarak başla!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: theme.headerBg,
                  borderRadius: 12,
                  padding: "12px 16px",
                  transition: "transform 0.15s",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: i < 3 ? `${theme.accent}33` : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{entry.player_name}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>
                    🪙 {entry.coins} coin
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      fontFamily: "'Fredoka', sans-serif",
                      color: i < 3 ? theme.accent : theme.textColor,
                    }}
                  >
                    {entry.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
