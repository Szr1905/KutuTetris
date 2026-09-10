import { useState, useCallback } from "react";
import type { Theme } from "../../lib/themes";

type WaterSortScreenProps = {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
};

type Tube = string[];

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#ec4899"];
const TUBE_CAPACITY = 4;

function generatePuzzle(level: number): Tube[] {
  const colorCount = Math.min(3 + Math.floor(level / 2), COLORS.length);
  const tubes: Tube[] = [];
  const pool: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    for (let j = 0; j < TUBE_CAPACITY; j++) {
      pool.push(COLORS[i]);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[k]] = [pool[k], pool[i]];
  }
  for (let i = 0; i < colorCount; i++) {
    tubes.push(pool.slice(i * TUBE_CAPACITY, (i + 1) * TUBE_CAPACITY));
  }
  tubes.push([]);
  tubes.push([]);
  return tubes;
}

function isSolved(tubes: Tube[]): boolean {
  return tubes.every((t) => t.length === 0 || (t.length === TUBE_CAPACITY && t.every((c) => c === t[0])));
}

export default function WaterSortScreen({ theme, onBack, onScore }: WaterSortScreenProps) {
  const [level, setLevel] = useState(1);
  const [tubes, setTubes] = useState<Tube[]>(() => generatePuzzle(1));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);

  const reset = useCallback((lvl: number) => {
    setTubes(generatePuzzle(lvl));
    setSelected(null);
    setMoves(0);
    setWon(false);
  }, []);

  const handleTubeClick = (idx: number) => {
    if (won) return;
    if (selected === null) {
      if (tubes[idx].length > 0) setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const from = tubes[selected];
    const to = tubes[idx];
    if (to.length >= TUBE_CAPACITY) {
      setSelected(null);
      return;
    }
    const topColor = from[from.length - 1];
    if (to.length > 0 && to[to.length - 1] !== topColor) {
      setSelected(null);
      return;
    }
    // Pour all matching top colors
    let count = 0;
    for (let i = from.length - 1; i >= 0; i--) {
      if (from[i] === topColor) count++;
      else break;
    }
    const space = TUBE_CAPACITY - to.length;
    const pour = Math.min(count, space);
    const newTubes = tubes.map((t) => [...t]);
    newTubes[idx] = [...to, ...Array(pour).fill(topColor)];
    newTubes[selected] = from.slice(0, from.length - pour);
    setTubes(newTubes);
    setMoves((m) => m + 1);
    setSelected(null);
    if (isSolved(newTubes)) {
      const pts = Math.max(50 - moves, 10);
      setScore((s) => s + pts);
      onScore(pts);
      setWon(true);
    }
  };

  const nextLevel = () => {
    const nl = level + 1;
    setLevel(nl);
    reset(nl);
  };

  return (
    <div style={{ background: theme.bgColor, minHeight: "100vh", color: theme.textColor, fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 460, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, padding: "10px 16px", color: theme.textColor, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>← Geri</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>🧪 Su Sıralama</h2>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.accent }}>{score}p</div>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
        <span>Bölüm {level}</span>
        <span>Hamle: {moves}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 400 }}>
        {tubes.map((tube, idx) => (
          <div
            key={idx}
            onClick={() => handleTubeClick(idx)}
            style={{
              width: 44,
              height: 140,
              borderRadius: "0 0 10px 10px",
              border: `3px solid ${selected === idx ? theme.accent : "rgba(255,255,255,0.25)"}`,
              borderTop: "none",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              padding: 2,
              cursor: "pointer",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          >
            {tube.map((color, i) => (
              <div key={i} style={{ width: 36, height: 32, background: color, borderRadius: 4, marginBottom: 1 }} />
            ))}
          </div>
        ))}
      </div>

      {won && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", margin: "0 0 16px 0", color: theme.accent }}>Bölüm Tamam!</h3>
          <button onClick={nextLevel} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 18, fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer" }}>Sonraki Bölüm →</button>
        </div>
      )}

      {!won && (
        <button onClick={() => reset(level)} style={{ marginTop: 24, background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>↻ Yeniden Başla</button>
      )}
    </div>
  );
}
