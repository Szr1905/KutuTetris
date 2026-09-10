import { useState, useCallback } from "react";
import type { Theme } from "../../lib/themes";

type TicTacToeScreenProps = {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
};

type Cell = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";
type Mode = "ai" | "2p";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

function minimax(board: Cell[], isMax: boolean, depth: number): number {
  const result = checkWinner(board);
  if (result?.winner === "O") return 10 - depth;
  if (result?.winner === "X") return depth - 10;
  if (board.every((c) => c !== null)) return 0;

  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? "O" : "X";
      const score = minimax(board, !isMax, depth + 1);
      board[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
}

function getBestMove(board: Cell[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, false, 0);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function getRandomMove(board: Cell[]): number {
  const empty = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToeScreen({ theme, onBack, onScore }: TicTacToeScreenProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<Mode>("ai");
  const [scores, setScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [result, setResult] = useState<{ winner: Cell; line: number[] } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const totalScore = scores.wins * 10;

  const makeAiMove = useCallback((currentBoard: Cell[]) => {
    const empty = currentBoard.filter((c) => c === null).length;
    if (empty === 0) return;

    let move: number;
    if (difficulty === "easy") {
      move = getRandomMove(currentBoard);
    } else if (difficulty === "medium") {
      // 50% optimal, 50% random
      move = Math.random() < 0.5 ? getBestMove(currentBoard) : getRandomMove(currentBoard);
    } else {
      move = getBestMove(currentBoard);
    }

    const newBoard = [...currentBoard];
    newBoard[move] = "O";
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setResult(winResult);
      if (winResult.winner === "O") {
        setScores((s) => ({ ...s, losses: s.losses + 1 }));
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }
    } else {
      setXTurn(true);
    }
  }, [difficulty]);

  const handleClick = (index: number) => {
    if (board[index] || result || !gameStarted) return;
    if (mode === "ai" && !xTurn) return;

    const mark: Cell = xTurn ? "X" : "O";
    const newBoard = [...board];
    newBoard[index] = mark;
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setResult(winResult);
      if (mode === "ai") {
        if (winResult.winner === "X") { setScores((s) => ({ ...s, wins: s.wins + 1 })); onScore(10); }
        else setScores((s) => ({ ...s, losses: s.losses + 1 }));
      } else {
        setScores((s) => winResult.winner === "X" ? { ...s, wins: s.wins + 1 } : { ...s, losses: s.losses + 1 });
        onScore(5);
      }
    } else if (newBoard.every((c) => c !== null)) {
      setResult({ winner: null, line: [] });
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    } else {
      setXTurn(!xTurn);
      if (mode === "ai") setTimeout(() => makeAiMove(newBoard), 300);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setResult(null);
    setGameStarted(true);
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
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
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>
          ⭕ Tic Tac Toe
        </h2>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.accent }}>
          {totalScore}p
        </div>
      </div>

      {/* Score row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          width: "100%",
          maxWidth: 420,
        }}
      >
        {[
          { label: "Kazan", value: scores.wins, color: "#22c55e" },
          { label: "Berabere", value: scores.draws, color: "#fbbf24" },
          { label: "Kaybet", value: scores.losses, color: "#ef4444" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: theme.headerBg,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {!gameStarted ? (
        <button
          onClick={resetGame}
          style={{
            background: theme.accent,
            color: "#fff",
            border: "none",
            borderRadius: 16,
            padding: "18px 48px",
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "'Fredoka', sans-serif",
            cursor: "pointer",
            boxShadow: `0 8px 24px ${theme.accent}44`,
          }}
        >
          ▶ Başla
        </button>
      ) : (
        <>
          {/* Turn indicator */}
          <div
            style={{
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 700,
              opacity: result ? 0 : 0.8,
            }}
          >
            {result ? "" : mode === "2p" ? (xTurn ? "Oyuncu 1 (X)" : "Oyuncu 2 (O)") : xTurn ? "Senin siran (X)" : "Bilgisayar düsünüyor..."}
          </div>

          {/* Board */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              width: "min(90vw, 300px)",
            }}
          >
            {board.map((cell, i) => {
              const isWinCell = result?.line.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={!!cell || !!result || (mode === "ai" && !xTurn)}
                  style={{
                    aspectRatio: "1",
                    background: isWinCell ? `${theme.accent}44` : theme.gridBg,
                    border: `2px solid ${isWinCell ? theme.accent : "transparent"}`,
                    borderRadius: 12,
                    fontSize: 48,
                    fontWeight: 900,
                    fontFamily: "'Fredoka', sans-serif",
                    color: cell === "X" ? theme.accent : "#ef4444",
                    cursor: cell || result || !xTurn ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          {/* Result */}
          {result && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: "'Fredoka', sans-serif",
                  color: result.winner === "X" ? "#22c55e" : result.winner === "O" ? "#ef4444" : theme.accent,
                  marginBottom: 16,
                  animation: "comboPop 0.3s ease",
                }}
              >
                {result.winner === "X" ? "🎉 Oyuncu 1 Kazandı!" : result.winner === "O" ? (mode === "2p" ? "🎉 Oyuncu 2 Kazandı!" : "😢 Kaybettin") : "🤝 Berabere"}
              </div>
              <button
                onClick={resetGame}
                style={{
                  background: theme.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 36px",
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                }}
              >
                Tekrar Oyna
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
