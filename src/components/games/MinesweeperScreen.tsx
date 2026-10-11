import { useState } from "react";
import type { Theme } from "../../lib/themes";

type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const ROWS = 9;
const COLS = 9;
const MINES = 10;

export default function MinesweeperScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [board, setBoard] = useState<Cell[][]>(() => createBoard());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Mayınları bul!");

  function createBoard(): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isOpen: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  const initMinesAndPlay = (firstR: number, firstC: number, currentBoard: Cell[][]) => {
    let minesPlaced = 0;
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    while (minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newBoard[r][c].isMine && Math.abs(r - firstR) > 1 && Math.abs(c - firstC) > 1) {
        newBoard[r][c].isMine = true;
        minesPlaced++;
      }
    }

    if (minesPlaced < MINES) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (minesPlaced < MINES && !newBoard[r][c].isMine && (r !== firstR || c !== firstC)) {
            newBoard[r][c].isMine = true;
            minesPlaced++;
          }
        }
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newBoard[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].neighborMines = count;
      }
    }

    return openCell(firstR, firstC, newBoard);
  };

  const openCell = (r: number, c: number, currentBoard: Cell[][]): Cell[][] => {
    if (currentBoard[r][c].isOpen || currentBoard[r][c].isFlagged) return currentBoard;

    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    const totalMines = newBoard.flat().filter(cell => cell.isMine).length;

    if (totalMines === 0) {
      return initMinesAndPlay(r, c, newBoard);
    }

    if (newBoard[r][c].isMine) {
      setGameOver(true);
      setStatusMessage("Mayına bastın! 💥");
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (newBoard[row][col].isMine) newBoard[row][col].isOpen = true;
        }
      }
      return newBoard;
    }

    const queue: [number, number][] = [[r, c]];
    newBoard[r][c].isOpen = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      if (newBoard[currR][currC].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (!newBoard[nr][nc].isOpen && !newBoard[nr][nc].isFlagged) {
                newBoard[nr][nc].isOpen = true;
                if (newBoard[nr][nc].neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    let won = true;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newBoard[row][col].isMine && !newBoard[row][col].isOpen) {
          won = false;
          break;
        }
      }
    }

    if (won) {
      setGameWon(true);
      setStatusMessage("Tebrikler, Kazandın! 🏆");
      onScore(150);
    }

    return newBoard;
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || gameWon) return;

    if (flagMode) {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      if (!newBoard[r][c].isOpen) {
        newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
        setBoard(newBoard);
      }
    } else {
      if (board[r][c].isFlagged) return;
      const newBoard = openCell(r, c, board);
      setBoard(newBoard);
    }
  };

  const restartGame = () => {
    setBoard(createBoard());
    setGameOver(false);
    setGameWon(false);
    setStatusMessage("Mayınları bul!");
  };

  const numberColors: Record<number, string> = {
    1: "#3b82f6",
    2: "#22c55e",
    3: "#ef4444",
    4: "#8b5cf6",
    5: "#f59e0b",
    6: "#06b6d4",
    7: "#ec4899",
    8: "#64748b",
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
          maxWidth: 380,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
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
          💣 Mayın Tarlası
        </h2>
        <button
          onClick={restartGame}
          style={{
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Yeniden
        </button>
      </div>

      <div
        style={{
          background: theme.headerBg,
          padding: "10px 20px",
          borderRadius: 12,
          marginBottom: 16,
          fontWeight: 700,
          fontSize: 16,
          textAlign: "center",
          width: "100%",
          maxWidth: 380,
          boxSizing: "border-box",
        }}
      >
        {statusMessage}
      </div>

      <div style={{ marginBottom: 14, width: "100%", maxWidth: 380, display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => setFlagMode(!flagMode)}
          style={{
            background: flagMode ? "#f59e0b" : "rgba(255,255,255,0.12)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            boxShadow: flagMode ? "0 4px 12px rgba(245, 158, 11, 0.4)" : "none",
          }}
        >
          {flagMode ? "🚩 Bayrak Modu: AÇIK" : "⛏️ Kazma Modu: AÇIK"}
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 380,
          aspectRatio: "1 / 1",
          background: "#1e293b",
          borderRadius: 16,
          padding: 8,
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 4,
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          border: `4px solid ${theme.accent}`,
        }}
      >
        {board.flat().map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            onClick={() => handleCellClick(cell.row, cell.col)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCellClick(cell.row, cell.col);
            }}
            style={{
              background: cell.isOpen
                ? cell.isMine
                  ? "#ef4444"
                  : "#334155"
                : "#475569",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: cell.isOpen && !cell.isMine ? numberColors[cell.neighborMines] || "#fff" : "#fff",
              cursor: "pointer",
              userSelect: "none",
              transition: "background 0.1s",
            }}
          >
            {cell.isOpen
              ? cell.isMine
                ? "💣"
                : cell.neighborMines > 0
                ? cell.neighborMines
                : ""
              : cell.isFlagged
              ? "🚩"
              : ""}
          </div>
        ))}
      </div>
    </div>
  );
}