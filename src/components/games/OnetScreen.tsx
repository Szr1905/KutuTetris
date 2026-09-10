import { useState, useCallback, useMemo } from "react";
import type { Theme } from "../../lib/themes";

type OnetScreenProps = {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
};

type Card = { id: number; icon: string; matched: boolean };

const ICONS = ["🍎", "🍌", "🍇", "🍓", "🍑", "🥝", "🍍", "🥥", "🍒", "🍉", "🥭", "🍐"];

function generateBoard(pairs: number): Card[] {
  const selected = ICONS.slice(0, pairs);
  const deck = [...selected, ...selected];
  for (let i = deck.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[k]] = [deck[k], deck[i]];
  }
  return deck.map((icon, id) => ({ id, icon, matched: false }));
}

const COLS = 6;
const ROWS = 4;

function canConnect(board: Card[], a: number, b: number): boolean {
  if (a === b) return false;
  if (board[a].icon !== board[b].icon) return false;
  if (board[a].matched || board[b].matched) return false;
  // Simple path check: same row or same column with empty cells in between,
  // or L-shaped path through one empty intermediate cell.
  const ra = Math.floor(a / COLS), ca = a % COLS;
  const rb = Math.floor(b / COLS), cb = b % COLS;

  const isEmpty = (r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    const idx = r * COLS + c;
    if (idx === a || idx === b) return true;
    return board[idx].matched;
  };

  // Same row
  if (ra === rb) {
    const lo = Math.min(ca, cb), hi = Math.max(ca, cb);
    let clear = true;
    for (let c = lo + 1; c < hi; c++) if (!isEmpty(ra, c)) { clear = false; break; }
    if (clear) return true;
  }
  // Same col
  if (ca === cb) {
    const lo = Math.min(ra, rb), hi = Math.max(ra, rb);
    let clear = true;
    for (let r = lo + 1; r < hi; r++) if (!isEmpty(r, ca)) { clear = false; break; }
    if (clear) return true;
  }
  // L-path: through (ra, cb) or (rb, ca)
  if (isEmpty(ra, cb) && isEmpty(rb, cb === ca ? cb : ca)) {
    // Check vertical then horizontal
    let vClear = true;
    const lo = Math.min(ra, rb), hi = Math.max(ra, rb);
    for (let r = lo + 1; r < hi; r++) if (!isEmpty(r, cb)) { vClear = false; break; }
    if (vClear) {
      let hClear = true;
      const lo2 = Math.min(ca, cb), hi2 = Math.max(ca, cb);
      for (let c = lo2 + 1; c < hi2; c++) if (!isEmpty(rb, c)) { hClear = false; break; }
      if (hClear) return true;
    }
  }
  if (isEmpty(rb, ca)) {
    let vClear = true;
    const lo = Math.min(ra, rb), hi = Math.max(ra, rb);
    for (let r = lo + 1; r < hi; r++) if (!isEmpty(r, ca)) { vClear = false; break; }
    if (vClear) {
      let hClear = true;
      const lo2 = Math.min(ca, cb), hi2 = Math.max(ca, cb);
      for (let c = lo2 + 1; c < hi2; c++) if (!isEmpty(ra, c)) { hClear = false; break; }
      if (hClear) return true;
    }
  }
  return false;
}

export default function OnetScreen({ theme, onBack, onScore }: OnetScreenProps) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<Card[]>(() => generateBoard(12));
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const reset = useCallback((lvl: number) => {
    setBoard(generateBoard(12));
    setSelected(null);
    setWon(false);
  }, []);

  const handleClick = (idx: number) => {
    if (won || board[idx].matched) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    if (canConnect(board, selected, idx)) {
      const newBoard = board.map((c) => c.id === board[selected].id || c.id === board[idx].id ? { ...c, matched: true } : c);
      setBoard(newBoard);
      setScore((s) => s + 10);
      onScore(10);
      setSelected(null);
      if (newBoard.every((c) => c.matched)) setWon(true);
    } else {
      setSelected(idx);
    }
  };

  const remaining = useMemo(() => board.filter((c) => !c.matched).length, [board]);

  return (
    <div style={{ background: theme.bgColor, minHeight: "100vh", color: theme.textColor, fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, padding: "10px 16px", color: theme.textColor, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>← Geri</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>🔗 Eşleştir</h2>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.accent }}>{score}p</div>
      </div>

      <div style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, opacity: 0.7 }}>Kalan: {remaining}</div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 6, width: "min(90vw, 360px)" }}>
        {board.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleClick(idx)}
            style={{
              aspectRatio: "1",
              background: card.matched ? "transparent" : selected === idx ? `${theme.accent}33` : theme.gridBg,
              border: card.matched ? "2px dashed rgba(255,255,255,0.08)" : `2px solid ${selected === idx ? theme.accent : "transparent"}`,
              borderRadius: 10,
              fontSize: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: card.matched ? "default" : "pointer",
              opacity: card.matched ? 0.2 : 1,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {card.icon}
          </button>
        ))}
      </div>

      {won && (
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", margin: "0 0 16px 0", color: theme.accent }}>Tüm Eşleşmeler!</h3>
          <button onClick={() => { setLevel((l) => l + 1); reset(level + 1); }} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 18, fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer" }}>Yeni Oyun →</button>
        </div>
      )}

      {!won && (
        <button onClick={() => reset(level)} style={{ marginTop: 24, background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>↻ Yeniden Başla</button>
      )}
    </div>
  );
}
