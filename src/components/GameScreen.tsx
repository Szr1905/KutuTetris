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

const THEME_COLORS = [
  "#38bdf8", // Mavi
  "#2dd4bf", // Turkuaz
  "#60a5fa", // Açık Mavi
  "#f87171", // Kırmızı / Turuncu
  "#c084fc", // Mor
  "#3b82f6", // Koyu Mavi
  "#818cf8", // Çivit Mavisi
];

const STORAGE_KEY = "kutu_tetris_saved_state";
const PRAISE_WORDS = ["Woov!", "Süper!", "Harika!", "İlginç!", "Muhteşem!", "Vov!"];

// Her Seviye İçin Farklı Blok Bütünlüğü / Hazır Engel Tasarımları (99: Sabit/Önceden Dolu Blok, 0: Boş)
const LEVEL_LAYOUTS: Record<number, number[][]> = {
  1: createEmptyGrid(),
  2: [
    [99,99,0,0,0,0,99,99],
    [99,0,0,0,0,0,0,99],
    [0,0,0,0,0,0,0,0],
    [0,0,0,99,99,0,0,0],
    [0,0,0,99,99,0,0,0],
    [0,0,0,0,0,0,0,0],
    [99,0,0,0,0,0,0,99],
    [99,99,0,0,0,0,99,99]
  ],
  3: [
    [99,0,0,0,0,0,0,99],
    [0,99,0,0,0,0,99,0],
    [0,0,99,0,0,99,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,99,0,0,99,0,0],
    [0,99,0,0,0,0,99,0],
    [99,0,0,0,0,0,0,99]
  ],
  4: [
    [0,0,0,99,99,0,0,0],
    [0,0,0,99,99,0,0,0],
    [0,0,0,0,0,0,0,0],
    [99,99,0,0,0,0,99,99],
    [99,99,0,0,0,0,99,99],
    [0,0,0,0,0,0,0,0],
    [0,0,0,99,99,0,0,0],
    [0,0,0,99,99,0,0,0]
  ],
  5: [
    [99,0,99,0,0,99,0,99],
    [0,0,0,0,0,0,0,0],
    [99,0,0,0,0,0,0,99],
    [0,0,0,99,99,0,0,0],
    [0,0,0,99,99,0,0,0],
    [99,0,0,0,0,0,0,99],
    [0,0,0,0,0,0,0,0],
    [99,0,99,0,0,99,0,99]
  ]
};

const getLevelLayout = (level: number): number[][] => {
  if (LEVEL_LAYOUTS[level]) {
    return LEVEL_LAYOUTS[level].map(row => [...row]);
  }
  // 5. seviyeden sonraki seviyeler için dinamik engel haritası
  const layout = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (Math.random() < 0.18) layout[r][c] = 99;
    }
  }
  return layout;
};

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

const getShapeCellCount = (shape: Shape): number => {
  let count = 0;
  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      if (shape.cells[r]?.[c]) count++;
    }
  }
  return count;
};

const evaluateShapeForGrid = (shape: Shape, g: number[][]): number => {
  const cellCount = getShapeCellCount(shape);
  let maxScore = -1;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlaceShape(g, shape, r, c)) {
        let fillBonus = 0;
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
            }
          }
        }
        const score = (9 - cellCount) * 2000 + fillBonus * 10;
        if (score > maxScore) maxScore = score;
      }
    }
  }
  return maxScore;
};

