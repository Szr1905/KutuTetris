import { useState, useEffect } from "react";
import type { Theme } from "../../lib/themes";

const BALL_COLORS = [
  "#facc15", "#ef4444", "#3b82f6", "#a855f7", 
  "#22c55e", "#f97316", "#06b6d4", "#ec4899"
];

type Tube = string[];

export default function WaterSortScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem("waterSortLevel");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [tubes, setTubes] = useState<Tube[]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const generateLevel = (lvl: number) => {
    const colorCount = Math.min(3 + Math.floor((lvl - 1) / 2), BALL_COLORS.length);
    const activeColors = BALL_COLORS.slice(0, colorCount);
    const tubeCapacity = 4;
    const totalTubes = colorCount + 2; // Her zaman 2 boş tüp olur

    let allBalls: string[] = [];
    activeColors.forEach(color => {
      for (let i = 0; i < tubeCapacity; i++) {
        allBalls.push(color);
      }
    });

    allBalls.sort(() => Math.random() - 0.5);

    const newTubes: Tube[] = Array(totalTubes).fill(0).map(() => []);
    let ballIdx = 0;
    for (let t = 0; t < colorCount; t++) {
      for (let i = 0; i < tubeCapacity; i++) {
        newTubes[t].push(allBalls[ballIdx++]);
      }
    }

    if (checkIsWon(newTubes)) {
      return generateLevel(lvl);
    }

    return newTubes;
  };

  const checkIsWon = (currentTubes: Tube[]) => {
    for (const tube of currentTubes) {
      if (tube.length > 0) {
        if (tube.length !== 4) return false;
        const firstColor = tube[0];
        if (!tube.every(c => c === firstColor)) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    setTubes(generateLevel(level));
    setSelectedTubeIndex(null);
    setMoves(0);
    setGameWon(false);
  }, [level]);

  const handleTubeClick = (index: number) => {
    if (gameWon) return;

    if (selectedTubeIndex === null) {
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
      }
    } else {
      if (selectedTubeIndex === index) {
        setSelectedTubeIndex(null);
        return;
      }

      const sourceTube = tubes[selectedTubeIndex];
      const destTube = tubes[index];

      const ballToMove = sourceTube[sourceTube.length - 1];
      const canMove = 
        destTube.length < 4 && 
        (destTube.length === 0 || destTube[destTube.length - 1] === ballToMove);

      if (canMove) {
        const newTubes = tubes.map(t => [...t]);
        newTubes[selectedTubeIndex].pop();
        newTubes[index].push(ballToMove);

        setTubes(newTubes);
        setMoves(m => m + 1);
        setSelectedTubeIndex(null);

        if (checkIsWon(newTubes)) {
          setGameWon(true);
          onScore(150);
        }
      } else {
        if (tubes[index].length > 0) {
          setSelectedTubeIndex(index);
        } else {
          setSelectedTubeIndex(null);
        }
      }
    }
  };

  const nextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    localStorage.setItem("waterSortLevel", nextLvl.toString());
  };

  const resetLevel = () => {
    setTubes(generateLevel(level));
    setSelectedTubeIndex(null);
    setMoves(0);
    setGameWon(false);
  };

  const resetProgress = () => {
    setLevel(1);
    localStorage.setItem("waterSortLevel", "1");
  };

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
        userSelect: "none",
      }}
    >
      {/* Üst Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "8px 14px",
            color: theme.textColor,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          ← Geri
        </button>
        <h2 style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>
          🧪 Renk Sıralama (Seviye {level})
        </h2>
        <button
          onClick={resetProgress}
          title="Başa Dön"
          style={{
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            padding: "8px 12px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Sıfırla
        </button>
      </div>

      {/* Bilgi Paneli */}
      <div
        style={{
          background: theme.headerBg,
          padding: "8px 20px",
          borderRadius: 12,
          marginBottom: 20,
          fontWeight: 800,
          fontSize: 15,
          textAlign: "center",
          width: "100%",
          maxWidth: 440,
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Hamle: <strong style={{ color: theme.accent }}>{moves}</strong></span>
        <button
          onClick={resetLevel}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 8,
            padding: "4px 10px",
            color: theme.textColor,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Yeniden Başlat
        </button>
      </div>

      {/* Tüpler Alanı */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          minHeight: 320,
          background: "#1e293b",
          borderRadius: 16,
          padding: "20px 10px",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignContent: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          border: `4px solid ${theme.accent}`,
          position: "relative",
        }}
      >
        {tubes.map((tube, tIdx) => {
          const isSelected = selectedTubeIndex === tIdx;
          return (
            <div
              key={tIdx}
              onClick={() => handleTubeClick(tIdx)}
              style={{
                width: 38,
                height: 170,
                border: "3px solid rgba(255,255,255,0.85)",
                borderTop: "none",
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                background: isSelected ? "rgba(250, 204, 21, 0.18)" : "rgba(255,255,255,0.04)",
                display: "flex",
                flexDirection: "column-reverse",
                alignItems: "center",
                padding: "6px 3px",
                gap: 5,
                cursor: "pointer",
                boxSizing: "border-box",
                transform: isSelected ? "translateY(-10px)" : "translateY(0)",
                transition: "transform 0.15s, background 0.15s",
                boxShadow: isSelected ? "0 8px 20px rgba(250, 204, 21, 0.3)" : "none",
              }}
            >
              {Array.from({ length: 4 }).map((_, bIdx) => {
                const color = tube[bIdx];
                return (
                  <div
                    key={bIdx}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: color || "transparent",
                      boxShadow: color ? "inset 0 -3px 5px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)" : "none",
                      transition: "background 0.2s",
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {gameWon && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, margin: "0 0 8px 0" }}>Tebrikler! 🎉</h2>
            <p style={{ fontSize: 15, opacity: 0.8, marginBottom: 16 }}>Seviye {level} Tamamlandı!</p>
            <button
              onClick={nextLevel}
              style={{
                background: theme.accent,
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              Sonraki Seviye →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}