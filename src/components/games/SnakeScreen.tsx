import { useState, useEffect, useCallback, useRef } from "react";
import type { Theme } from "../../lib/types"; // veya lib/themes yoluna göre

type Point = { x: number; y: number };

const GRID_SIZE = 16;
const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 8 },
  { x: 8, y: 9 },
  { x: 8, y: 10 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 }; // Yukarı hareket

export default function SnakeScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: any;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Yabancı yön değişimlerinde hızlı ardışık basılmaları engellemek için ref
  const lastDirection = useRef<Point>(INITIAL_DIRECTION);

  const spawnFood = (currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Yılanın üstüne düşmemesini sağla
      const collision = currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirection.current = INITIAL_DIRECTION;
    setFood(spawnFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const changeDirection = useCallback((newDir: Point) => {
    // 180 derece ters dönmeyi engelle (örneğin yukarı giderken aşağı basılamaz)
    if (lastDirection.current.x + newDir.x === 0 && lastDirection.current.y + newDir.y === 0) {
      return;
    }
    setDirection(newDir);
  }, []);

  // Klavye Kontrolleri
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") changeDirection({ x: 0, y: -1 });
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") changeDirection({ x: 0, y: 1 });
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") changeDirection({ x: -1, y: 0 });
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") changeDirection({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection]);

  // Oyun Döngüsü (Interval)
  useEffect(() => {
    if (gameOver || isPaused) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y,
        };

        lastDirection.current = direction;

        // Duvar Çarpışması
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        // Kendi Kendine Çarpışma
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Yiyecek Yeme Kontrolü
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          onScore(5);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop(); // Yiyecek yenmediyse kuyruğu kısalt
        }

        return newSnake;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [direction, food, gameOver, isPaused, score, onScore]);

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
          🐍 Yılan Oyunu
        </h2>
        <button
          onClick={resetGame}
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

      {/* Skor Paneli */}
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

      {/* Oyun Tahtası */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          aspectRatio: "1 / 1",
          background: "#1e293b",
          borderRadius: 16,
          padding: 8,
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 2,
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          border: `4px solid ${theme.accent}`,
          position: "relative",
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
          const x = idx % GRID_SIZE;
          const y = Math.floor(idx / GRID_SIZE);

          const isSnakeHead = snake[0].x === x && snake[0].y === y;
          const isSnakeBody = snake.slice(1).some((s) => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;

          let bg = "rgba(255,255,255,0.03)";
          let borderRadius = 4;

          if (isSnakeHead) {
            bg = theme.accent;
            borderRadius = 8;
          } else if (isSnakeBody) {
            bg = `${theme.accent}aa`;
            borderRadius = 6;
          } else if (isFood) {
            bg = "#ef4444";
            borderRadius = "50%";
          }

          return (
            <div
              key={idx}
              style={{
                background: bg,
                borderRadius: borderRadius,
                transition: "background 0.08s",
              }}
            />
          );
        })}

        {gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, margin: "0 0 10px 0" }}>Oyun Bitti!</h2>
            <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 20 }}>Skorun: {score}</p>
            <button
              onClick={resetGame}
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

      {/* Ekran Yön Tuşları (Mobil İçin) */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => changeDirection({ x: 0, y: -1 })}
          style={{ background: theme.accent, border: "none", borderRadius: 12, width: 64, height: 46, color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer" }}
        >
          ⬆️
        </button>
        <div style={{ display: "flex", gap: 20 }}>
          <button
            onClick={() => changeDirection({ x: -1, y: 0 })}
            style={{ background: theme.accent, border: "none", borderRadius: 12, width: 64, height: 46, color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer" }}
          >
            ⬅️
          </button>
          <button
            onClick={() => changeDirection({ x: 1, y: 0 })}
            style={{ background: theme.accent, border: "none", borderRadius: 12, width: 64, height: 46, color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer" }}
          >
            ➡️
          </button>
        </div>
        <button
          onClick={() => changeDirection({ x: 0, y: 1 })}
          style={{ background: theme.accent, border: "none", borderRadius: 12, width: 64, height: 46, color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer" }}
        >
          ⬇️
        </button>
      </div>
    </div>
  );
}