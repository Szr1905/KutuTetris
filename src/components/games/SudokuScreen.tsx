import { useState, useCallback } from "react";
import type { Theme } from "../../lib/themes";

type SudokuScreenProps = {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
};

type Board = (number | null)[][];

function generateSudoku(level: number): { puzzle: Board; solution: Board } {
  // Base valid solution
  const base: Board = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];
  // Shuffle rows within bands, columns within stacks, bands, stacks
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [a[i], a[k]] = [a[k], a[i]];
    }
    return a;
  };
  const bands = shuffle([0, 1, 2]);
  const stacks = shuffle([0, 1, 2]);
  const rowOrder = bands.flatMap((b) => shuffle([b * 3, b * 3 + 1, b * 3 + 2]));
  const colOrder = stacks.flatMap((s) => shuffle([s * 3, s * 3 + 1, s * 3 + 2]));
  const solution = rowOrder.map((r) => colOrder.map((c) => base[r][c]));
  // Remove cells based on difficulty
  const removeCount = Math.min(30 + level * 4, 55);
  const puzzle = solution.map((row) => [...row]);
  const cells: number[] = [];
  for (let i = 0; i < 81; i++) cells.push(i);
  const shuffledCells = shuffle(cells);
  for (let i = 0; i < removeCount; i++) {
    const r = Math.floor(shuffledCells[i] / 9);
    const c = shuffledCells[i] % 9;
    puzzle[r][c] = null;
  }
  return { puzzle, solution };
}

export default function SudokuScreen({ theme, onBack, onScore }: SudokuScreenProps) {
  const [level, setLevel] = useState(1);
  const [{ puzzle, solution }, setBoards] = useState(() => generateSudoku(1));
  const [board, setBoard] = useState<Board>(() => puzzle.map((r) => [...r]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const reset = useCallback((lvl: number) => {
    const gen = generateSudoku(lvl);
    setBoards(gen);
    setBoard(gen.puzzle.map((r) => [...r]));
    setSelected(null);
    setWon(false);
  }, []);

  const isOriginalCell = (r: number, c: number) => puzzle[r][c] !== null;

  const handleClick = (r: number, c: number) => {
    if (won || isOriginalCell(r, c)) return;
    setSelected({ r, c });
  };

  const handleNumber = (num: number) => {
    if (!selected || won) return;
    const { r, c } = selected;
    if (isOriginalCell(r, c)) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);
    if (num === solution[r][c]) {
      setScore((s) => s + 5);
      onScore(5);
    }
    setSelected(null);
    if (newBoard.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
      setScore((s) => s + 100);
      onScore(100);
      setWon(true);
    }
  };

  return (
    <div style={{ background: theme.bgColor, minHeight: "100vh", color: theme.textColor, fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, padding: "10px 16px", color: theme.textColor, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>← Geri</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>🔢 Sudoku</h2>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.accent }}>{score}p</div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 15, fontWeight: 700, opacity: 0.7 }}>Bölüm {level}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 0, width: "min(92vw, 360px)", border: `2px solid ${theme.accent}`, borderRadius: 8, overflow: "hidden" }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSel = selected?.r === r && selected?.c === c;
            const isOriginal = isOriginalCell(r, c);
            const boxBorderR = (r + 1) % 3 === 0 && r < 8 ? `0 0 2px 0 rgba(255,255,255,0.3)` : "";
            const boxBorderC = (c + 1) % 3 === 0 && c < 8;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                style={{
                  aspectRatio: "1",
                  background: isSel ? `${theme.accent}44` : (r + c) % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  border: "none",
                  borderRight: boxBorderC ? "2px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderBottom: (r + 1) % 3 === 0 && r < 8 ? "2px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  color: isOriginal ? theme.textColor : theme.accent,
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: isOriginal || won ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cell ?? ""}
              </button>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 360 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleNumber(n)}
            style={{
              width: 36,
              height: 36,
              background: theme.headerBg,
              border: "none",
              borderRadius: 8,
              color: theme.textColor,
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {won && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", margin: "0 0 16px 0", color: theme.accent }}>Çözüldü!</h3>
          <button onClick={() => { setLevel((l) => l + 1); reset(level + 1); }} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 18, fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer" }}>Sonraki Bölüm →</button>
        </div>
      )}

      {!won && (
        <button onClick={() => reset(level)} style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>↻ Yeniden Başla</button>
      )}
    </div>
  );
}
