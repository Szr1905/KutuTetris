import type { Theme } from "../lib/themes";
import { GAMES } from "../lib/games";

type MoreGamesScreenProps = {
  theme: Theme;
  onBack: () => void;
  onSelectGame: (gameId: string) => void;
};

export default function MoreGamesScreen({ theme, onBack, onSelectGame }: MoreGamesScreenProps) {
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
            fontFamily: "'Nunito', sans-serif",
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
          🎮 Diğer Oyunlar
        </h2>
        <div style={{ width: 70 }} />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            style={{
              background: theme.headerBg,
              border: "none",
              borderRadius: 16,
              padding: 0,
              cursor: "pointer",
              overflow: "hidden",
              textAlign: "left",
              fontFamily: "'Nunito', sans-serif",
              transition: "transform 0.15s",
              display: "flex",
              flexDirection: "column",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${game.color}, ${game.color}aa)`,
                padding: "28px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              {game.icon}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                {game.name}
              </div>
              <div style={{ fontSize: 13, opacity: 0.6, fontWeight: 600 }}>
                {game.description}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "inline-block",
                  fontSize: 11,
                  background: "rgba(255,255,255,0.1)",
                  padding: "3px 10px",
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                {game.difficulty}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
