import { useState, useEffect, useCallback, useRef } from "react";
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
  onGameOver: (
    score: number,
    coinsEarned: number,
    levelCompleted: boolean,
    stats: { maxCombo: number; maxMultiClear: number; blocksPlaced: number }
  ) => void;
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

type LEDParticle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  type?: "crystal" | "neon" | "firework" | "butterfly" | "square" | "star";
  life?: number;
};

type FloatingScore = {
  id: number;
  points: number;
  x: number;
  y: number;
};

const BACKGROUND_GRADIENTS = [
  "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "linear-gradient(180deg, #373b44 0%, #4286f4 100%)",
  "linear-gradient(180deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)",
  "linear-gradient(180deg, #2b5876 0%, #4e4376 100%)",
  "linear-gradient(180deg, #000428 0%, #004e92 100%)",
  "linear-gradient(180deg, #4b6cb7 0%, #182848 100%)",
];

const ADVANCED_SHAPES: Shape[] = [];
const STORAGE_KEY = "kutu_tetris_saved_state";

const PRAISE_WORDS = ["Woov!", "Süper!", "Harika!", "İlginç!", "Muhteşem!", "Vov!"];

const sanitizeShape = (shape: Shape): Shape => {
  if (!shape || !shape.cells) return shape;
  const actualHeight = shape.cells.length;
  const actualWidth = shape.cells[0]?.length || 0;
  return {
    ...shape,
    height: actualHeight,
    width: actualWidth,
  };
};

const isPlusShape = (shape: Shape) => {
  if (!shape || shape.width !== 3 || shape.height !== 3) return false;
  const c = shape.cells;
  return (
    Boolean(c[1]?.[1]) &&
    Boolean(c[0]?.[1]) &&
    Boolean(c[1]?.[0]) &&
    Boolean(c[1]?.[2]) &&
    Boolean(c[2]?.[1]) &&
    !c[0]?.[0] &&
    !c[0]?.[2] &&
    !c[2]?.[0] &&
    !c[2]?.[2]
  );
};

const getShapeCellCount = (shape: Shape): number => {
  if (!shape || !shape.cells) return 0;
  let count = 0;
  for (let sr = 0; sr < shape.cells.length; sr++) {
    for (let sc = 0; sc < (shape.cells[sr]?.length || 0); sc++) {
      if (shape.cells[sr][sc]) count++;
    }
  }
  return count;
};

const isZCXOrStair = (s: Shape): boolean => {
  if (!s || !s.cells) return false;
  const count = getShapeCellCount(s);
  const w = s.width;
  const h = s.height;
  const c = s.cells;

  if (w === 3 && h === 3) {
    if (count === 5 && c[1]?.[1] && (c[0]?.[1] && c[2]?.[1] && c[1]?.[0] && c[1]?.[2])) return true;
    if (count === 5 && c[1]?.[1] && (c[0]?.[0] && c[0]?.[2] && c[2]?.[0] && c[2]?.[2])) return true;
    if ((c[0]?.[0] && c[1]?.[1] && c[2]?.[2]) || (c[0]?.[2] && c[1]?.[1] && c[2]?.[0])) return true;
  }

  if ((w === 3 && h === 2) || (w === 2 && h === 3)) {
    if (count === 4) {
      if (w === 3 && h === 2) {
        if ((c[0]?.[0] && c[0]?.[1] && c[1]?.[1] && c[1]?.[2]) || (c[1]?.[0] && c[1]?.[1] && c[0]?.[1] && c[0]?.[2])) return true;
      }
      if (w === 2 && h === 3) {
        if ((c[0]?.[1] && c[1]?.[1] && c[1]?.[0] && c[2]?.[0]) || (c[0]?.[0] && c[1]?.[0] && c[1]?.[1] && c[2]?.[1])) return true;
      }
    }
  }

  if (count === 5) {
    if (w === 3 && h === 3) {
      if (c[0]?.[0] && c[0]?.[1] && c[0]?.[2] && c[1]?.[0] && c[2]?.[0] && c[2]?.[1] && c[2]?.[2] && !c[1]?.[1] && !c[1]?.[2]) return true;
      if (c[0]?.[0] && c[0]?.[1] && c[0]?.[2] && c[1]?.[2] && c[2]?.[0] && c[2]?.[1] && c[2]?.[2] && !c[1]?.[1] && !c[1]?.[0]) return true;
    }
  }

  if (count === 3 && w >= 2 && h >= 2) {
    if ((c[0]?.[0] && c[1]?.[1] && c[2]?.[2]) || (c[0]?.[2] && c[1]?.[1] && c[2]?.[0])) return true;
  }

  return false;
};

const isShapeAllowedForLevel = (s: Shape, level: number): boolean => {
  if (!s) return false;
  const count = getShapeCellCount(s);

  if (level < 3) {
    if (s.width > 2 || s.height > 2) return false;
    if (s.width === 2 && s.height === 2 && count !== 4) return false;
    return count === 1 || count === 2 || count === 4;
  }

  if (level === 3) {
    if (s.width > 3 || s.height > 3) return false;
    if (isZCXOrStair(s)) return false;
    return true;
  }

  return true;
};

const evaluateShapeForGrid = (shape: Shape, g: number[][]): number => {
  let cellCount = 0;
  for (let sr = 0; sr < shape.height; sr++) {
    for (let sc = 0; sc < shape.width; sc++) {
      if (shape.cells[sr]?.[sc]) cellCount++;
    }
  }

  let maxScore = -1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlaceShape(g, shape, r, c)) {
        const testGrid = placeShape(g, shape, r, c);
        const { linesCleared } = clearLines(testGrid);

        let fillBonus = 0;
        let adjacencyBonus = 0;

        for (let sr = 0; sr < shape.height; sr++) {
          for (let sc = 0; sc < shape.width; sc++) {
            if (shape.cells[sr]?.[sc]) {
              const gr = r + sr;
              const gc = c + sc;
              let rowFill = 0;
              let colFill = 0;
              for (let i = 0; i < GRID_SIZE; i++) {
                if (g[gr]?.[i]) rowFill++;
                if (g[i]?.[gc]) colFill++;
              }
              fillBonus += rowFill + colFill;

              const neighbors = [
                [gr - 1, gc],
                [gr + 1, gc],
                [gr, gc - 1],
                [gr, gc + 1],
              ];
              for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                  if (g[nr]?.[nc]) adjacencyBonus += 120;
                }
              }
            }
          }
        }

        const simplicityBonus = (9 - cellCount) * 50;
        const score = linesCleared * 100000 + fillBonus * 100 + adjacencyBonus * 150 + simplicityBonus + 1;
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }
  }
  return maxScore;
};