const getValidShapes = (
  level: number,
  currentGrid?: number[][],
  _levelBlocksPlaced: number = 0
): Shape[] => {
  const getRandomShape = (lvl: number): Shape => {
    const generated = generateThreeShapes(lvl);
    const rawShape = generated[Math.floor(Math.random() * generated.length)];
    return sanitizeShape(rawShape);
  };

  if (!currentGrid) {
    const valid: Shape[] = [];
    let attempts = 0;
    while (valid.length < 3 && attempts < 30) {
      attempts++;
      const shape = getRandomShape(level);
      if (shape && !valid.some(v => JSON.stringify(v.cells) === JSON.stringify(shape.cells))) {
        valid.push(shape);
      }
    }
    return valid;
  }

  const candidates: { shape: Shape; score: number; cellCount: number }[] = [];
  let attempts = 0;

  while (candidates.length < 15 && attempts < 35) {
    attempts++;
    const shape = getRandomShape(level);
    if (shape && canPlaceAnywhere(currentGrid, shape)) {
      const cellCount = getShapeCellCount(shape);
      const score = evaluateShapeForGrid(shape, currentGrid);
      candidates.push({ shape, score, cellCount });
    }
  }

  if (candidates.length === 0) {
    return generateThreeShapes(1).slice(0, 3).map(sanitizeShape);
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected: Shape[] = [];
  let simGrid = currentGrid.map((r) => [...r]);

  for (let i = 0; i < 3; i++) {
    let validForSim = candidates.filter((c) => canPlaceAnywhere(simGrid, c.shape));

    const uniqueValidForSim = validForSim.filter(
      (c) => !selected.some((s) => JSON.stringify(s.cells) === JSON.stringify(c.shape.cells))
    );

    if (uniqueValidForSim.length > 0) {
      validForSim = uniqueValidForSim;
    }

    const hasSmallShape = selected.some((s) => getShapeCellCount(s) <= 4);
    if (!hasSmallShape && i === 2) {
      const smallCandidates = validForSim.filter((c) => c.cellCount <= 4);
      if (smallCandidates.length > 0) {
        validForSim = smallCandidates;
      }
    }

    if (validForSim.length > 0) {
      const topPoolSize = Math.min(validForSim.length, 5);
      const chosen = validForSim[Math.floor(Math.random() * topPoolSize)].shape;
      selected.push(chosen);

      let placed = false;
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          if (canPlaceShape(simGrid, chosen, r, c)) {
            const nextG = placeShape(simGrid, chosen, r, c);
            const { newGrid } = clearLines(nextG);
            simGrid = newGrid;
            placed = true;
          }
        }
      }
    } else if (candidates.length > 0) {
      const fallback = candidates.find(
        (c) => !selected.some((s) => JSON.stringify(s.cells) === JSON.stringify(c.shape.cells))
      ) || candidates[0];
      selected.push(fallback.shape);
    }
  }

  return selected.sort(() => Math.random() - 0.5);
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
  const [totalLinesCleared, setTotalLinesCleared] = useState(savedState?.totalLinesCleared ?? 0);

  // Mevcut Seviyedeki Puan ve Temizlenen Satır/Sütun Sayaçları
  const [levelScore, setLevelScore] = useState(savedState?.levelScore ?? 0);
  const [levelLinesCleared, setLevelLinesCleared] = useState(savedState?.levelLinesCleared ?? 0);

  // Seviye Geçiş Ekranı (Overlay) Durumu
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);

  const [levelUpText] = useState<string | null>(null);
  const [isSweepActive, setIsSweepActive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});

  useEffect(() => {
    const soundFiles = [
      "yeni_baslangic.mp3",
      "gameover.mp3",
      "5bolumgameover.mp3",
      "3blok.mp3",
      "yeni_victory.mp3",
      "yeni_woov.mp3",
      "cekme.ogg",
      "birakma.ogg"
    ];

    const initWebAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx && !audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
      } catch {
        /* Web Audio desteklenmiyor */
      }

      soundFiles.forEach(async (file) => {
        try {
          const res = await fetch(`/${file}`);
          const arrayBuffer = await res.arrayBuffer();
          if (audioCtxRef.current) {
            const decodedData = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            audioBuffersRef.current[file] = decodedData;
          }
        } catch {
          /* Ses yüklenemedi */
        }
      });
    };

    initWebAudio();
  }, []);

  useEffect(() => {
    if (soundEnabled && !startSoundPlayed.current) {
      startSoundPlayed.current = true;
      const timer = setTimeout(() => playSoundRef.current("start"), 200);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled]);

  const playAudioFile = useCallback((filename: string) => {
    if (!soundEnabled) return;
    try {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        const buffer = audioBuffersRef.current[filename];
        if (buffer) {
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtxRef.current.destination);
          source.start(0);
          return;
        }
      }
      const audio = new Audio(`/${filename}`);
      audio.play().catch(() => {});
    } catch {
      /* Audio play error */
    }
  }, [soundEnabled]);

  const playSynthSound = useCallback((type: "grab" | "place" | "clear_1" | "clear_2" | "clear_3" | "clear_4" | "clear_5" | "combo_lively" | "warning" | "lively" | "start_fanfare" | "levelup_fanfare", level: number = 0) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = "sine", vol: number = 0.2, pitchSlide?: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        if (pitchSlide) {
          osc.frequency.exponentialRampToValueAtTime(pitchSlide, startTime + duration);
        }

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (type === "levelup_fanfare") {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.08, 0.3, "triangle", 0.25);
        });
      } else if (type === "start_fanfare") {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.05, 0.25, "sine", 0.2);
        });
      } else if (type === "grab") {
        playTone(420, now, 0.06, "sine", 0.25, 880);
      } else if (type === "place") {
        playTone(750, now, 0.05, "sine", 0.25, 220);
      } else if (type === "warning") {
        const notes = [440, 554.37];
        notes.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.12, 0.15, "sine", 0.15);
        });
      } else if (type === "clear_1") {
        playTone(1318.51, now, 0.18, "sine", 0.25);
        playTone(1760.00, now + 0.05, 0.2, "sine", 0.25);
      } else if (type === "clear_2") {
        const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
        freqs.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.04, 0.2, "sine", 0.2);
        });
      } else if (type === "clear_3") {
        const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
        freqs.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.04, 0.2, "sine", 0.22);
        });
      } else if (type === "clear_4" || type === "clear_5") {
        const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        freqs.forEach((freq, idx) => {
          playTone(freq, now + idx * 0.035, 0.25, "sine", 0.2);
        });
      } else if (type === "combo_lively") {
        const baseFreq = 523.25 + Math.min(level, 10) * 80;
        playTone(baseFreq, now, 0.15, "sine", 0.25, baseFreq * 1.35);
      } else if (type === "lively") {
        playTone(600, now, 0.12, "sine", 0.2, 1400);
      }
    } catch {
      /* Audio Synth error */
    }
  }, [soundEnabled]);

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
    ) => {
      if (!soundEnabled) return;

      if (type === "levelup") {
        playAudioFile("yeni_victory.mp3");
        playSynthSound("levelup_fanfare");
      } else if (type === "perfectclear") {
        playAudioFile("yeni_victory.mp3");
        playSynthSound("clear_5");
      } else if (type === "start") {
        playAudioFile("yeni_baslangic.mp3");
        playSynthSound("start_fanfare");
      } else if (type === "gameover") {
        if (gameDifficulty >= 5) {
          playAudioFile("5bolumgameover.mp3");
        } else {
          playAudioFile("gameover.mp3");
        }
      } else if (type === "grab") {
        playSynthSound("grab");
      } else if (type === "place") {
        playSynthSound("place");
      } else if (type === "warning") {
        playSynthSound("warning");
      } else if (type === "clear" || type === "multi" || type === "combo") {
        if (comboLevel >= 1) {
          playSynthSound("combo_lively", comboLevel);
        }

        if (linesCleared >= 5) {
          playSynthSound("clear_5");
        } else if (linesCleared === 4) {
          playSynthSound("clear_4");
        } else if (linesCleared === 3) {
          playSynthSound("clear_3");
        } else if (linesCleared === 2) {
          playSynthSound("clear_2");
        } else if (linesCleared === 1) {
          playSynthSound("clear_1");
        }
      }

      if (linesCleared > 0 && Math.random() < 0.25) {
        if (Math.random() < 0.5) {
          playAudioFile("yeni_woov.mp3");
        } else {
          playSynthSound("lively");
        }
      }
    },
    [soundEnabled, playAudioFile, playSynthSound, gameDifficulty]
  );

  const playSoundRef = useRef(playSound);
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  const [grid, setGrid] = useState<number[][]>(() => getLevelLayout(savedState?.gameDifficulty ?? 1));
  const [shapes, setShapes] = useState<(Shape | null)[]>(() =>
    getValidShapes(
      savedState?.gameDifficulty ?? 1,
      getLevelLayout(savedState?.gameDifficulty ?? 1),
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

  const [isFiftyPercentFull, setIsFiftyPercentFull] = useState(false);
  const [showPerfectClear, setShowPerfectClear] = useState(false);

  const [, setBurst] = useState<{
    row: number;
    col: number;
    color: string;
    intense: boolean;
  } | null>(null);
  const [ledParticles, setLedParticles] = useState<LEDParticle[]>([]);
  const [displayScore, setDisplayScore] = useState(0);

  const [comboText, setComboText] = useState<string | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

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
        totalLinesCleared,
        levelScore,
        levelLinesCleared,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      /* localStorage write error */
    }
  }, [score, currentBestScore, gameDifficulty, clearedCount, bgIndex, coinsEarned, levelBlocksPlaced, totalLinesCleared, levelScore, levelLinesCleared, gameOver]);

  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    if (ledParticles.length === 0) return;
    let animId: number;
    let lastTime = performance.now();

    const updateParticles = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      setLedParticles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 60,
            y: p.y + p.vy * dt * 60,
            vy: p.vy + 0.15 * dt * 60,
            vx: p.vx * Math.pow(0.95, dt * 60),
            rotation: p.rotation + p.vRot * dt * 60,
            size: p.size * Math.pow(0.92, dt * 60),
            life: (p.life ?? 1) - 0.035 * dt * 60,
          }))
          .filter((p) => p.size > 0.5 && (p.life ?? 1) > 0);
      });

      animId = requestAnimationFrame(updateParticles);
    };

    animId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animId);
  }, [ledParticles.length > 0]);

  useEffect(() => {
    let filled = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c]) filled++;
      }
    }
    const ratio = filled / (GRID_SIZE * GRID_SIZE);

    if (!isFiftyPercentFull && ratio >= 0.50) {
      playSound("warning");
    }
    setIsFiftyPercentFull(ratio >= 0.50);
  }, [grid, isFiftyPercentFull, playSound]);

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

        onGameOver(currentScore, coinsEarned, false, {
          maxCombo: maxComboRef.current,
          maxMultiClear: maxMultiClearRef.current,
          blocksPlaced: blocksPlacedRef.current,
        });

        setTimeout(() => {
          setGameOverModalShow(true);
        }, 1200);
      }
    },
    [playSound, onGameOver, coinsEarned]
  );

  const runBoardFillSweepEffect = useCallback((onComplete: () => void) => {
    setIsSweepActive(true);

    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      setTimeout(() => {
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (let c = 0; c < GRID_SIZE; c++) {
            next[r][c] = (r % COLORS.length) + 1;
          }
          return next;
        });
      }, (GRID_SIZE - 1 - r) * 45);
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
        }, (GRID_SIZE - 1 - r) * 45);
      }
    }, GRID_SIZE * 45 + 150);

    setTimeout(() => {
      setIsSweepActive(false);
      onComplete();
    }, GRID_SIZE * 90 + 200);
  }, []);

  const runOpeningFillSweepEffect = useCallback((onComplete: () => void) => {
    setIsSweepActive(true);

    for (let r = 0; r < GRID_SIZE; r++) {
      setTimeout(() => {
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (let c = 0; c < GRID_SIZE; c++) {
            next[r][c] = ((r + c) % COLORS.length) + 1;
          }
          return next;
        });
      }, r * 40);
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
        }, r * 40);
      }
    }, GRID_SIZE * 40 + 100);

    setTimeout(() => {
      setIsSweepActive(false);
      onComplete();
    }, GRID_SIZE * 80 + 180);
  }, []);

  // Seviye Geçişi Tetikleme Fonksiyonu
  const triggerLevelTransition = useCallback(
    (nextLevel: number, newTotalScore: number) => {
      setIsLevelTransitioning(true);
      playSound("levelup");

      setTimeout(() => {
        setGameDifficulty(nextLevel);
        setBgIndex((prev) => (prev + 1) % BACKGROUND_GRADIENTS.length);
        setLevelBlocksPlaced(0);
        setLevelScore(0);
        setLevelLinesCleared(0);

        const newLevelGrid = getLevelLayout(nextLevel);
        setGrid(newLevelGrid);
        gridStateRef.current = newLevelGrid;

        const newShapes = getValidShapes(nextLevel, newLevelGrid, 0);
        setShapes(newShapes);

        setIsLevelTransitioning(false);
        checkGameOver(newLevelGrid, newShapes, newTotalScore);
      }, 2500);
    },
    [playSound, checkGameOver]
  );

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
      window.setTimeout(() => setBurst(null), 300);

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
      const newLevelScore = levelScore + points;
      const newLevelLines = levelLinesCleared + totalLines;

      setScore(newTotalScore);
      setLevelScore(newLevelScore);
      setLevelLinesCleared(newLevelLines);
      setCoinsEarned((c) => c + coins);
      setCombo(newCombo);

      const newTotalLinesCleared = totalLinesCleared + totalLines;
      setTotalLinesCleared(newTotalLinesCleared);

      // Sadece 2500 puan olunca seviye geçilsin
      const isLevelUp = newLevelScore >= 2500;

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
        }, 750);

        const praiseWord = PRAISE_WORDS[Math.floor(Math.random() * PRAISE_WORDS.length)];
        if (newCombo > 1) {
          setComboText(`COMBO ${newCombo}x - ${praiseWord}`);
          setTimeout(() => setComboText(null), 1000);
        } else {
          setComboText(praiseWord);
          setTimeout(() => setComboText(null), 850);
        }

        if (totalLines >= 3) {
          playSound("multi", newCombo, totalLines);
        } else if (totalLines === 2) {
          playSound("clear", newCombo, totalLines);
        } else if (newCombo > 0) {
          playSound("combo", newCombo, totalLines);
        } else {
          playSound("clear", newCombo, totalLines);
        }

        // PERFECT CLEAR
        if (isBoardEmpty) {
          setShowPerfectClear(true);
          playSound("perfectclear");
          setTimeout(() => setShowPerfectClear(false), 2000);

          setBgIndex((prev) => (prev + 1) % BACKGROUND_GRADIENTS.length);
          setClearedCount((prev) => prev + 1);

          const nextDiff = gameDifficulty + 1;
          setGameDifficulty(nextDiff);
          setLevelBlocksPlaced(0);
          setLevelScore(0);
          setLevelLinesCleared(0);
          setCombo(0);

          runBoardFillSweepEffect(() => {
            const finalGrid = getLevelLayout(nextDiff);
            
            const remainingShapes = shapes.map((s, index) =>
              index === shapeIndex ? null : s
            );
            const isSetCompleted = remainingShapes.every((s) => s === null);
            const newShapes = isSetCompleted
              ? getValidShapes(nextDiff, finalGrid, 0)
              : remainingShapes;
            
            setGrid(finalGrid);
            setShapes(newShapes);
            checkGameOver(finalGrid, newShapes, newTotalScore);
          });
          return;
        }
      } else {
        playSound("place");
      }

      const remainingShapes = shapes.map((s, index) =>
        index === shapeIndex ? null : s
      );
      const isSetCompleted = remainingShapes.every((s) => s === null);

      if (isSetCompleted) {
        setCombo(0);
      }

      if (clearedRows.length > 0 || clearedCols.length > 0) {
        setIsClearing(true);
        setClearingRows(clearedRows);
        setClearingCols(clearedCols);
        setGrid(newGrid);

        setTimeout(() => {
          const finalGrid = clearedGrid;
          setGrid(finalGrid);
          setClearingRows([]);
          setClearingCols([]);
          setIsClearing(false);

          if (isLevelUp) {
            triggerLevelTransition(gameDifficulty + 1, newTotalScore);
          } else {
            const newShapes = isSetCompleted
              ? getValidShapes(gameDifficulty, finalGrid, newLevelBlocksPlaced)
              : remainingShapes;

            setShapes(newShapes);
            checkGameOver(finalGrid, newShapes, newTotalScore);
          }
        }, 150);
      } else {
        const finalGrid = newGrid;
        setGrid(finalGrid);

        if (isLevelUp) {
          triggerLevelTransition(gameDifficulty + 1, newTotalScore);
        } else {
          const newShapes = isSetCompleted
            ? getValidShapes(gameDifficulty, finalGrid, newLevelBlocksPlaced)
            : remainingShapes;

          setShapes(newShapes);
          checkGameOver(finalGrid, newShapes, newTotalScore);
        }
      }
    },
    [
      shapes,
      combo,
      checkGameOver,
      playSound,
      score,
      gameDifficulty,
      levelBlocksPlaced,
      levelScore,
      levelLinesCleared,
      totalCellSize,
      runBoardFillSweepEffect,
      totalLinesCleared,
      triggerLevelTransition
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
        targetCol >= GRID_SIZE
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
        shapeTop = pointerY - 90 - shapePixelH;
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
    if (isClearing || isSweepActive || isLevelTransitioning || gameOver || shapes[shapeIndex] === null) return;
    e.preventDefault();

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    playSound("grab");

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

      dragRef.current = newDrag;

      const { row, col } = computeTargetFromPointer(
        x,
        y,
        currentDrag.shape,
        currentDrag.isTouch
      );
      const snap = findSnapPosition(currentDrag.shape, row, col);

      const nextHoverRow = snap?.row ?? -1;
      const nextHoverCol = snap?.col ?? -1;

      setDrag(newDrag);
      setHoverRow((prevR) => (prevR !== nextHoverRow ? nextHoverRow : prevR));
      setHoverCol((prevC) => (prevC !== nextHoverCol ? nextHoverCol : prevC));
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
    setGameOverModalShow(false);
    setGameOverFill(false);
    setGameOver(false);

    runOpeningFillSweepEffect(() => {
      const initialGrid = getLevelLayout(1);
      setGrid(initialGrid);
      gridStateRef.current = initialGrid;
      setGameDifficulty(1);
      setClearedCount(0);
      setLevelBlocksPlaced(0);
      setTotalLinesCleared(0);
      setLevelScore(0);
      setLevelLinesCleared(0);
      setShapes(getValidShapes(1, initialGrid, 0));
      setScore(0);
      setDisplayScore(0);
      setCombo(0);
      setCoinsEarned(0);
      setBurst(null);
      setLedParticles([]);
      setComboText(null);
      setIsFiftyPercentFull(false);
      setShowPerfectClear(false);
      maxComboRef.current = 0;
      maxMultiClearRef.current = 0;
      blocksPlacedRef.current = 0;
      localStorage.removeItem(STORAGE_KEY);
      playSound("start");
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
                transform: `translate3d(${((hoverCol + c) * totalCellSize)}px, ${((hoverRow + r) * totalCellSize)}px, 0)`,
                width: cellSize,
                height: cellSize,
                background: THEME_COLORS[bgIndex % THEME_COLORS.length],
                opacity: 0.5,
                boxSizing: "border-box",
                willChange: "transform",
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
          transform: `translate3d(0, ${(r * totalCellSize)}px, 0)`,
          width: GRID_SIZE * totalCellSize - gap,
          height: cellSize,
          borderRadius: 6,
          border: "2.5px solid #00f0ff",
          boxSizing: "border-box",
          pointerEvents: "none",
          animation: "ledRowColGlow 0.4s infinite linear",
          zIndex: 15,
          willChange: "transform",
        }}
      />
    ));

    const colHighlights = willClearCols.map((c) => (
      <div
        key={`clear-col-${c}`}
        style={{
          position: "absolute",
          top: 0,
          transform: `translate3d(${(c * totalCellSize)}px, 0, 0)`,
          width: cellSize,
          height: GRID_SIZE * totalCellSize - gap,
          borderRadius: 6,
          border: "2.5px solid #ff007f",
          boxSizing: "border-box",
          pointerEvents: "none",
          animation: "ledRowColGlow 0.4s infinite linear",
          zIndex: 15,
          willChange: "transform",
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

  const getDragGhostContainerStyle = (): React.CSSProperties => {
    if (!drag) return { display: "none" };

    const shapePixelW = drag.shape.width * totalCellSize - gap;
    const shapePixelH = drag.shape.height * totalCellSize - gap;

    let left: number;
    let top: number;

    if (drag.isTouch) {
      left = drag.pointerX - shapePixelW / 2;
      top = drag.pointerY - 90 - shapePixelH;
    } else {
      left = drag.pointerX - shapePixelW / 2;
      top = drag.pointerY - shapePixelH / 2;
    }

    return {
      position: "fixed",
      left: 0,
      top: 0,
      transform: `translate3d(${left}px, ${top}px, 0)`,
      pointerEvents: "none",
      zIndex: 1000,
      opacity: 0.95,
      willChange: "transform",
    };
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
        transition: "background 0.8s ease-in-out",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .block-3d {
          border-radius: 4px;
          box-sizing: border-box;
          border-top: 2px solid rgba(255, 255, 255, 0.4);
          border-left: 2px solid rgba(255, 255, 255, 0.2);
          border-right: 2px solid rgba(0, 0, 0, 0.2);
          border-bottom: 2px solid rgba(0, 0, 0, 0.3);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bgMatchingGlowPulse {
          0% { border-color: #00d2ff; opacity: 1; }
          50% { border-color: #6a11cb; opacity: 0.85; }
          100% { border-color: #00d2ff; opacity: 1; }
        }
        @keyframes themeLightSeq {
          0% { background-color: #00d2ff; transform: translate(-50%, -50%) scale(1); }
          50% { background-color: #ffe600; transform: translate(-50%, -50%) scale(1.15); }
          100% { background-color: #00d2ff; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes blinkGameOver {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(0.96); }
        }
        @keyframes gameOverAnim {
          0% { transform: scale(0.2) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes perfectGlow {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes lineClearGlow {
          0% { opacity: 1; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes lineClearFlash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes popSquare {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes floatUpScore {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -140px) scale(0.8); }
        }
      `}</style>

      {/* Üst Bar / İstatistikler */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>SEVİYE {gameDifficulty}</span>
          <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>Puan: {levelScore}/2500</span>
        </div>

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
              boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
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

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #f97316 0%, #ea580c 100%)",
              border: "3px solid #381200",
              boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
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

      {/* Oyun Tahtası */}
      <div
        ref={gridRef}
        style={{
          position: "relative",
          width: GRID_SIZE * totalCellSize - gap,
          height: GRID_SIZE * totalCellSize - gap,
          background: "rgba(10, 20, 40, 0.6)",
          borderRadius: 12,
          padding: 0,
          border: isFiftyPercentFull
            ? "3px solid #00d2ff"
            : "2px solid rgba(255,255,255,0.1)",
          animation: isFiftyPercentFull
            ? "bgMatchingGlowPulse 1.5s infinite linear"
            : "none",
          transition: "border 0.3s ease",
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        {isFiftyPercentFull && (
          <div style={{ position: "absolute", inset: -12, pointerEvents: "none", zIndex: 25 }}>
            {Array.from({ length: 12 }).map((_, idx) => {
              let top = "0%";
              let left = "0%";
              if (idx < 4) {
                left = `${(idx / 3) * 100}%`;
                top = "0%";
              } else if (idx < 7) {
                left = "100%";
                top = `${((idx - 3) / 3) * 100}%`;
              } else if (idx < 10) {
                left = `${(1 - (idx - 6) / 3) * 100}%`;
                top = "100%";
              } else {
                left = "0%";
                top = `${(1 - (idx - 9) / 3) * 100}%`;
              }
              return (
                <div
                  key={`theme-bulb-${idx}`}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: 10,
                    height: 10,
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

        {/* Masayı Kaplayan Seviye Geçiş Ekranı Overlay */}
        {isLevelTransitioning && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.96)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 150,
              borderRadius: 12,
              animation: "fadeInOverlay 0.4s ease-out",
            }}
          >
            <h2 style={{ color: "#38bdf8", fontSize: 18, letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
              BÖLÜM TAMAMLANDI!
            </h2>
            <h1 style={{ color: "#facc15", fontSize: 34, marginBottom: 12, fontWeight: 900 }}>
              SEVİYE {gameDifficulty + 1}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Yeni Bulmaca Yükleniyor...</p>
          </div>
        )}

        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isClearingCell = clearingRows.includes(r) || clearingCols.includes(c);
            const isPrefilled = cell === 99;

            return (
              <div
                key={`${r}-${c}`}
                className={cell ? "block-3d" : ""}
                style={{
                  position: "absolute",
                  transform: `translate3d(${(c * totalCellSize)}px, ${(r * totalCellSize)}px, 0)`,
                  width: cellSize,
                  height: cellSize,
                  background: isPrefilled
                    ? "#64748b"
                    : cell
                    ? THEME_COLORS[bgIndex % THEME_COLORS.length]
                    : "rgba(255,255,255,0.05)",
                  border: isPrefilled ? "2px solid #475569" : undefined,
                  borderRadius: cell ? 2 : 4,
                  boxSizing: "border-box",
                  transition: isClearingCell ? "none" : "background 0.3s ease",
                  animation: isClearingCell
                    ? "lineClearGlow 0.15s ease-out forwards"
                    : "none",
                  zIndex: isClearingCell ? 20 : 1,
                  willChange: "transform",
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
              transform: `translate3d(0, ${(r * totalCellSize)}px, 0)`,
              width: GRID_SIZE * totalCellSize - gap,
              height: cellSize,
              borderRadius: 6,
              background: "linear-gradient(90deg, transparent, #ff007f, #ffffff, #00f0ff, transparent)",
              pointerEvents: "none",
              zIndex: 30,
              animation: "lineClearFlash 0.15s ease-out forwards",
              willChange: "opacity",
            }}
          />
        ))}
        {clearingCols.map((c) => (
          <div
            key={`active-clear-col-${c}`}
            style={{
              position: "absolute",
              top: 0,
              transform: `translate3d(${(c * totalCellSize)}px, 0, 0)`,
              width: cellSize,
              height: GRID_SIZE * totalCellSize - gap,
              borderRadius: 6,
              background: "linear-gradient(180deg, transparent, #ff007f, #ffffff, #00f0ff, transparent)",
              pointerEvents: "none",
              zIndex: 30,
              animation: "lineClearFlash 0.15s ease-out forwards",
              willChange: "opacity",
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
              pointerEvents: "none",
              zIndex: 50,
              animation: "floatUpScore 0.75s ease-out forwards",
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
                    animation: `popSquare 0.3s ease ${(i * 0.01)}s forwards`,
                    transform: "scale(0)",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 110,
                fontSize: 42,
                fontWeight: 900,
                color: "#ff4757",
                letterSpacing: 3,
                textAlign: "center",
                whiteSpace: "nowrap",
                animation: "gameOverAnim 0.6s ease forwards",
              }}
            >
              GAME OVER
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
              transform: drag?.shapeIndex === index ? "scale(0.8)" : "scale(1)",
              transition: "transform 0.15s ease, opacity 0.15s ease",
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
                        background: cell ? THEME_COLORS[bgIndex % THEME_COLORS.length] : "transparent",
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sürüklenen Şekil Container */}
      {drag && (
        <div style={getDragGhostContainerStyle()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${drag.shape.width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${drag.shape.height}, ${cellSize}px)`,
              gap,
              transform: "scale(1.15)",
              transformOrigin: drag.isTouch ? "bottom center" : "center",
              transition: "transform 0.1s ease",
            }}
          >
            {drag.shape.cells.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cell ? "block-3d" : ""}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: cell ? THEME_COLORS[bgIndex % THEME_COLORS.length] : "transparent",
                  }}
                />
              ))
            )}
          </div>
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
            }}
          >
            TEKRAR OYNA
          </button>
        </div>
      )}
    </div>
  );
}