import { useState, useEffect, useCallback, useRef } from "react";
import type { Theme } from "../../lib/themes";

type Board = number[][];

const getInitialBoard = (): Board => {
  const b: Board = Array(4).fill(0).map(() => Array(4).fill(0));
  return addRandomTile(addRandomTile(b));
};

const addRandomTile = (board: Board): Board => {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return board;
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

const slideRowLeft = (row: number[]): { row: number[]; score: number } => {
  let arr = row.filter(v => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, score };
};

const transpose = (board: Board): Board => {
  const res: Board = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      res[c][r] = board[r][c];
    }
  }
  return res;
};

const reverseRow = (row: number[]): number[] => [...row].reverse();

const TILE_COLORS: Record<number, { bg: string; color: string }> = {
  2: { bg: "#eee4da", color: "#776e65" },
  4: { bg: "#ede0c8", color: "#776e65" },
  8: { bg: "#f2b179", color: "#f9f6f2" },
  16: { bg: "#f59563", color: "#f9f6f2" },
  32: { bg: "#f67c5f", color: "#f9f6f2" },
  64: { bg: "#f65e3b", color: "#f9f6f2" },
  128: { bg: "#edcf72", color: "#f9f6f2" },
  256: { bg: "#edcc61", color: "#f9f6f2" },
  512: { bg: "#edc850", color: "#f9f6f2" },
  1024: { bg: "#edc53f", color: "#f9f6f2" },
  2048: { bg: "#edc22e", color: "#f9f6f2" },
};

export default function Game2048Screen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [board, setBoard] = useState<Board>(getInitialBoard);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Swipe / Sürükleme koordinat takibi
  const touchStartCoord = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);

  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback((direction: "left" | "right" | "up" | "down") => {
    if (gameOver) return;

    let newBoard = board.map(row => [...row]);
    let totalScoreAdded = 0;
    let moved = false;

    if (direction === "left") {
      for (let r = 0; r < 4; r++) {
        const { row, score: s } = slideRowLeft(newBoard[r]);
        if (row.toString() !== newBoard[r].toString()) moved = true;
        newBoard[r] = row;
        totalScoreAdded += s;
      }
    } else if (direction === "right") {
      for (let r = 0; r < 4; r++) {
        const reversed = reverseRow(newBoard[r]);
        const { row, score: s } = slideRowLeft(reversed);
        const finalRow = reverseRow(row);
        if (finalRow.toString() !== newBoard[r].toString()) moved = true;
        newBoard[r] = finalRow;
        totalScoreAdded += s;
      }
    } else if (direction === "up") {
      let t = transpose(newBoard);
      for (let r = 0; r < 4; r++) {
        const { row, score: s } = slideRowLeft(t[r]);
        if (row.toString() !== t[r].toString()) moved = true;
        t[r] = row;
        totalScoreAdded += s;
      }
      newBoard = transpose(t);
    } else if (direction === "down") {
      let t = transpose(newBoard);
      for (let r = 0; r < 4; r++) {
        const reversed = reverseRow(t[r]);
        const { row, score: s } = slideRowLeft(reversed);
        const finalRow = reverseRow(row);
        if (finalRow.toString() !== t[r].toString()) moved = true;
        t[r] = finalRow;
        totalScoreAdded += s;
      }
      newBoard = transpose(t);
    }

    if (moved) {
      const finalBoard = addRandomTile(newBoard);
      setBoard(finalBoard);
      const newScore = score + totalScoreAdded;
      setScore(newScore);
      onScore(totalScoreAdded > 0 ? Math.floor(totalScoreAdded / 10) : 1);

      if (checkGameOver(finalBoard)) {
        setGameOver(true);
      }
    }
  }, [board, gameOver, score, onScore]);

  // Klavye Desteği
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") move("left");
      if (e.key === "ArrowRight" || e.key === "d") move("right");
      if (e.key === "ArrowUp" || e.key === "w") move("up");
      if (e.key === "ArrowDown" || e.key === "s") move("down");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Dokunmatik ve Fare Sürükleme Mantığı
  const handleStart = (clientX: number, clientY: number) => {
    touchStartCoord.current = { x: clientX, y: clientY };
    isMouseDown.current = true;
  };

  const handleEnd = (clientX: number, clientY: number) => {
    if (!touchStartCoord.current) return;

    const deltaX = clientX - touchStartCoord.current.x;
    const deltaY = clientY - touchStartCoord.current.y;
    const minSwipeDistance = 30; // En az kaydırma mesafesi (piksel)

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Yatay kaydırma
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          move("right");
        } else {
          move("left");
        }
      }
    } else {
      // Dikey kaydırma
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          move("down");
        } else {
          move("up");
        }
      }
    }

    touchStartCoord.current = null;
    isMouseDown.current = false;
  };

  const restart = () => {
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
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
          🔢 2048
        </h2>
        <button
          onClick={restart}
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
          padding: "10px 24px",
          borderRadius: 14,
          marginBottom: 16,
          fontWeight: 800,
          fontSize: 18,
          textAlign: "center",
          width: "100%",
          maxWidth: 380,
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Skor:</span>
        <span style={{ color: theme.accent }}>{score}</span>
      </div>

      {/* Sürükleme/Kaydırma Alanı */}
      <div
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseUp={(e) => isMouseDown.current && handleEnd(e.clientX, e.clientY)}
        onMouseLeave={(e) => isMouseDown.current && handleEnd(e.clientX, e.clientY)}
        style={{
          width: "100%",
          maxWidth: 380,
          aspectRatio: "1 / 1",
          background: "#bbada0",
          borderRadius: 16,
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: 10,
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          position: "relative",
          cursor: "grab",
          touchAction: "none", // Mobil tarayıcı sayfa kaydırmasını engeller
        }}
      >
        {board.flat().map((val, idx) => {
          const styleConfig = TILE_COLORS[val] || { bg: "#cdc1b4", color: "#cdc1b4" };
          return (
            <div
              key={idx}
              style={{
                background: styleConfig.bg,
                color: styleConfig.color,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: val > 512 ? 24 : val > 64 ? 28 : 34,
                fontWeight: 900,
                fontFamily: "'Fredoka', sans-serif",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {val !== 0 ? val : ""}
            </div>
          );
        })}

        {gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, margin: "0 0 10px 0" }}>Oyun Bitti!</h2>
            <button
              onClick={restart}
              style={{
                background: theme.accent,
                border: "none",
                borderRadius: 14,
                padding: "12px 24px",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          fontSize: 14,
          fontWeight: 700,
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        💡 Blokları kaydırmak için parmağınızı veya fareyi sürükleyin.
      </div>
    </div>
  );
}