const getValidShapes = (
  level: number,
  currentGrid?: number[][],
  levelBlocksPlaced: number = 0
): Shape[] => {
  const effectiveLevel = level;

  const getRandomShapeWithAdvanced = (lvl: number): Shape => {
    let shape: Shape;
    let attempts = 0;
    do {
      if (lvl >= 8 && ADVANCED_SHAPES.length > 0 && Math.random() < 0.4) {
        const advIndex = Math.floor(Math.random() * ADVANCED_SHAPES.length);
        shape = sanitizeShape(ADVANCED_SHAPES[advIndex]);
      } else {
        const generated = generateThreeShapes(lvl);
        const rawShape = generated[Math.floor(Math.random() * generated.length)];
        shape = sanitizeShape(rawShape);
      }
      attempts++;
    } while (shape && (!isShapeAllowedForLevel(shape, lvl) || isPlusShape(shape)) && attempts < 80);
    return shape;
  };

  if (!currentGrid) {
    let valid: Shape[] = [];
    let attempts = 0;
    while (valid.length < 3 && attempts < 300) {
      attempts++;
      const shape = getRandomShapeWithAdvanced(effectiveLevel);
      if (shape && !isPlusShape(shape) && isShapeAllowedForLevel(shape, effectiveLevel)) {
        valid.push(shape);
      }
    }
    while (valid.length < 3) {
      const shape = getRandomShapeWithAdvanced(effectiveLevel);
      if (shape && !isPlusShape(shape)) {
        valid.push(shape);
      }
    }
    return valid;
  }

  const targetBlocks = level <= 3 ? 15 : 15 + (level - 3) * 3;
  const isSaverPhase = levelBlocksPlaced >= targetBlocks;

  const candidates: { shape: Shape; score: number }[] = [];
  let attempts = 0;
  while (candidates.length < 250 && attempts < 700) {
    attempts++;
    const shape = getRandomShapeWithAdvanced(effectiveLevel);
    if (shape && !isPlusShape(shape) && isShapeAllowedForLevel(shape, effectiveLevel)) {
      const score = evaluateShapeForGrid(shape, currentGrid);
      if (score > 0) {
        candidates.push({ shape, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const valid: Shape[] = [];
  const usedTypes = new Set<string>();

  for (const item of candidates) {
    const shapeKey = JSON.stringify(item.shape.cells);
    if (!usedTypes.has(shapeKey)) {
      usedTypes.add(shapeKey);
      valid.push(item.shape);
      if (valid.length === 3) break;
    }
  }

  if (!isSaverPhase && valid.length >= 3) {
    const saverShapes = valid.slice(0, 2);
    let randomShape = getRandomShapeWithAdvanced(effectiveLevel);
    let rAttempts = 0;
    while (
      (!randomShape || isPlusShape(randomShape) || !isShapeAllowedForLevel(randomShape, effectiveLevel)) &&
      rAttempts < 50
    ) {
      randomShape = getRandomShapeWithAdvanced(effectiveLevel);
      rAttempts++;
    }
    return [...saverShapes, randomShape];
  }

  while (valid.length < 3) {
    const shape = getRandomShapeWithAdvanced(effectiveLevel);
    if (
      shape &&
      !isPlusShape(shape) &&
      isShapeAllowedForLevel(shape, effectiveLevel) &&
      canPlaceAnywhere(currentGrid, shape)
    ) {
      valid.push(shape);
    }
  }

  return valid;
};

export default function GameScreen({
  theme,
  bestScore,
  adventureLevel,
  mode,
  soundEnabled,
  vibrationEnabled,
  onExit,
  onGameOver,
}: GameScreenProps) {
  const startSoundPlayed = useRef(false);

  const [savedState] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      /* localStorage error */
    }
    return null;
  });

  const [bgIndex, setBgIndex] = useState(savedState?.bgIndex ?? 0);
  const [gameDifficulty, setGameDifficulty] = useState(savedState?.gameDifficulty ?? 1);
  const [clearedCount, setClearedCount] = useState(savedState?.clearedCount ?? 0);
  const [levelBlocksPlaced, setLevelBlocksPlaced] = useState(savedState?.levelBlocksPlaced ?? 0);

  const [levelUpText, setLevelUpText] = useState<string | null>(null);
  const [isSweepActive, setIsSweepActive] = useState(false);

  const audioCacheRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    const soundFiles = [
      "bolumbitimi.mp3",
      "victory.mp3",
      "baslangic.mp3",
      "blok.mp3",
      "blokbirakma.wav",
      "masadolumu.mp3",
      "5bolumgameover.mp3",
      "gameover.mp3",
      "satirsutun2.mp3",
      "2blok.mp3",
      "3blok.mp3",
      "combo.wav",
      "combo2.mp3",
      "satir.mp3",
      "woov.mp3",
      "ilginc.mp3",
      "yenioyun.mp3",
      "yenioyun2.mp3",
    ];

    soundFiles.forEach((file) => {
      if (!audioCacheRef.current[file]) {
        const audio = new Audio(`/${file}`);
        audio.preload = "auto";
        audioCacheRef.current[file] = audio;
      }
    });
  }, []);

  const playAudioFile = useCallback((filename: string) => {
    if (!soundEnabled) return;
    try {
      if (!audioCacheRef.current[filename]) {
        const audio = new Audio(`/${filename}`);
        audio.preload = "auto";
        audioCacheRef.current[filename] = audio;
      }
      const audio = audioCacheRef.current[filename];
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      /* Audio play error */
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (soundEnabled) {
      playAudioFile("baslangic.mp3");
    }
  }, [soundEnabled, playAudioFile]);

  const playSound = useCallback(
    (
      type:
        | "place"
        | "clear"
        | "multi"
        | "combo"
        | "gameover"
        | "start"
        | "grab"
        | "levelup"
        | "perfectclear"
        | "warning",
      comboLevel: number = 0,
      linesCleared: number = 0,
      clearedRows: number[] = [],
      clearedCols: number[] = [],
      isBoardEmpty: boolean = false
    ) => {
      if (!soundEnabled) return;

      if (type === "levelup") {
        playAudioFile("bolumbitimi.mp3");
      } else if (type === "perfectclear") {
        playAudioFile("victory.mp3");
      } else if (type === "start") {
        playAudioFile("baslangic.mp3");
      } else if (type === "grab") {
        playAudioFile("blok.mp3");
      } else if (type === "place") {
        playAudioFile("blokbirakma.wav");
      } else if (type === "warning") {
        playAudioFile("masadolumu.mp3");
      } else if (type === "gameover") {
        if (gameDifficulty >= 5) {
          playAudioFile("5bolumgameover.mp3");
        } else {
          playAudioFile("gameover.mp3");
        }
      } else {
        if (linesCleared > 0) {
          playAudioFile("satirsutun2.mp3");
        }

        if (linesCleared === 2) {
          playAudioFile("2blok.mp3");
        } else if (linesCleared >= 3) {
          playAudioFile("3blok.mp3");
        } else if (comboLevel === 1) {
          playAudioFile("combo.wav");
        } else if (comboLevel >= 2) {
          playAudioFile("combo2.mp3");
        } else if (linesCleared > 0) {
          playAudioFile("satir.mp3");
        }

        if (Math.random() < 0.3) {
          if (Math.random() < 0.5) {
            playAudioFile("woov.mp3");
          } else {
            playAudioFile("ilginc.mp3");
          }
        }
      }
    },
    [soundEnabled, playAudioFile, gameDifficulty]
  );

  const playSoundRef = useRef(playSound);
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!vibrationEnabled) return;
      try {
        navigator.vibrate?.(pattern);
      } catch {
        /* Vibration error */
      }
    },
    [vibrationEnabled]
  );

  const [grid, setGrid] = useState<number[][]>(() => createEmptyGrid());
  const [shapes, setShapes] = useState<(Shape | null)[]>(() =>
    getValidShapes(
      savedState?.gameDifficulty ?? 1,
      createEmptyGrid(),
      savedState?.levelBlocksPlaced ?? 0
    )
  );
  const [score, setScore] = useState(0);
  const [currentBestScore, setCurrentBestScore] = useState(
    savedState?.bestScore ?? bestScore ?? 0
  );
  const [combo, setCombo] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(savedState?.coinsEarned ?? 0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverRow, setHoverRow] = useState(-1);
  const [hoverCol, setHoverCol] = useState(-1);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [gameOverFill, setGameOverFill] = useState(false);
  const [gameOverModalShow, setGameOverModalShow] = useState(false);
  const [gameOverColor, setGameOverColor] = useState("#ff4757");

  const [isFiftyFivePercentFull, setIsFiftyFivePercentFull] = useState(false);
  const [showPerfectClear, setShowPerfectClear] = useState(false);

  const [burst, setBurst] = useState<{
    row: number;
    col: number;
    color: string;
    intense: boolean;
  } | null>(null);
  const [ledParticles, setLedParticles] = useState<LEDParticle[]>([]);
  const [displayScore, setDisplayScore] = useState(0);

  const [comboText, setComboText] = useState<string | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  const [shake, setShake] = useState(false);

  const maxComboRef = useRef(0);
  const maxMultiClearRef = useRef(0);
  const blocksPlacedRef = useRef(0);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  const pointerMoveFrameRef = useRef<number | null>(null);
  const gridStateRef = useRef<number[][]>(grid);

  const cellSize = 38;
  const gap = 1;
  const totalCellSize = cellSize + gap;

  useEffect(() => {
    if (score > currentBestScore) {
      setCurrentBestScore(score);
    }
  }, [score, currentBestScore]);

  useEffect(() => {
    if (gameOver) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      const stateToSave = {
        bestScore: Math.max(currentBestScore, score),
        gameDifficulty,
        clearedCount,
        bgIndex,
        coinsEarned,
        levelBlocksPlaced,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      /* localStorage write error */
    }
  }, [score, currentBestScore, gameDifficulty, clearedCount, bgIndex, coinsEarned, levelBlocksPlaced, gameOver]);

  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    if (ledParticles.length === 0) return;
    const timer = requestAnimationFrame(() => {
      setLedParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15,
            vx: p.vx * 0.95,
            rotation: p.rotation + p.vRot,
            size: p.size * 0.92,
            life: (p.life ?? 1) - 0.035,
          }))
          .filter((p) => p.size > 0.5 && (p.life ?? 1) > 0)
      );
    });
    return () => cancelAnimationFrame(timer);
  }, [ledParticles]);

  useEffect(() => {
    let filled = 0;
    for (const row of grid) for (const cell of row) if (cell) filled++;
    const ratio = filled / (GRID_SIZE * GRID_SIZE);
    
    if (!isFiftyFivePercentFull && ratio >= 0.55) {
      playSound("warning");
    }
    setIsFiftyFivePercentFull(ratio >= 0.55);
  }, [grid, isFiftyFivePercentFull, playSound]);

  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.max(1, Math.ceil(Math.abs(diff) / 8));
    const timer = setTimeout(() => {
      setDisplayScore((prev) => prev + (diff > 0 ? step : -step));
    }, 16);
    return () => clearTimeout(timer);
  }, [displayScore, score]);

  const handleExitGame = () => {
    onGameOver(score, coinsEarned, false, {
      maxCombo: maxComboRef.current,
      maxMultiClear: maxMultiClearRef.current,
      blocksPlaced: blocksPlacedRef.current,
    });
    onExit();
  };

  const checkGameOver = useCallback(
    (
      currentGrid: number[][],
      currentShapes: (Shape | null)[],
      currentScore: number
    ) => {
      const activeShapes = currentShapes.filter((s): s is Shape => s !== null);
      if (!hasAnyValidMove(currentGrid, activeShapes)) {
        setGameOver(true);
        setGameOverFill(true);

        const vibrantColors = ["#ff4757", "#ff007f", "#00f0ff", "#39ff14", "#ffe600", "#b006ff", "#ff7eb9"];
        setGameOverColor(vibrantColors[Math.floor(Math.random() * vibrantColors.length)]);

        playSound("gameover");
        vibrate([100, 50, 100]);

        onGameOver(currentScore, coinsEarned, false, {
          maxCombo: maxComboRef.current,
          maxMultiClear: maxMultiClearRef.current,
          blocksPlaced: blocksPlacedRef.current,
        });

        setTimeout(() => {
          setGameOverModalShow(true);
        }, 1500);
      }
    },
    [playSound, vibrate, onGameOver, coinsEarned]
  );

  const spawnLineExplosionParticles = (rows: number[], cols: number[]) => {
    const particles: LEDParticle[] = [];
    const colors = [
      "#ffe600", "#ff007f", "#00f0ff", "#39ff14", "#ffffff", "#ff9900", 
      "#b006ff", "#ff7eb9", "#7afcff", "#ff4757", "#00d2ff", "#ff00ff"
    ];
    const particleTypes: ("star" | "crystal" | "neon" | "firework" | "square")[] = [
      "star", "crystal", "neon", "firework", "square"
    ];

    const generateAtCell = (r: number, c: number) => {
      const centerX = c * totalCellSize + cellSize / 2;
      const centerY = r * totalCellSize + cellSize / 2;
      const count = 4 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const pType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 5.5;

        particles.push({
          id: Math.random(),
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color,
          size: 4 + Math.random() * 7,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 35,
          type: pType,
          life: 0.85 + Math.random() * 0.25,
        });
      }
    };

    rows.forEach((r) => {
      for (let c = 0; c < GRID_SIZE; c++) {
        generateAtCell(r, c);
      }
    });

    cols.forEach((c) => {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!rows.includes(r)) {
          generateAtCell(r, c);
        }
      }
    });

    setLedParticles((prev) => [...prev.slice(-30), ...particles]);
  };

  const runBoardFillSweepEffect = useCallback((onComplete: () => void) => {
    setIsSweepActive(true);
    playSound("levelup");

    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      setTimeout(() => {
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (let c = 0; c < GRID_SIZE; c++) {
            next[r][c] = (r % COLORS.length) + 1;
          }
          return next;
        });
      }, (GRID_SIZE - 1 - r) * 60);
    }

    setTimeout(() => {
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        setTimeout(() => {
          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            for (let c = 0; c < GRID_SIZE; c++) {
              next[r][c] = 0;
            }
            return next;
          });
        }, (GRID_SIZE - 1 - r) * 60);
      }
    }, GRID_SIZE * 60 + 200);

    setTimeout(() => {
      setIsSweepActive(false);
      onComplete();
    }, GRID_SIZE * 120 + 300);
  }, [playSound]);

  const runOpeningFillSweepEffect = useCallback((onComplete: () => void) => {
    setIsSweepActive(true);
    if (Math.random() < 0.5) {
      playAudioFile("yenioyun.mp3");
    } else {
      playAudioFile("yenioyun2.mp3");
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      setTimeout(() => {
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (let c = 0; c < GRID_SIZE; c++) {
            next[r][c] = ((r + c) % COLORS.length) + 1;
          }
          return next;
        });
      }, r * 50);
    }

    setTimeout(() => {
      for (let r = 0; r < GRID_SIZE; r++) {
        setTimeout(() => {
          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            for (let c = 0; c < GRID_SIZE; c++) {
              next[r][c] = 0;
            }
            return next;
          });
        }, r * 50);
      }
    }, GRID_SIZE * 50 + 150);

    setTimeout(() => {
      setIsSweepActive(false);
      onComplete();
    }, GRID_SIZE * 100 + 250);
  }, [playAudioFile]);

  const handlePlacement = useCallback(
    (shapeIndex: number, shape: Shape, row: number, col: number) => {
      const currentGrid = gridStateRef.current;
      if (!canPlaceShape(currentGrid, shape, row, col)) return;

      let placedCells = 0;
      for (let r = 0; r < shape.height; r++) {
        for (let c = 0; c < shape.width; c++) {
          if (shape.cells[r]?.[c]) placedCells++;
        }
      }

      const newGrid = placeShape(currentGrid, shape, row, col);
      setBurst({ row, col, color: shape.color, intense: false });
      window.setTimeout(() => setBurst(null), 520);

      const newLevelBlocksPlaced = levelBlocksPlaced + 1;
      setLevelBlocksPlaced(newLevelBlocksPlaced);

      const {
        newGrid: clearedGrid,
        linesCleared,
        clearedRows,
        clearedCols,
      } = clearLines(newGrid);

      const totalLines = linesCleared;
      let newCombo = combo;

      if (totalLines > 0) {
        newCombo = combo + 1;
      }

      if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
      if (totalLines > maxMultiClearRef.current)
        maxMultiClearRef.current = totalLines;
      blocksPlacedRef.current += 1;

      const { points, coins } = calculateScore(
        placedCells,
        totalLines,
        newCombo
      );

      const newTotalScore = score + points;

      setScore(newTotalScore);
      setCoinsEarned((c) => c + coins);
      setCombo(newCombo);

      if (totalLines > 0) {
        const isBoardEmpty = clearedGrid.every((r) => r.every((cell) => cell === 0));

        const newFloatingId = Date.now();
        setFloatingScores((prev) => [
          ...prev,
          {
            id: newFloatingId,
            points,
            x: (GRID_SIZE * totalCellSize) / 2,
            y: (GRID_SIZE * totalCellSize) / 2,
          },
        ]);
        setTimeout(() => {
          setFloatingScores((prev) => prev.filter((f) => f.id !== newFloatingId));
        }, 900);

        spawnLineExplosionParticles(clearedRows, clearedCols);

        const praiseWord = PRAISE_WORDS[Math.floor(Math.random() * PRAISE_WORDS.length)];
        if (newCombo > 1) {
          setComboText(`COMBO ${newCombo}x - ${praiseWord}`);
          setTimeout(() => setComboText(null), 1200);
        } else {
          setComboText(praiseWord);
          setTimeout(() => setComboText(null), 1000);
        }

        setShake(true);
        vibrate(newCombo > 1 ? [30, 20, 30] : 40);

        if (totalLines >= 3) {
          playSound("multi", newCombo, totalLines, clearedRows, clearedCols, isBoardEmpty);
        } else if (newCombo > 0) {
          playSound("combo", newCombo, totalLines, clearedRows, clearedCols, isBoardEmpty);
        } else {
          playSound("clear", newCombo, totalLines, clearedRows, clearedCols, isBoardEmpty);
        }
        setTimeout(() => setShake(false), 300);

        if (isBoardEmpty) {
          setShowPerfectClear(true);
          playSound("perfectclear");
          setTimeout(() => setShowPerfectClear(false), 2500);

          setBgIndex((prev) => (prev + 1) % BACKGROUND_GRADIENTS.length);

          setClearedCount((prev) => prev + 1);
          const nextDiff = gameDifficulty + 1;
          setGameDifficulty(nextDiff);
          setLevelBlocksPlaced(0);

          setCombo(0);

          runBoardFillSweepEffect(() => {
            const remainingShapes = shapes.map((s, index) =>
              index === shapeIndex ? null : s
            );
            const isSetCompleted = remainingShapes.every((s) => s === null);
            if (isSetCompleted) {
              setCombo(0);
            }
            const newShapes = isSetCompleted
              ? getValidShapes(nextDiff, createEmptyGrid(), 0)
              : remainingShapes;
            setShapes(newShapes);
            checkGameOver(createEmptyGrid(), newShapes, newTotalScore);
          });
          return;
        }
      } else {
        playSound("place");
        vibrate(15);
      }

      const remainingShapes = shapes.map((s, index) =>
        index === shapeIndex ? null : s
      );
      const isSetCompleted = remainingShapes.every((s) => s === null);
      
      if (isSetCompleted) {
        setCombo(0);
      }

      const newShapes = isSetCompleted
        ? getValidShapes(gameDifficulty, clearedGrid, newLevelBlocksPlaced)
        : remainingShapes;
      setShapes(newShapes);

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
          checkGameOver(clearedGrid, newShapes, newTotalScore);
        }, 250);
      } else {
        setGrid(newGrid);
        checkGameOver(newGrid, newShapes, newTotalScore);
      }
    },
    [
      shapes,
      combo,
      soundEnabled,
      checkGameOver,
      vibrate,
      playSound,
      score,
      gameDifficulty,
      levelBlocksPlaced,
      totalCellSize,
      runBoardFillSweepEffect,
    ]
  );

  const findSnapPosition = useCallback(
    (
      shape: Shape,
      targetRow: number,
      targetCol: number
    ): { row: number; col: number } | null => {
      const currentGrid = gridStateRef.current;
      if (
        targetRow < 0 ||
        targetCol < 0 ||
        targetRow >= GRID_SIZE ||
        targetRow >= GRID_SIZE
      ) {
        return null;
      }

      if (canPlaceShape(currentGrid, shape, targetRow, targetCol)) {
        return { row: targetRow, col: targetCol };
      }

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const row = targetRow + dr;
          const col = targetCol + dc;
          if (canPlaceShape(currentGrid, shape, row, col)) {
            return { row, col };
          }
        }
      }

      return null;
    },
    []
  );

  const computeTargetFromPointer = useCallback(
    (
      pointerX: number,
      pointerY: number,
      shape: Shape,
      isTouch: boolean
    ) => {
      if (!gridRef.current) return { row: -1, col: -1 };

      const gridRect = gridRef.current.getBoundingClientRect();
      const gridLeft = gridRect.left;
      const gridTop = gridRect.top;

      const shapePixelW = shape.width * totalCellSize - gap;
      const shapePixelH = shape.height * totalCellSize - gap;

      let shapeLeft: number;
      let shapeTop: number;

      if (isTouch) {
        shapeLeft = pointerX - shapePixelW / 2;
        shapeTop = pointerY - 70 - shapePixelH / 2;
      } else {
        shapeLeft = pointerX - shapePixelW / 2;
        shapeTop = pointerY - shapePixelH / 2;
      }

      const relX = shapeLeft - gridLeft;
      const relY = shapeTop - gridTop;

      const col = Math.floor((relX + cellSize / 2) / totalCellSize);
      const row = Math.floor((relY + cellSize / 2) / totalCellSize);

      return { row, col };
    },
    [totalCellSize, cellSize, gap]
  );

  const handlePointerDown = (
    e: React.PointerEvent,
    shapeIndex: number,
    shape: Shape
  ) => {
    if (isClearing || isSweepActive || gameOver || shapes[shapeIndex] === null) return;
    e.preventDefault();

    playSound("grab");
    vibrate(10);

    const isTouch = e.pointerType === "touch";

    setDrag({
      shapeIndex,
      shape,
      pointerX: e.clientX,
      pointerY: e.clientY,
      isTouch,
      startX: e.clientX,
      startY: e.clientY,
    });
    dragRef.current = {
      shapeIndex,
      shape,
      pointerX: e.clientX,
      pointerY: e.clientY,
      isTouch,
      startX: e.clientX,
      startY: e.clientY,
    };

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
      const newDrag = { ...currentDrag, pointerX: x, pointerY: y };
      setDrag(newDrag);
      dragRef.current = newDrag;

      const { row, col } = computeTargetFromPointer(
        x,
        y,
        currentDrag.shape,
        currentDrag.isTouch
      );
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

    const clientX = (e.clientX === 0 && e.clientY === 0) ? currentDrag.pointerX : e.clientX;
    const clientY = (e.clientX === 0 && e.clientY === 0) ? currentDrag.pointerY : e.clientY;

    const { row, col } = computeTargetFromPointer(
      clientX,
      clientY,
      currentDrag.shape,
      currentDrag.isTouch
    );

    const snap = findSnapPosition(currentDrag.shape, row, col);
    if (snap) {
      handlePlacement(
        currentDrag.shapeIndex,
        currentDrag.shape,
        snap.row,
        snap.col
      );
    }

    setDrag(null);
    dragRef.current = null;
    setHoverRow(-1);
    setHoverCol(-1);
  };

  const handleRestart = () => {
    playAudioFile("baslangic.mp3");
    setGameOverModalShow(false);
    setGameOverFill(false);
    setGameOver(false);

    runOpeningFillSweepEffect(() => {
      const emptyGrid = createEmptyGrid();
      setGrid(emptyGrid);
      gridStateRef.current = emptyGrid;
      const startDiff = gameDifficulty;
      setGameDifficulty(startDiff);
      setClearedCount(0);
      setLevelBlocksPlaced(0);
      setShapes(getValidShapes(startDiff, emptyGrid, 0));
      setScore(0);
      setDisplayScore(0);
      setCombo(0);
      setCoinsEarned(0);
      setBurst(null);
      setLedParticles([]);
      setComboText(null);
      setLevelUpText(null);
      setIsFiftyFivePercentFull(false);
      setShowPerfectClear(false);
      maxComboRef.current = 0;
      maxMultiClearRef.current = 0;
      blocksPlacedRef.current = 0;
      localStorage.removeItem(STORAGE_KEY);
    });
  };

  const renderPreview = () => {
    if (!drag || hoverRow < 0 || hoverCol < 0) return null;

    const tempGrid = grid.map((r) => [...r]);
    for (let r = 0; r < drag.shape.height; r++) {
      for (let c = 0; c < drag.shape.width; c++) {
        if (drag.shape.cells[r]?.[c]) {
          const gr = hoverRow + r;
          const gc = hoverCol + c;
          if (gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE) {
            tempGrid[gr][gc] = 1;
          }
        }
      }
    }

    const willClearRows: number[] = [];
    const willClearCols: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (tempGrid[r].every((cell) => cell !== 0)) {
        willClearRows.push(r);
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      if (tempGrid.every((row) => row[c] !== 0)) {
        willClearCols.push(c);
      }
    }

    const cells: React.ReactNode[] = [];
    for (let r = 0; r < drag.shape.height; r++) {
      for (let c = 0; c < drag.shape.width; c++) {
        if (drag.shape.cells[r]?.[c]) {
          cells.push(
            <div
              key={`prev-${r}-${c}`}
              className="block-3d"
              style={{
                position: "absolute",
                left: (hoverCol + c) * totalCellSize,
                top: (hoverRow + r) * totalCellSize,
                width: cellSize,
                height: cellSize,
                background: drag.shape.color,
                opacity: 0.5,
                boxSizing: "border-box",
              }}
            />
          );
        }
      }
    }

    const rowHighlights = willClearRows.map((r) => (
      <div
        key={`clear-row-${r}`}
        style={{
          position: "absolute",
          left: 0,
          top: r * totalCellSize,
          width: GRID_SIZE * totalCellSize - gap,
          height: cellSize,
          borderRadius: 6,
          border: "2.5px solid #00f0ff",
          boxSizing: "border-box",
          pointerEvents: "none",
          animation: "ledRowColGlow 0.4s infinite linear",
          zIndex: 15,
        }}
      />
    ));

    const colHighlights = willClearCols.map((c) => (
      <div
        key={`clear-col-${c}`}
        style={{
          position: "absolute",
          left: c * totalCellSize,
          top: 0,
          width: cellSize,
          height: GRID_SIZE * totalCellSize - gap,
          borderRadius: 6,
          border: "2.5px solid #ff007f",
          boxSizing: "border-box",
          pointerEvents: "none",
          animation: "ledRowColGlow 0.4s infinite linear",
          zIndex: 15,
        }}
      />
    ));

    return (
      <>
        {rowHighlights}
        {colHighlights}
        {cells}
      </>
    );
  };

  const getDragGhostStyle = (): React.CSSProperties => {
    if (!drag) return { display: "none" };

    const shapePixelW = drag.shape.width * totalCellSize - gap;
    const shapePixelH = drag.shape.height * totalCellSize - gap;

    let left: number;
    let top: number;

    if (drag.isTouch) {
      left = drag.pointerX - shapePixelW / 2;
      top = drag.pointerY - 70 - shapePixelH / 2;
    } else {
      left = drag.pointerX - shapePixelW / 2;
      top = drag.pointerY - shapePixelH / 2;
    }

    return {
      position: "fixed",
      left,
      top,
      display: "grid",
      gridTemplateColumns: `repeat(${drag.shape.width}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${drag.shape.height}, ${cellSize}px)`,
      gap,
      pointerEvents: "none",
      zIndex: 1000,
      transform: "scale(1.05)",
      opacity: 0.92,
    };
  };

  const showValidHint = (shape: Shape | null): boolean => {
    if (!shape || drag) return false;
    return canPlaceAnywhere(gridStateRef.current, shape);
  };

  return (
    <div
      onPointerMove={drag ? handlePointerMove : undefined}
      onPointerUp={drag ? handlePointerUp : undefined}
      onPointerCancel={drag ? handlePointerUp : undefined}
      style={{
        background: BACKGROUND_GRADIENTS[bgIndex % BACKGROUND_GRADIENTS.length],
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        transition: "background 1s ease-in-out",
        animation: shake ? "shake 0.3s ease" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .block-3d {
          border-radius: 2px;
          box-sizing: border-box;
          border-top: 2.5px solid rgba(255, 255, 255, 0.65);
          border-left: 2.5px solid rgba(255, 255, 255, 0.4);
          border-right: 2.5px solid rgba(0, 0, 0, 0.4);
          border-bottom: 2.5px solid rgba(0, 0, 0, 0.6);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.35);
          filter: brightness(1.1) saturate(1.2);
          will-change: transform;
          transform: translateZ(0);
        }
        @keyframes shake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 3px); }
          40% { transform: translate(4px, -3px); }
          60% { transform: translate(-3px, 2px); }
          80% { transform: translate(3px, -2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bgMatchingGlowPulse {
          0% { box-shadow: 0 0 18px #00d2ff, inset 0 0 15px rgba(0, 210, 255, 0.4); border-color: #00d2ff; }
          50% { box-shadow: 0 0 18px #6a11cb, inset 0 0 15px rgba(106, 17, 203, 0.4); border-color: #6a11cb; }
          100% { box-shadow: 0 0 18px #00d2ff, inset 0 0 15px rgba(0, 210, 255, 0.4); border-color: #00d2ff; }
        }
        @keyframes themeLightSeq {
          0% { background-color: #00d2ff; box-shadow: 0 0 12px #00d2ff; }
          50% { background-color: #ffe600; box-shadow: 0 0 12px #ffe600; }
          100% { background-color: #00d2ff; box-shadow: 0 0 12px #00d2ff; }
        }
        @keyframes blinkGameOver {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(0.96); }
        }
        @keyframes gameOverAnim {
          0% { transform: scale(0.2) rotate(-10deg); opacity: 0; filter: blur(10px); }
          60% { transform: scale(1.25) rotate(3deg); opacity: 1; filter: blur(0px); }
          80% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulseTextAnimation {
          0% { transform: scale(1); text-shadow: 0 0 10px #ff4757, 0 0 20px #ff0055; }
          50% { transform: scale(1.08); text-shadow: 0 0 25px #ff4757, 0 0 50px #ff0055, 0 0 75px #ffffff; }
          100% { transform: scale(1); text-shadow: 0 0 10px #ff4757, 0 0 20px #ff0055; }
        }
        @keyframes replayBtnGlow {
          0% { transform: scale(1); box-shadow: 0 0 15px #22c55e, 0 0 30px #22c55e; }
          50% { transform: scale(1.05); box-shadow: 0 0 25px #22c55e, 0 0 50px #4ade80; }
          100% { transform: scale(1); box-shadow: 0 0 15px #22c55e, 0 0 30px #22c55e; }
        }
        @keyframes perfectGlow {
          0% {
            text-shadow: 0 0 10px #ffffff, 0 0 20px #ffe600, 0 0 35px #ff007f;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            text-shadow: 0 0 20px #ffffff, 0 0 30px #00f0ff, 0 0 50px #39ff14;
            transform: translate(-50%, -50%) scale(1.12);
          }
        }
        @keyframes lineClearGlow {
          0% { opacity: 1; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.1); filter: brightness(2); }
          100% { opacity: 0; transform: scale(0.3); }
        }
        @keyframes lineClearFlash {
          0% { opacity: 0; transform: scaleX(0.8); }
          50% { opacity: 1; transform: scaleX(1.05); filter: brightness(2.5); }
          100% { opacity: 0; transform: scaleX(1); }
        }
        @keyframes popSquare {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes floatUpScore {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          50% { opacity: 1; transform: translate(-50%, -100px) scale(1.3); }
          100% { opacity: 0; transform: translate(-50%, -180px) scale(0.7); }
        }
      `}</style>

      {/* Üst Bar / Skor Tabela */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 10px",
          boxSizing: "border-box",
        }}
      >
        {/* Sol tarafta dengelenme için boş alan */}
        <div style={{ width: 32 }} />

        {/* Çift Daireli Skor Çubuğu */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 150,
            height: 48,
          }}
        >
          {/* İki Daireyi Birleştiren Çubuk */}
          <div
            style={{
              position: "absolute",
              width: "100px",
              height: "12px",
              background: "rgba(30, 42, 68, 0.9)",
              borderRadius: "6px",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
              zIndex: 1,
            }}
          />

          {/* Sol Daire: Anlık Skor */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginRight: "32px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 100%)",
              border: "3px solid #001e38",
              boxShadow: "0 4px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "17px",
              letterSpacing: "-0.5px",
            }}
          >
            {displayScore}
          </div>

          {/* Sağ Daire: En Yüksek Skor */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #f97316 0%, #ea580c 100%)",
              border: "3px solid #381200",
              boxShadow: "0 4px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "16px",
              letterSpacing: "-0.5px",
            }}
          >
            {Math.max(currentBestScore, score)}
          </div>
        </div>

        {/* En Sağda Geri Tuşu (Sola Ok Simgesi) */}
        <button
          onClick={handleExitGame}
          aria-label="Geri dön"
          style={{
            background: "transparent",
            border: "none",
            color: "#e2e8f0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            opacity: 0.9,
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>

      {/* Oyun Tahtası (8x8) */}
      <div
        ref={gridRef}
        style={{
          position: "relative",
          width: GRID_SIZE * totalCellSize - gap,
          height: GRID_SIZE * totalCellSize - gap,
          background: "rgba(10, 20, 40, 0.6)",
          borderRadius: 12,
          padding: 0,
          border: isFiftyFivePercentFull
            ? "3px solid #00d2ff"
            : "2px solid rgba(255,255,255,0.1)",
          animation: isFiftyFivePercentFull
            ? "bgMatchingGlowPulse 1.5s infinite linear"
            : "none",
          transition: "border 0.3s ease",
          overflow: "visible",
          touchAction: "none",
        }}
      >
        {isFiftyFivePercentFull && (
          <div style={{ position: "absolute", inset: -12, pointerEvents: "none", zIndex: 25 }}>
            {Array.from({ length: 16 }).map((_, idx) => {
              let top = "0%";
              let left = "0%";
              if (idx < 5) {
                left = `${(idx / 4) * 100}%`;
                top = "0%";
              } else if (idx < 9) {
                left = "100%";
                top = `${((idx - 4) / 4) * 100}%`;
              } else if (idx < 13) {
                left = `${(1 - (idx - 8) / 4) * 100}%`;
                top = "100%";
              } else {
                left = "0%";
                top = `${(1 - (idx - 12) / 4) * 100}%`;
              }
              return (
                <div
                  key={`theme-bulb-${idx}`}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    animation: "themeLightSeq 0.8s infinite linear",
                    animationDelay: `${idx * 0.08}s`,
                  }}
                />
              );
            })}
          </div>
        )}

        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isClearingCell = clearingRows.includes(r) || clearingCols.includes(c);
            return (
              <div
                key={`${r}-${c}`}
                className={cell ? "block-3d" : ""}
                style={{
                  position: "absolute",
                  left: c * totalCellSize,
                  top: r * totalCellSize,
                  width: cellSize,
                  height: cellSize,
                  background: cell
                    ? COLORS[(cell - 1) % COLORS.length]
                    : "rgba(255,255,255,0.05)",
                  borderRadius: cell ? 2 : 4,
                  boxSizing: "border-box",
                  transition: "background 0.15s ease",
                  animation: isClearingCell
                    ? "lineClearGlow 0.25s ease-out forwards"
                    : "none",
                  zIndex: isClearingCell ? 20 : 1,
                }}
              />
            );
          })
        )}
        {renderPreview()}

        {clearingRows.map((r) => (
          <div
            key={`active-clear-row-${r}`}
            style={{
              position: "absolute",
              left: 0,
              top: r * totalCellSize,
              width: GRID_SIZE * totalCellSize - gap,
              height: cellSize,
              borderRadius: 6,
              background: "linear-gradient(90deg, transparent, #ff007f, #ffffff, #00f0ff, transparent)",
              boxShadow: "0 0 20px #00f0ff, 0 0 40px #ff007f",
              pointerEvents: "none",
              zIndex: 30,
              animation: "lineClearFlash 0.25s ease-out forwards",
            }}
          />
        ))}
        {clearingCols.map((c) => (
          <div
            key={`active-clear-col-${c}`}
            style={{
              position: "absolute",
              left: c * totalCellSize,
              top: 0,
              width: cellSize,
              height: GRID_SIZE * totalCellSize - gap,
              borderRadius: 6,
              background: "linear-gradient(180deg, transparent, #ff007f, #ffffff, #00f0ff, transparent)",
              boxShadow: "0 0 20px #ff007f, 0 0 40px #00f0ff",
              pointerEvents: "none",
              zIndex: 30,
              animation: "lineClearFlash 0.25s ease-out forwards",
            }}
          />
        ))}

        {ledParticles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.type === "square" ? 2 : p.type === "neon" ? "50%" : 0,
              clipPath:
                p.type === "star"
                  ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                  : p.type === "butterfly"
                  ? "polygon(50% 0%, 100% 38%, 82% 100%, 50% 75%, 18% 100%, 0% 38%)"
                  : p.type === "crystal"
                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                  : p.type === "firework"
                  ? "polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)"
                  : "none",
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
              boxShadow: `0 0 ${p.size * 1.8}px ${p.color}`,
              pointerEvents: "none",
              zIndex: 40,
              opacity: p.life ?? 1,
            }}
          />
        ))}

        {comboText && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 34,
              fontWeight: 900,
              color: "#ffe600",
              textShadow: "0 0 20px #ff007f, 0 0 40px #ffe600, 0 0 60px #00f0ff",
              pointerEvents: "none",
              zIndex: 40,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {comboText}
          </div>
        )}

        {levelUpText && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 40,
              fontWeight: 900,
              color: "#00f0ff",
              textShadow: "0 0 20px #00f0ff, 0 0 40px #ffffff, 0 0 60px #ff007f",
              pointerEvents: "none",
              zIndex: 60,
              textAlign: "center",
              whiteSpace: "nowrap",
              animation: "perfectGlow 0.8s infinite alternate ease-in-out",
            }}
          >
            {levelUpText}
          </div>
        )}

        {showPerfectClear && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 44,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 3,
              animation: "perfectGlow 0.8s infinite alternate ease-in-out",
              pointerEvents: "none",
              zIndex: 60,
              whiteSpace: "nowrap",
            }}
          >
            Perfect Clear!
          </div>
        )}

        {floatingScores.map((f) => (
          <div
            key={f.id}
            style={{
              position: "absolute",
              left: f.x,
              top: f.y,
              fontSize: 28,
              fontWeight: 900,
              color: "#39ff14",
              textShadow: "0 0 10px #39ff14, 0 0 25px #ffffff",
              pointerEvents: "none",
              zIndex: 50,
              animation: "floatUpScore 0.8s ease-out forwards",
            }}
          >
            +{f.points}
          </div>
        ))}

        {gameOverFill && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(5, 10, 25, 0.95)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                gap: 2,
                padding: 4,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="block-3d"
                  style={{
                    background: COLORS[i % COLORS.length],
                    animation: `popSquare 0.4s ease ${(i * 0.015)}s forwards`,
                    transform: "scale(0)",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 110,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#ff4757",
                  textShadow: "0 0 20px #ff4757, 0 0 40px #ff0055, 0 0 60px #ffffff",
                  letterSpacing: 3,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  animation: "gameOverAnim 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                }}
              >
                GAME OVER
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#00f0ff",
                  textShadow: "0 0 15px #00f0ff, 0 0 30px #ffffff",
                  animation: "pulseTextAnimation 1.5s infinite ease-in-out",
                  letterSpacing: 2,
                }}
              >
                TEKRAR OYNA
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Şekil Seçim Tepsisi */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          maxWidth: 460,
          marginTop: 25,
          padding: "0 10px",
          boxSizing: "border-box",
          touchAction: "none",
        }}
      >
        {shapes.map((shape, index) => (
          <div
            key={index}
            onPointerDown={(e) =>
              shape && handlePointerDown(e, index, shape)
            }
            style={{
              width: 100,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: shape ? "grab" : "default",
              opacity: drag?.shapeIndex === index ? 0.3 : 1,
              touchAction: "none",
            }}
          >
            {shape && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${shape.width}, 20px)`,
                  gridTemplateRows: `repeat(${shape.height}, 20px)`,
                  gap: 2,
                  filter: showValidHint(shape)
                    ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))"
                    : "none",
                }}
              >
                {shape.cells.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={cell ? "block-3d" : ""}
                      style={{
                        width: 20,
                        height: 20,
                        background: cell ? shape.color : "transparent",
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sürüklenen Şekil Önizlemesi */}
      {drag && (
        <div style={getDragGhostStyle()}>
          {drag.shape.cells.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={cell ? "block-3d" : ""}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: cell ? drag.shape.color : "transparent",
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverModalShow && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <h2
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: gameOverColor,
              marginBottom: 15,
              letterSpacing: 2,
              textShadow: `0 0 15px ${gameOverColor}`,
              animation: "blinkGameOver 1s infinite ease-in-out",
            }}
          >
            GAME OVER
          </h2>
          <p
            style={{
              fontSize: 24,
              color: "#fff",
              marginBottom: 30,
              fontWeight: 700,
            }}
          >
            SKOR: {score}
          </p>
          <button
            onClick={handleRestart}
            style={{
              padding: "14px 36px",
              fontSize: 20,
              fontWeight: "bold",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 30,
              cursor: "pointer",
              animation: "replayBtnGlow 1.8s infinite ease-in-out",
            }}
          >
            TEKRAR OYNA
          </button>
        </div>
      )}
    </div>
  );
}