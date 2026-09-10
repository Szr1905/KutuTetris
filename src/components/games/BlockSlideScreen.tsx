import { useState, useCallback } from "react";
import type { Theme } from "../../lib/themes";

type BlockSlideScreenProps = {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
};

type Cell = "empty" | "wall" | "target" | "block";
type Grid = Cell[][];

// Klotski-style: slide the red block (target) to the exit.
// Each level is a hand-crafted grid.
const LEVELS: Grid[] = [
  // Level 1: simple - push block right to exit
  [
    ["empty", "empty", "empty", "empty", "empty"],
    ["empty", "block", "target", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty"],
  ],
  // Level 2: wall in the way
  [
    ["empty", "empty", "empty", "wall", "empty"],
    ["empty", "block", "empty", "wall", "target"],
    ["empty", "empty", "empty", "empty", "empty"],
    ["empty", "wall", "wall", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty"],
  ],
  // Level 3: more walls
  [
    ["empty", "wall", "empty", "empty", "empty"],
    ["empty", "wall", "empty", "block", "empty"],
    ["empty", "empty", "empty", "wall", "empty"],
    ["wall", "wall", "empty", "wall", "empty"],
    ["empty", "empty", "empty", "empty", "target"],
  ],
];

function findBlock(grid: Grid): { r: number; c: number } | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === "block") return { r, c };
    }
  }
  return null;
}

function isSolved(grid: Grid): boolean {
  const block = findBlock(grid);
  if (!block) return false;
  return grid[block.r][block.c] === "target" || grid[block.r] === undefined;
}

export default function BlockSlideScreen({ theme, onBack, onScore }: BlockSlideScreenProps) {
  const [level, setLevel] = useState(0);
  const [grid, setGrid] = useState<Grid>(() => LEVELS[0].map((r) => [...r]));
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const reset = useCallback((lvl: number) => {
    setGrid(LEVELS[lvl % LEVELS.length].map((r) => [...r]));
    setMoves(0);
    setWon(false);
  }, []);

  const move = (dir: "up" | "down" | "left" | "right") => {
    if (won) return;
    const block = findBlock(grid);
    if (!block) return;
    const dr = dir === "up" ? -1 : dir === "down" ? 1 : 0;
    const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
    let nr = block.r + dr;
    let nc = block.c + dc;
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;
    const target = grid[nr][nc];
    if (target === "wall" || target === "block") return;
    const newGrid = grid.map((r) => [...r]) as Grid;
    newGrid[block.r][block.c] = "empty";
    // If moving onto target, it's a win
    if (target === "target") {
      newGrid[nr][nc] = "block";
      setGrid(newGrid);
      setMoves((m) => m + 1);
      const pts = Math.max(80 - moves * 5, 20);
      setScore((s) => s + pts);
      onScore(pts);
      setWon(true);
      return;
    }
    newGrid[nr][nc] = "block";
    setGrid(newGrid);
    setMoves((m) => m + 1);
  };

  const nextLevel = () => {
    const nl = (level + 1) % LEVELS.length;
    setLevel(nl);
    reset(nl);
  };

  const Btn = ({ d, label }: { d: "up" | "down" | "left" | "right"; label: string }) => (
    <button
      onClick={() => move(d)}
      style={{
        background: theme.headerBg,
        border: "none",
        borderRadius: 12,
        padding: "16px 20px",
        color: theme.textColor,
        fontSize: 24,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "'Nunito', sans-serif",
        minWidth: 60,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: theme.bgColor, minHeight: "100vh", color: theme.textColor, fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, padding: "10px 16px", color: theme.textColor, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>← Geri</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>🧩 Blok Kaydır</h2>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.accent }}>{score}p</div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 15, fontWeight: 700, opacity: 0.7 }}>
        Bölüm {level + 1} · Hamle: {moves}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid[0].length}, 56px)`, gap: 2, marginBottom: 24 }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                background:
                  cell === "wall" ? "rgba(255,255,255,0.12)" :
                  cell === "target" ? "rgba(34,197,94,0.3)" :
                  cell === "block" ? theme.accent :
                  "rgba(255,255,255,0.04)",
                border: cell === "target" ? "2px dashed #22c55e" : "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {cell === "block" ? "🟦" : cell === "target" ? "🎯" : cell === "wall" ? "🧱" : ""}
            </div>
          ))
        )}
      </div>

      {/* D-pad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: 8, justifyItems: "center" }}>
        <div />
        <Btn d="up" label="↑" />
        <div />
        <Btn d="left" label="←" />
        <Btn d="down" label="↓" />
        <Btn d="right" label="→" />
      </div>

      {won && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", margin: "0 0 16px 0", color: theme.accent }}>Hedefe Ulaştı!</h3>
          <button onClick={nextLevel} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 18, fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer" }}>Sonraki Bölüm →</button>
        </div>
      )}

      {!won && (
        <button onClick={() => reset(level)} style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>↻ Yeniden Başla</button>
      )}
    </div>
  );
}
