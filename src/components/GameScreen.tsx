import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Theme } from "../lib/themes";
import {
  GRID_SIZE,
  type Shape,
  createEmptyGrid,
  generateThreeShapes,
  canPlaceShape,
  placeShape,
  clearLines,
  canPlaceAnywhere,
  hasAnyValidMove,
  calculateScore,
  COLORS,
} from "../lib/gameLogic";

type GameScreenProps = {
  theme: Theme;
  bestScore: number;
  adventureLevel: number;
  mode: "main" | "adventure";
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onExit: () => void;
  onGameOver: (score: number, coinsEarned: number, levelCompleted: boolean, stats: { maxCombo: number; maxMultiClear: number; blocksPlaced: number }) => void;
};

type DragState = {
  shapeIndex: number;
  shape: Shape;
  pointerX: number;
  pointerY: number;
  isTouch: boolean;
  startX: number;
  startY: number;
};

type FloatingScore = {
  id: number;
  points: number;
};

type FloatingCombo = {
  id: number;
  comboCount: number;
};

type FloatingMulti = {
  id: number;
  linesCount: number;
};

export default function GameScreen({ theme, bestScore, adventureLevel, mode, soundEnabled, vibrationEnabled, onExit, onGameOver }: GameScreenProps) {
  const isAdventure = mode === "adventure";
  const startSoundPlayed = useRef(false);
  useEffect(() => {
    if (soundEnabled && !startSoundPlayed.current) {
      startSoundPlayed.current = true;
      const timer = setTimeout(() => playSoundRef.current("start"), 200);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const getNoiseBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    if (!noiseBufferRef.current) {
      const len = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noiseBufferRef.current = buf;
    }
    return noiseBufferRef.current;
  }, []);

  const playSound = useCallback((type: "place" | "clear" | "multi" | "combo" | "gameover" | "start" | "grab" | "levelup", comboLevel: number = 0, linesCleared: number = 0) => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "place") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "clear") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "gameover") {
      const sadNotes = [330, 294, 247, 196];
      for (let i = 0; i < sadNotes.length; i++) {
        const delay = i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(sadNotes[i], now + delay);
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      }
    } else if (type === "grab") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1700, now + 0.16);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "start") {
      const notes = [392, 523, 659, 784];
      for (let i = 0; i < notes.length; i++) {
        const delay = i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(notes[i], now + delay);
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      }
    }
  }, [soundEnabled, getCtx]);

  const playSoundRef = useRef(playSound);
  useEffect(() => { playSoundRef.current = playSound; }, [playSound]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }, [vibrationEnabled]);

  const [grid, setGrid] = useState<number[][]>(createEmptyGrid);
  
  // Resimdeki artı şeklini filtreleyerek üreten özel fonksiyon
  const generateFilteredShapes = useCallback((level: number, currentGrid?: number[][]) => {
    const rawShapes = generateThreeShapes(level, currentGrid);
    return rawShapes.map((shape) => {
      if (!shape) return null;
      // Artı/Haç şeklinin kontrolü (Genellikle 3x3 boyutunda merkez ve etrafındaki 4 hücre doludur)
      const isPlusShape =
        shape.width === 3 &&
        shape.height === 3 &&
        shape.cells[0][1] === 1 &&
        shape.cells[1][0] === 1 &&
        shape.cells[1][1] === 1 &&
        shape.cells[1][2] === 1 &&
        shape.cells[2][1] === 1;

      if (isPlusShape) {
        // Artı yerine alternatif basit bir 2x2 kare döndür
        return {
          width: 2,
          height: 2,
          color: shape.color,
          cells: [
            [1, 1],
            [1, 1],
          ],
        };
      }
      return shape;
    });
  }, [adventureLevel]);

  const [shapes, setShapes] = useState<(Shape | null)[]>(() => generateFilteredShapes(adventureLevel));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverRow, setHoverRow] = useState(-1);
  const [hoverCol, setHoverCol] = useState(-1);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showGameOverTitle, setShowGameOverTitle] = useState(false);
  const [showGameOverButtons, setShowGameOverButtons] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [boardDanger, setBoardDanger] = useState(false);

  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [floatingCombos, setFloatingCombos] = useState<FloatingCombo[]>([]);
  const [floatingMultis, setFloatingMultis] = useState<FloatingMulti[]>([]);

  const maxComboRef = useRef(0);
  const maxMultiClearRef = useRef(0);
  const blocksPlacedRef = useRef(0);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  const pointerMoveFrameRef = useRef<number | null>(null);
  const gridStateRef = useRef<number[][]>(grid);
  const shapesStateRef = useRef<(Shape | null)[]>(shapes);

  const cellSize = 38;
  const gap = 1;
  const totalCellSize = cellSize + gap;
  const touchLiftOffset = 80;

  useEffect(() => { gridStateRef.current = grid; }, [grid]);
  useEffect(() => { shapesStateRef.current = shapes; }, [shapes]);
  useEffect(() => { dragRef.current = drag; }, [drag]);

  const filledCellsCount = grid.reduce((acc, row) => acc + row.filter(cell => cell !== 0).length, 0);
  const isHalfFull = filledCellsCount >= (GRID_SIZE * GRID_SIZE) * 0.5;

  const checkGameOver = useCallback(
    (currentGrid: number[][], currentShapes: (Shape | null)[]) => {
      const activeShapes = currentShapes.filter((s): s is Shape => s !== null);
      if (activeShapes.length === 0) return;
      if (!hasAnyValidMove(currentGrid, activeShapes)) {
        setGameOver(true);
        setShowGameOverTitle(false);
        setShowGameOverButtons(false);
        window.setTimeout(() => setShowGameOverTitle(true), 1200);
        window.setTimeout(() => setShowGameOverButtons(true), 2000);
        playSound("gameover");
        vibrate([100, 50, 100]);
      }
    },
    [playSound, vibrate]
  );

  const handlePlacement = useCallback(
    (shapeIndex: number, shape: Shape, row: number, col: number) => {
      const currentGrid = gridStateRef.current;
      if (!canPlaceShape(currentGrid, shape, row, col)) return;

      let placedCells = 0;
      for (let r = 0; r < shape.height; r++) {
        for (let c = 0; c < shape.width; c++) {
          if (shape.cells[r][c]) placedCells++;
        }
      }

      const newGrid = placeShape(currentGrid, shape, row, col);
      const { newGrid: clearedGrid, linesCleared, clearedRows, clearedCols } = clearLines(newGrid);

      const newCombo = linesCleared > 0 ? combo + 1 : 0;
      const { points, coins } = calculateScore(placedCells, linesCleared, newCombo);

      setScore((s) => s + points);
      setCoinsEarned((c) => c + coins);
      setCombo(newCombo);

      if (linesCleared > 0) {
        playSound("clear", newCombo, linesCleared);
        vibrate(50);

        const scoreId = Date.now();
        setFloatingScores((prev) => [...prev, { id: scoreId, points }]);
        setTimeout(() => {
          setFloatingScores((prev) => prev.filter((item) => item.id !== scoreId));
        }, 800);

        if (newCombo >= 2) {
          const comboId = Date.now() + 1;
          setFloatingCombos((prev) => [...prev, { id: comboId, comboCount: newCombo }]);
          setTimeout(() => {
            setFloatingCombos((prev) => prev.filter((item) => item.id !== comboId));
          }, 900);
        }

        if (linesCleared >= 2) {
          const multiId = Date.now() + 2;
          setFloatingMultis((prev) => [...prev, { id: multiId, linesCount: linesCleared }]);
          setTimeout(() => {
            setFloatingMultis((prev) => prev.filter((item) => item.id !== multiId));
          }, 950);
        }
      } else {
        playSound("place");
        vibrate(15);
      }

      const remainingShapes = shapes.map((s, index) => (index === shapeIndex ? null : s));
      const allUsed = remainingShapes.every((s) => s === null);
      const nextShapes = allUsed ? generateFilteredShapes(adventureLevel, clearedGrid) : remainingShapes;

      setShapes(nextShapes);
      shapesStateRef.current = nextShapes;

      if (clearedRows.length > 0 || clearedCols.length > 0) {
        setIsClearing(true);
        setClearingRows(clearedRows);
        setClearingCols(clearedCols);
        setGrid(newGrid);
        setTimeout(() => {
          setGrid(clearedGrid);
          setClearingRows([]);
          setClearingCols([]);
          setIsClearing(false);
          checkGameOver(clearedGrid, nextShapes);
        }, 400);
      } else {
        setGrid(newGrid);
        checkGameOver(newGrid, nextShapes);
      }
    },
    [shapes, combo, checkGameOver, playSound, vibrate, adventureLevel, generateFilteredShapes]
  );

  const findSnapPosition = useCallback(
    (shape: Shape, targetRow: number, targetCol: number): { row: number; col: number } | null => {
      const currentGrid = gridStateRef.current;
      if (targetRow < 0 || targetCol < 0 || targetRow >= GRID_SIZE || targetRow >= GRID_SIZE) return null;
      if (canPlaceShape(currentGrid, shape, targetRow, targetCol)) return { row: targetRow, col: targetCol };

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const row = targetRow + dr;
          const col = targetCol + dc;
          if (canPlaceShape(currentGrid, shape, row, col)) return { row, col };
        }
      }
      return null;
    },
    []
  );

  const computeTargetFromPointer = useCallback(
    (pointerX: number, pointerY: number, shape: Shape, isTouch: boolean) => {
      if (!gridRef.current) return { row: -1, col: -1 };
      const gridRect = gridRef.current.getBoundingClientRect();
      const shapePixelW = shape.width * totalCellSize - gap;
      const shapePixelH = shape.height * totalCellSize - gap;

      let shapeLeft = pointerX - shapePixelW / 2;
      let shapeTop = isTouch ? pointerY - touchLiftOffset - shapePixelH : pointerY - shapePixelH / 2;

      const relX = shapeLeft - gridRect.left;
      const relY = shapeTop - gridRect.top;

      return {
        row: Math.round(relY / totalCellSize),
        col: Math.round(relX / totalCellSize),
      };
    },
    [totalCellSize, gap, touchLiftOffset]
  );

  const handlePointerDown = (e: React.PointerEvent, shapeIndex: number, shape: Shape) => {
    if (isClearing || gameOver || shapes[shapeIndex] === null) return;
    e.preventDefault();
    playSound("grab");
    vibrate(10);
    const isTouch = e.pointerType === "touch";
    const newDrag = { shapeIndex, shape, pointerX: e.clientX, pointerY: e.clientY, isTouch, startX: e.clientX, startY: e.clientY };
    setDrag(newDrag);
    dragRef.current = newDrag;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    pointerPositionRef.current = { x: e.clientX, y: e.clientY };
    if (pointerMoveFrameRef.current !== null) return;

    pointerMoveFrameRef.current = window.requestAnimationFrame(() => {
      pointerMoveFrameRef.current = null;
      const currentDrag = dragRef.current;
      if (!currentDrag) return;
      const { x, y } = pointerPositionRef.current;
      setDrag({ ...currentDrag, pointerX: x, pointerY: y });
      const { row, col } = computeTargetFromPointer(x, y, currentDrag.shape, currentDrag.isTouch);
      const snap = findSnapPosition(currentDrag.shape, row, col);
      setHoverRow(snap?.row ?? -1);
      setHoverCol(snap?.col ?? -1);
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerMoveFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerMoveFrameRef.current);
      pointerMoveFrameRef.current = null;
    }
    const currentDrag = dragRef.current;
    if (!currentDrag) return;
    e.preventDefault();

    const { row, col } = computeTargetFromPointer(e.clientX, e.clientY, currentDrag.shape, currentDrag.isTouch);
    const snap = findSnapPosition(currentDrag.shape, row, col);
    if (snap) {
      handlePlacement(currentDrag.shapeIndex, currentDrag.shape, snap.row, snap.col);
    }
    setDrag(null);
    dragRef.current = null;
    setHoverRow(-1);
    setHoverCol(-1);
  };

  const activeShape = drag ? shapes[drag.shapeIndex] : null;
  const ghostSnap = activeShape && hoverRow !== -1 && hoverCol !== -1 ? findSnapPosition(activeShape, hoverRow, hoverCol) : null;

  return (
    <div
      onPointerMove={drag ? handlePointerMove : undefined}
      onPointerUp={drag ? handlePointerUp : undefined}
      onPointerCancel={drag ? handlePointerUp : undefined}
      style={{
        background: `linear-gradient(180deg, #263f71 0%, #344e82 48%, #21375f 100%)`,
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 12px", boxSizing: "border-box" }}>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 12, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          ← Çıkış
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase" }}>SKOR</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{score}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase" }}>EN YÜKSEK</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffd447" }}>{Math.max(bestScore, score)}</div>
        </div>
      </div>

      <div
        ref={gridRef}
        style={{
          position: "relative",
          width: GRID_SIZE * totalCellSize - gap,
          height: GRID_SIZE * totalCellSize - gap,
          margin: "10px auto",
          background: "rgba(15, 23, 42, 0.65)",
          borderRadius: 16,
          padding: 8,
          boxSizing: "content-box",
          overflow: "hidden",
        }}
      >
        {isHalfFull && (
          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: 14,
              border: "3px dotted #00ffff",
              boxShadow: "0 0 12px #00ffff, inset 0 0 12px #00ffff",
              animation: "marqueeBorder 1.2s steps(8) infinite",
              pointerEvents: "none",
              zIndex: 12,
            }}
          />
        )}

        {floatingScores.map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 32,
              fontWeight: 900,
              color: "#00ffff",
              textShadow: "0 0 10px #00ffff, 0 0 20px #ff00de, 0 0 30px #ffffff",
              animation: "ledScorePop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              pointerEvents: "none",
              zIndex: 100,
              background: "rgba(0, 0, 0, 0.5)",
              padding: "4px 16px",
              borderRadius: "20px",
              border: "2px solid #00ffff",
            }}
          >
            +{item.points}
          </div>
        ))}

        {floatingCombos.map((item) => {
          const isHarika = item.comboCount >= 3;
          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                top: "35%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 36,
                fontWeight: 900,
                color: isHarika ? "#00ffff" : "#ffd447",
                textShadow: isHarika ? "0 0 14px #00ffff, 0 0 28px #9333ea, 0 0 40px #ffffff" : "0 0 12px #ff007f, 0 0 24px #00ffff, 0 0 36px #ffffff",
                animation: "ledComboPop 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                pointerEvents: "none",
                zIndex: 110,
                background: "rgba(0, 0, 0, 0.6)",
                padding: "6px 20px",
                borderRadius: "24px",
                border: isHarika ? "3px solid #00ffff" : "3px solid #ff007f",
                letterSpacing: "2px",
              }}
            >
              {isHarika ? "HARİKA!" : `KOMBO x${item.comboCount}!`}
            </div>
          );
        })}

        {floatingMultis.map((item) => {
          const isThree = item.linesCount >= 3;
          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                top: "20%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 38,
                fontWeight: 900,
                color: isThree ? "#ff00ff" : "#00ffcc",
                textShadow: isThree ? "0 0 16px #ff00ff, 0 0 32px #00ffff, 0 0 48px #ffffff" : "0 0 14px #00ffcc, 0 0 28px #ffcc00, 0 0 40px #ffffff",
                animation: "ledMultiPop 0.95s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                pointerEvents: "none",
                zIndex: 120,
                background: "rgba(0, 0, 0, 0.7)",
                padding: "8px 24px",
                borderRadius: "28px",
                border: isThree ? "3px solid #ff00ff" : "3px solid #00ffcc",
                letterSpacing: "3px",
              }}
            >
              {isThree ? "ENTERESAN!" : "Woow!"}
            </div>
          );
        })}

        {isClearing && clearingCols.map((colIdx) => (
          <React.Fragment key={`bloom-group-${colIdx}`}>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 8 + colIdx * totalCellSize - 4,
                width: cellSize + 8,
                background: "linear-gradient(180deg, rgba(0, 255, 255, 0.95), rgba(255, 0, 150, 0.95), rgba(255, 220, 0, 0.95))",
                boxShadow: "0 0 45px #00ffff, 0 0 90px #ff0096, inset 0 0 30px #ffffff",
                filter: "blur(6px)",
                zIndex: 5,
                animation: "bloomExplosion 0.4s cubic-bezier(0.1, 0.9, 0.2, 1) forwards",
                pointerEvents: "none",
              }}
            />
            {Array.from({ length: 8 }).map((_, pIdx) => (
              <div
                key={`particle-${colIdx}-${pIdx}`}
                style={{
                  position: "absolute",
                  top: `${10 + pIdx * 12}%`,
                  left: 8 + colIdx * totalCellSize + cellSize / 2,
                  width: 6 + (pIdx % 4) * 2,
                  height: 6 + (pIdx % 4) * 2,
                  backgroundColor: pIdx % 2 === 0 ? "#00ffff" : "#ff0096",
                  borderRadius: "50%",
                  boxShadow: "0 0 12px #fff, 0 0 20px #00ffff",
                  zIndex: 6,
                  animation: `particleBurst 0.4s ease-out forwards`,
                  animationDelay: `${pIdx * 0.03}s`,
                  pointerEvents: "none",
                  transform: `translate(${(pIdx % 2 === 0 ? 1 : -1) * (15 + pIdx * 6)}px, 0px)`,
                }}
              />
            ))}
          </React.Fragment>
        ))}

        <style>{`
          @keyframes marqueeBorder {
            0% {
              border-color: #00ffff;
              box-shadow: 0 0 8px #00ffff, inset 0 0 8px #00ffff;
              filter: hue-rotate(0deg);
            }
            50% {
              border-color: #ff007f;
              box-shadow: 0 0 16px #ff007f, inset 0 0 16px #ff007f;
            }
            100% {
              border-color: #ffd447;
              box-shadow: 0 0 8px #ffd447, inset 0 0 8px #ffd447;
              filter: hue-rotate(360deg);
            }
          }
          @keyframes ledScorePop {
            0% {
              transform: translate(-50%, -50%) scale(0.3);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -80%) scale(1);
              opacity: 0;
            }
          }
          @keyframes ledComboPop {
            0% {
              transform: translate(-50%, -50%) scale(0.2) rotate(-10deg);
              opacity: 0;
              filter: hue-rotate(0deg);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
              opacity: 1;
              filter: hue-rotate(180deg);
            }
            100% {
              transform: translate(-50%, -90%) scale(1) rotate(0deg);
              opacity: 0;
              filter: hue-rotate(360deg);
            }
          }
          @keyframes ledMultiPop {
            0% {
              transform: translate(-50%, -50%) scale(0.1) rotate(15deg);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.4) rotate(-5deg);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -100%) scale(1.1) rotate(0deg);
              opacity: 0;
            }
          }
          @keyframes bloomExplosion {
            0% {
              transform: scaleY(0.1) scaleX(0.3);
              opacity: 1;
            }
            40% {
              transform: scaleY(1.2) scaleX(2.2);
              opacity: 1;
            }
            100% {
              transform: scaleY(1) scaleX(3.5);
              opacity: 0;
            }
          }
          @keyframes particleBurst {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(0.2);
              opacity: 0;
            }
          }
        `}</style>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`, gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`, gap, position: "relative", zIndex: 2 }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isClearingCell = clearingRows.includes(r) || clearingCols.includes(c);
              const cellColor = cell ? COLORS[cell - 1] : "transparent";
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell ? cellColor : "rgba(255,255,255,0.04)",
                    borderRadius: 6,
                    transform: isClearingCell ? "scale(0) rotate(90deg)" : "scale(1)",
                    opacity: isClearingCell ? 0 : 1,
                    boxShadow: isClearingCell ? "0 0 25px #ffffff, inset 0 0 15px #00ffff" : "none",
                    transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease",
                  }}
                />
              );
            })
          )}
        </div>

        {activeShape && ghostSnap && (
          <div
            style={{
              position: "absolute",
              top: 8 + ghostSnap.row * totalCellSize,
              left: 8 + ghostSnap.col * totalCellSize,
              display: "grid",
              gridTemplateColumns: `repeat(${activeShape.width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${activeShape.height}, ${cellSize}px)`,
              gap,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {activeShape.cells.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`ghost-${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell ? activeShape.color : "transparent",
                    borderRadius: 6,
                    opacity: 0.4,
                    boxShadow: cell ? `0 0 12px ${activeShape.color}` : "none",
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "100%", maxWidth: 440, marginTop: 20, minHeight: 120 }}>
        {shapes.map((shape, index) => {
          if (!shape) return <div key={index} style={{ width: 100, height: 100 }} />;
          const isDragging = drag?.shapeIndex === index;
          return (
            <div key={index} onPointerDown={(e) => handlePointerDown(e, index, shape)} style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", opacity: isDragging ? 0.2 : 1, touchAction: "none", background: "transparent" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${shape.width}, 22px)`, gridTemplateRows: `repeat(${shape.height}, 22px)`, gap: 2 }}>
                {shape.cells.map((row, r) =>
                  row.map((cell, c) => (
                    <div key={`${r}-${c}`} style={{ width: 22, height: 22, backgroundColor: cell ? shape.color : "transparent", borderRadius: 4 }} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {drag && activeShape && (
        <div
          style={{
            position: "fixed",
            left: drag.pointerX - (activeShape.width * 22) / 2,
            top: drag.isTouch ? drag.pointerY - touchLiftOffset - (activeShape.height * 22) : drag.pointerY - (activeShape.height * 22) / 2,
            display: "grid",
            gridTemplateColumns: `repeat(${activeShape.width}, 22px)`,
            gridTemplateRows: `repeat(${activeShape.height}, 22px)`,
            gap: 2,
            pointerEvents: "none",
            zIndex: 9999,
            transform: "scale(1.3)",
            filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.4))",
          }}
        >
          {activeShape.cells.map((row, r) =>
            row.map((cell, c) => (
              <div key={`drag-${r}-${c}`} style={{ width: 22, height: 22, backgroundColor: cell ? activeShape.color : "transparent", borderRadius: 4 }} />
            ))
          )}
        </div>
      )}

      {gameOver && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#ff4757", marginBottom: 20 }}>OYUN BİTTİ</div>
          <div style={{ fontSize: 20, color: "#fff", marginBottom: 30 }}>Skorun: {score}</div>
          <button onClick={() => window.location.reload()} style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            Tekrar Oyna
          </button>
        </div>
      )}
    </div>
  );
}