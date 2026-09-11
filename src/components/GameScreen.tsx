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

export default function GameScreen({ theme, bestScore, adventureLevel, mode, soundEnabled, vibrationEnabled, onExit, onGameOver }: GameScreenProps) {
  const isAdventure = mode === "adventure";
  // Play start sound on mount
  const startSoundPlayed = useRef(false);
  useEffect(() => {
    if (soundEnabled && !startSoundPlayed.current) {
      startSoundPlayed.current = true;
      const timer = setTimeout(() => playSoundRef.current("start"), 200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // White-noise buffer for crash/break/shatter sounds
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
      // Wooden clack - like a backgammon stone hitting the board
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
      // Short noise click for the "wood" texture
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const nf = ctx.createBiquadFilter();
      nf.type = "bandpass";
      nf.frequency.value = 800;
      nf.Q.value = 2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.08, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.03);
    } else if (type === "clear") {
      // Wooden box drop - short thud + wood crack
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
      // Wood crack noise
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      filter.Q.value = 1.5;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.15, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.1);
    } else if (type === "multi") {
      // Multiple wooden boxes dropping - bigger thud with cascade
      for (let i = 0; i < Math.min(linesCleared, 4); i++) {
        const delay = i * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180 - i * 20, now + delay);
        osc.frequency.exponentialRampToValueAtTime(50 - i * 5, now + delay + 0.1);
        gain.gain.setValueAtTime(0.22, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
        // Wood crack
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000 - i * 100;
        filter.Q.value = 1.2;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.12, now + delay);
        ng.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        noise.connect(filter);
        filter.connect(ng);
        ng.connect(ctx.destination);
        noise.start(now + delay);
        noise.stop(now + delay + 0.08);
      }
    } else if (type === "combo") {
      // Combo - whistle sound that rises in pitch with each combo level
      const baseFreq = 500 + comboLevel * 120;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.6, now + 0.15);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.3);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      // Add a warbling overtone for the whistle character
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFreq * 2, now);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 2.5, now + 0.15);
      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.3);
    } else if (type === "gameover") {
      // Sad descending tones
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
      // Sad voice
      try {
        const utter = new SpeechSynthesisUtterance("Oh no! Game over.");
        utter.lang = "en-US";
        utter.rate = 0.8;
        utter.pitch = 0.7;
        utter.volume = 0.6;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch { /* no speech */ }
    } else if (type === "grab") {
      // Arrow launch sound when a block is lifted
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
      const arrowNoise = ctx.createBufferSource();
      arrowNoise.buffer = getNoiseBuffer(ctx);
      const arrowFilter = ctx.createBiquadFilter();
      arrowFilter.type = "highpass";
      arrowFilter.frequency.value = 1800;
      const arrowGain = ctx.createGain();
      arrowGain.gain.setValueAtTime(0.08, now);
      arrowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      arrowNoise.connect(arrowFilter);
      arrowFilter.connect(arrowGain);
      arrowGain.connect(ctx.destination);
      arrowNoise.start(now);
      arrowNoise.stop(now + 0.14);
    } else if (type === "levelup") {
      // Level up - triumphant fanfare
      const notes = [523, 659, 784, 1047, 784, 1047];
      for (let i = 0; i < notes.length; i++) {
        const delay = i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(notes[i], now + delay);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
      }
    } else if (type === "start") {
      // Game start - bright ascending arpeggio
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
  }, [soundEnabled, getCtx, getNoiseBuffer]);

  const playSoundRef = useRef(playSound);
  useEffect(() => { playSoundRef.current = playSound; }, [playSound]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // Vibration not available
    }
  }, [vibrationEnabled]);
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid);
  const [shapes, setShapes] = useState<(Shape | null)[]>(() => generateThreeShapes(adventureLevel));
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
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [boardDanger, setBoardDanger] = useState(false);
  const [burst, setBurst] = useState<{ row: number; col: number; color: string; intense: boolean } | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [recentClear, setRecentClear] = useState<{ lines: number; combo: number; label: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [bgPhase, setBgPhase] = useState(0);
  const [adventureTasks, setAdventureTasks] = useState(() => {
    if (!isAdventure) return null;
    return [
      { color: "#06b6d4", remaining: 12, label: "Mavi", star: false, colorIndex: 5 },
      { color: "#22c55e", remaining: 16, label: "Yeşil", star: false, colorIndex: 3 },
      { color: "#f97316", remaining: 20, label: "Turuncu", star: false, colorIndex: 1 },
      { color: "#ffd447", remaining: 15, label: "Yıldız", star: true, colorIndex: -1 },
      { color: "#ec4899", remaining: 12, label: "Pembe", star: false, colorIndex: 6 },
    ];
  });
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

  // Lift offset: how far above the finger the shape appears (so finger doesn't cover it)
  const touchLiftOffset = 80;

  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  // Detect board near-full → bright danger warning
  useEffect(() => {
    if (gameOver || isClearing) { setBoardDanger(false); return; }
    let filled = 0;
    for (const row of grid) for (const cell of row) if (cell) filled++;
    const ratio = filled / (GRID_SIZE * GRID_SIZE);
    setBoardDanger(ratio >= 0.6);
  }, [grid, gameOver, isClearing]);

  // Animate score counting
  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.max(1, Math.ceil(Math.abs(diff) / 8));
    const timer = setTimeout(() => {
      setDisplayScore((prev) => prev + (diff > 0 ? step : -step));
    }, 16);
    return () => clearTimeout(timer);
  }, [displayScore, score]);

  // Check game over or level complete
  const checkGameOver = useCallback(
    (currentGrid: number[][], currentShapes: (Shape | null)[], currentScore: number) => {
      // Level complete check
      if (isAdventure && currentScore >= 100 * adventureLevel) {
        setGameOver(true);
        setShowLevelUp(true);
        setShowGameOverTitle(false);
        setShowGameOverButtons(false);
        // Launch fireworks
        const fwColors = ["#ff4757", "#ffd447", "#22c55e", "#06b6d4", "#3b82f6", "#ec4899", "#a855f7"];
        const fw: { id: number; x: number; y: number; color: string }[] = [];
        for (let i = 0; i < 12; i++) {
          fw.push({ id: i, x: 10 + Math.random() * 80, y: 20 + Math.random() * 50, color: fwColors[i % fwColors.length] });
        }
        setFireworks(fw);
        playSound("start");
        playSound("levelup");
        vibrate([50, 30, 50, 30, 100]);
        try {
          const utter = new SpeechSynthesisUtterance("Wonderful! Level complete!");
          utter.lang = "en-US";
          utter.rate = 0.6;
          utter.pitch = 1.2;
          utter.volume = 0.7;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch { /* no speech */ }
        window.setTimeout(() => setShowGameOverTitle(true), 1800);
        window.setTimeout(() => {
          onGameOver(currentScore, coinsEarned, true, { maxCombo: maxComboRef.current, maxMultiClear: maxMultiClearRef.current, blocksPlaced: blocksPlacedRef.current });
        }, 3500);
        return;
      }
      const activeShapes = currentShapes.filter((s): s is Shape => s !== null);
      if (!hasAnyValidMove(currentGrid, activeShapes)) {
        setGameOver(true);
        setShowLevelUp(false);
        setShowGameOverTitle(false);
        setShowGameOverButtons(false);
        window.setTimeout(() => setShowGameOverTitle(true), 1500);
        window.setTimeout(() => setShowGameOverButtons(true), 2300);
        playSound("gameover");
        vibrate([100, 50, 100]);
      }
    },
    [playSound, vibrate, adventureLevel, isAdventure]
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
      setBurst({ row, col, color: shape.color, intense: false });
      window.setTimeout(() => setBurst(null), 520);
      const { newGrid: clearedGrid, linesCleared, clearedRows, clearedCols } =
        clearLines(newGrid);

      const newCombo = linesCleared > 0 ? combo + 1 : 0;
      if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
      if (linesCleared > maxMultiClearRef.current) maxMultiClearRef.current = linesCleared;
      blocksPlacedRef.current += 1;
      // Adventure: decrement task counts based on placed block color
      if (isAdventure && adventureTasks) {
        const placedColorIndex = COLORS.indexOf(shape.color);
        const clearedAny = linesCleared > 0;
        setAdventureTasks((prev) => prev ? prev.map((task) => {
          if (task.remaining <= 0) return task;
          if (task.star && clearedAny) return { ...task, remaining: task.remaining - linesCleared };
          if (!task.star && task.colorIndex === placedColorIndex) {
            return { ...task, remaining: Math.max(0, task.remaining - placedCells) };
          }
          return task;
        }) : prev);
      }
      const { points, coins } = calculateScore(placedCells, linesCleared, newCombo);

      setScore((s) => s + points);
      setCoinsEarned((c) => c + coins);
      setCombo(newCombo);

      if (linesCleared > 0) {
        const comboTexts = ["", "Nice!", "Great!", "Awesome!", "Amazing!", "Incredible!", "Unbelievable!", "Legendary!"];
        const lineLabel = linesCleared > 1 ? `${linesCleared}x Lines!` : "Line Clear!";
        const comboLabel = newCombo > 1 ? ` ${comboTexts[Math.min(newCombo, comboTexts.length - 1)]} Combo x${newCombo}` : "";
        setRecentClear({ lines: linesCleared, combo: newCombo, label: `${lineLabel}${comboLabel}` });
        setShake(true);
        vibrate(newCombo > 1 ? [30, 20, 30, 20, 50] : 50);

        if (linesCleared >= 2) {
          const praises = ["Wonderful!", "Super!", "Excellent!", "Amazing!", "Fantastic!", "Incredible!", "Awesome!"];
          const praise = praises[Math.min(linesCleared - 2 + (newCombo > 1 ? 1 : 0), praises.length - 1)];
          try {
            const utter = new SpeechSynthesisUtterance(praise);
            utter.lang = "en-US";
            utter.rate = 0.78;
            utter.pitch = 1.08;
            utter.volume = 0.6;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
          } catch { /* no speech */ }
        }

        if (linesCleared >= 2) {
          playSound("multi", newCombo, linesCleared);
        } else if (newCombo > 1) {
          playSound("combo", newCombo, linesCleared);
        } else {
          playSound("clear", newCombo, linesCleared);
        }
        setTimeout(() => setShake(false), 350);
        setTimeout(() => setRecentClear(null), 1000);
      } else {
        playSound("place");
        vibrate(15);
      }

      // Shift background every 200 points
      const newTotalScore = score + points;
      setBgPhase(Math.floor(newTotalScore / 200));

      const remainingShapes = shapes.map((s, index) => (index === shapeIndex ? null : s));
      const newShapes = remainingShapes.every((s) => s === null)
        ? generateThreeShapes(adventureLevel)
        : remainingShapes;
      setShapes(newShapes);

      if (clearedRows.length > 0 || clearedCols.length > 0) {
        setBurst({
          row: clearedRows.length > 0 ? clearedRows[Math.floor(clearedRows.length / 2)] : row,
          col: clearedCols.length > 0 ? clearedCols[Math.floor(clearedCols.length / 2)] : col,
          color: shape.color,
          intense: true,
        });
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
        }, 400);
      } else {
        setGrid(newGrid);
        checkGameOver(newGrid, newShapes, newTotalScore);
      }
    },
    [shapes, combo, checkGameOver, isAdventure, adventureTasks]
  );

  // Find the best snap position: the valid placement closest to the pointer's target
  const findSnapPosition = useCallback(
    (shape: Shape, targetRow: number, targetCol: number): { row: number; col: number } | null => {
      const currentGrid = gridStateRef.current;
      if (targetRow < 0 || targetCol < 0 || targetRow >= GRID_SIZE || targetCol >= GRID_SIZE) {
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

  // Compute the target row/col from pointer position
  const computeTargetFromPointer = useCallback(
    (pointerX: number, pointerY: number, shape: Shape, isTouch: boolean) => {
      if (!gridRef.current) return { row: -1, col: -1 };

      const gridRect = gridRef.current.getBoundingClientRect();
      const gridLeft = gridRect.left;
      const gridTop = gridRect.top;

      // For touch: the shape is lifted above the finger, so the shape's top-left
      // is at (pointerX - shapeWidth/2, pointerY - touchLiftOffset)
      // For mouse: shape's top-left is at (pointerX - shapeWidth/2, pointerY - shapeHeight/2)
      const shapePixelW = shape.width * totalCellSize - gap;
      const shapePixelH = shape.height * totalCellSize - gap;

      let shapeLeft: number;
      let shapeTop: number;

      if (isTouch) {
        // Shape is centered horizontally on finger, lifted above
        shapeLeft = pointerX - shapePixelW / 2;
        shapeTop = pointerY - touchLiftOffset - shapePixelH;
      } else {
        // Mouse: shape is centered on cursor
        shapeLeft = pointerX - shapePixelW / 2;
        shapeTop = pointerY - shapePixelH / 2;
      }

      const relX = shapeLeft - gridLeft;
      const relY = shapeTop - gridTop;

      const col = Math.round(relX / totalCellSize);
      const row = Math.round(relY / totalCellSize);

      return { row, col };
    },
    [totalCellSize, gap, touchLiftOffset]
  );

  // Pointer-based drag
  const handlePointerDown = (
    e: React.PointerEvent,
    shapeIndex: number,
    shape: Shape
  ) => {
    if (isClearing || gameOver || shapes[shapeIndex] === null) return;
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

    const { row, col } = computeTargetFromPointer(
      e.clientX,
      e.clientY,
      currentDrag.shape,
      currentDrag.isTouch
    );

    const snap = findSnapPosition(currentDrag.shape, row, col);
    if (snap) {
      handlePlacement(currentDrag.shapeIndex, currentDrag.shape, snap.row, snap.col);
    }
    // If no valid snap position, the shape returns to the tray automatically

    setDrag(null);
    dragRef.current = null;
    setHoverRow(-1);
    setHoverCol(-1);
  };

  const handleRestart = () => {
    setGrid(createEmptyGrid());
    gridStateRef.current = createEmptyGrid();
    setShapes(generateThreeShapes(adventureLevel));
    setScore(0);
    setDisplayScore(0);
    setCombo(0);
    setCoinsEarned(0);
    setGameOver(false);
    setShowGameOverTitle(false);
    setShowGameOverButtons(false);
    setBurst(null);
    setRecentClear(null);
    setBgPhase(0);
    setShowLevelUp(false);
    setFireworks([]);
    setBoardDanger(false);
    maxComboRef.current = 0;
    maxMultiClearRef.current = 0;
    blocksPlacedRef.current = 0;
    if (isAdventure) {
      setAdventureTasks([
        { color: "#06b6d4", remaining: 12, label: "Mavi", star: false, colorIndex: 5 },
        { color: "#22c55e", remaining: 16, label: "Yeşil", star: false, colorIndex: 3 },
        { color: "#f97316", remaining: 20, label: "Turuncu", star: false, colorIndex: 1 },
        { color: "#ffd447", remaining: 15, label: "Yıldız", star: true, colorIndex: -1 },
        { color: "#ec4899", remaining: 12, label: "Pembe", star: false, colorIndex: 6 },
      ]);
    }
    playSound("start");
  };

  // Render preview overlay for snap position
  const renderPreview = () => {
    if (!drag || hoverRow < 0 || hoverCol < 0) return null;
    const cells: React.ReactNode[] = [];
    for (let r = 0; r < drag.shape.height; r++) {
      for (let c = 0; c < drag.shape.width; c++) {
        if (drag.shape.cells[r][c]) {
          cells.push(
            <div
              key={`prev-${r}-${c}`}
              style={{
                position: "absolute",
                left: (hoverCol + c) * totalCellSize,
                top: (hoverRow + r) * totalCellSize,
                width: cellSize,
                height: cellSize,
                background: drag.shape.color,
                opacity: 0.5,
                borderRadius: 6,
                border: "2px solid rgba(255,255,255,0.95)",
                boxSizing: "border-box",
                color: drag.shape.color,
                boxShadow: `0 0 18px ${drag.shape.color}, 0 0 38px ${drag.shape.color}, inset 0 0 12px rgba(255,255,255,0.7)`,
                animation: "previewGlow 0.6s ease-in-out infinite alternate",
              }}
            />
          );
        }
      }
    }

    // Check which rows/cols would be completed by this placement
    const previewGrid = placeShape(gridStateRef.current, drag.shape, hoverRow, hoverCol);
    const wouldClearRows: number[] = [];
    const wouldClearCols: number[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      if (previewGrid[r].every((v) => v !== 0)) wouldClearRows.push(r);
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      if (previewGrid.every((row) => row[c] !== 0)) wouldClearCols.push(c);
    }

    // Add illumination bars for rows/cols that would clear
    wouldClearRows.forEach((r) => {
      cells.push(
        <div
          key={`prev-row-${r}`}
          className="clearBeam clearBeamHorizontal previewBeam"
          style={{ top: (r + 0.5) * totalCellSize }}
        />
      );
    });
    wouldClearCols.forEach((c) => {
      cells.push(
        <div
          key={`prev-col-${c}`}
          className="clearBeam clearBeamVertical previewBeam"
          style={{ left: (c + 0.5) * totalCellSize }}
        />
      );
    });

    return <>{cells}</>;
  };

  // Compute drag ghost position
  const getDragGhostStyle = (): React.CSSProperties => {
    if (!drag) return { display: "none" };

    const shapePixelW = drag.shape.width * totalCellSize - gap;
    const shapePixelH = drag.shape.height * totalCellSize - gap;

    let left: number;
    let top: number;

    if (drag.isTouch) {
      // Centered on finger horizontally, lifted above finger
      left = drag.pointerX - shapePixelW / 2;
      top = drag.pointerY - touchLiftOffset - shapePixelH;
    } else {
      // Mouse: centered on cursor
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

  // Show valid placement indicator when not dragging
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
        background: isAdventure
          ? `linear-gradient(180deg, #263f71 0%, #344e82 48%, #21375f 100%)`
          : `linear-gradient(180deg, hsl(${220 + bgPhase * 3 % 360}, 40%, ${32 + Math.min(bgPhase * 0.3, 8)}%), hsl(220, 38%, 22%))`,
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        transition: "background 0.8s ease",
        animation: shake ? "shake 0.35s ease" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 22px 12px",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={onExit}
          aria-label="Menüye dön"
          style={{ background: "transparent", border: "none", color: "#d7efff", fontSize: 38, lineHeight: 1, cursor: "pointer", padding: 0 }}
        >
          ‹
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: theme.headerBg,
            borderRadius: 12,
            padding: "6px 16px",
            fontWeight: 900,
            fontSize: 16,
            fontFamily: "'Fredoka', sans-serif",
            color: theme.accent,
            boxShadow: `0 2px 12px ${theme.accent}33`,
          }}>
            {isAdventure ? `Serüven ${adventureLevel}` : `Bölüm ${adventureLevel}`}
          </div>
          <div style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "6px 14px",
            fontWeight: 800,
            fontSize: 15,
            color: theme.textColor,
          }}>
            🪙 {coinsEarned}
          </div>
        </div>
        <button
          onClick={onExit}
          aria-label="Ayarlar"
          style={{ background: "transparent", border: "none", color: "#d7efff", fontSize: 25, cursor: "pointer", padding: 0 }}
        >
          ⚙
        </button>
      </div>

      {isAdventure && adventureTasks && (
        <div style={{ width: "100%", maxWidth: 460, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7, margin: "0 auto 12px", padding: "8px 10px", boxSizing: "border-box", background: "rgba(7,14,42,0.78)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
          {adventureTasks.map((task) => (
            <div key={task.label} style={{ textAlign: "center", color: "#fff", opacity: task.remaining <= 0 ? 0.35 : 1 }}>
              <div style={{ width: 18, height: 18, margin: "0 auto 2px", background: task.color, clipPath: task.star ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 100%, 50% 73%, 21% 100%, 32% 57%, 2% 35%, 39% 35%)" : "polygon(50% 0%, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)", filter: `drop-shadow(0 0 4px ${task.color})` }} />
              <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{task.remaining}</div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>{task.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 52, lineHeight: 1, fontWeight: 900, color: "#fff", textShadow: "0 3px 0 rgba(23,34,73,0.45), 0 0 18px rgba(255,255,255,0.35)", margin: "4px 0 16px", textAlign: "center" }}>{displayScore}</div>

      {/* Combo indicator - overlay so it doesn't shift the grid */}
      {recentClear && (
        <div
          style={{
            position: "fixed",
            top: "32%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: recentClear.combo > 1
              ? "linear-gradient(135deg, #ff6b35, #ffbd20, #26d85a)"
              : theme.accent,
            color: "#fff",
            borderRadius: 24,
            padding: recentClear.combo > 1 ? "16px 36px" : "10px 28px",
            fontWeight: 900,
            fontSize: recentClear.combo > 1 ? 28 : 20,
            fontFamily: "'Fredoka', sans-serif",
            animation: "comboPop 0.3s ease",
            boxShadow: recentClear.combo > 1
              ? "0 6px 30px rgba(255,107,53,0.7), 0 0 60px rgba(255,189,32,0.4)"
              : `0 4px 24px ${theme.accent}88`,
            zIndex: 1500,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0,0,0,0.4)",
            letterSpacing: recentClear.combo > 1 ? 1 : 0,
          }}
        >
          {recentClear.label}
        </div>
      )}

      {/* Game grid */}
      <div
        ref={gridRef}
        className={boardDanger ? "dangerGrid" : undefined}
        style={{
          position: "relative",
          background: theme.gridBg,
          borderRadius: 16,
          padding: gap,
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gap,
          boxShadow: "0 10px 28px rgba(12,20,55,0.42)",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isClearing =
              clearingRows.includes(r) || clearingCols.includes(c);
            const isHover =
              hoverRow >= 0 &&
              hoverCol >= 0 &&
              drag &&
              r >= hoverRow &&
              r < hoverRow + drag.shape.height &&
              c >= hoverCol &&
              c < hoverCol + drag.shape.width &&
              drag.shape.cells[r - hoverRow]?.[c - hoverCol];

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                            background: cell
                    ? isClearing
                      ? "#ffffff"
                      : `linear-gradient(135deg, rgba(255,255,255,0.42) 0%, ${COLORS[cell - 1] || COLORS[0]} 25%, ${COLORS[cell - 1] || COLORS[0]} 70%, rgba(0,0,0,0.3) 100%)`
                    : isHover
                      ? theme.accent + "33"
                      : theme.cellEmpty,
                  borderRadius: 3,
                  transition: isClearing
                    ? "none"
                    : "background 0.1s ease",
                  transform: isClearing ? "scale(0.5) translateY(-30px)" : "scale(1)",
                  opacity: isClearing ? 0 : 1,
                  filter: cell && !isClearing ? "saturate(1.35) brightness(1.12)" : undefined,
                  animation: gameOver && cell ? "gameOverCellRise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards" : isClearing ? "cellClearGlow 0.4s ease forwards" : undefined,
                  animationDelay: gameOver && cell ? `${(r * GRID_SIZE + c) * 18}ms` : undefined,
                  boxShadow: cell && !isClearing
                    ? `inset 0 -5px 0 rgba(0,0,0,0.32), inset 0 3px 0 rgba(255,255,255,0.48), inset -3px 0 0 rgba(0,0,0,0.18), inset 3px 0 0 rgba(255,255,255,0.26), 0 0 10px ${COLORS[(cell || 1) - 1] || "#fff"}88, 0 0 20px ${COLORS[(cell || 1) - 1] || "#fff"}44`
                    : isClearing
                      ? `0 0 30px #fff, 0 0 60px ${COLORS[(cell || 1) - 1] || "#fff"}, 0 0 80px ${COLORS[(cell || 1) - 1] || "#fff"}aa, inset 0 0 20px #fff`
                      : "none",
                }}
              />
            );
          })
        )}
        {clearingRows.map((clearingRow) => (
          <div key={`row-beam-${clearingRow}`} className="clearBeam clearBeamHorizontal" style={{ top: (clearingRow + 0.5) * totalCellSize }} />
        ))}
        {clearingCols.map((clearingCol) => (
          <div key={`col-beam-${clearingCol}`} className="clearBeam clearBeamVertical" style={{ left: (clearingCol + 0.5) * totalCellSize }} />
        ))}
        {clearingRows.map((clearingRow) =>
          Array.from({ length: GRID_SIZE }, (_, ci) => (
            <div
              key={`burst-r-${clearingRow}-${ci}`}
              className={burst?.intense ? "burst burstIntense" : "burst"}
              style={{ left: (ci + 0.5) * totalCellSize, top: (clearingRow + 0.5) * totalCellSize, color: burst?.color || "#fff" }}
            >
              <span className="burstCore" />
              {Array.from({ length: 6 }, (_, ri) => (
                <span key={`p-${ri}`} className="burstParticle" style={{ "--pf": `rotate(${ri * 60}deg) translateY(-${30 + (ri % 3) * 10}px)` } as React.CSSProperties} />
              ))}
            </div>
          ))
        )}
        {clearingCols.map((clearingCol) =>
          Array.from({ length: GRID_SIZE }, (_, ri) => {
            if (clearingRows.includes(ri)) return null;
            return (
              <div
                key={`burst-c-${clearingCol}-${ri}`}
                className={burst?.intense ? "burst burstIntense" : "burst"}
                style={{ left: (clearingCol + 0.5) * totalCellSize, top: (ri + 0.5) * totalCellSize, color: burst?.color || "#fff" }}
              >
                <span className="burstCore" />
                {Array.from({ length: 6 }, (_, pi) => (
                  <span key={`pc-${pi}`} className="burstParticle" style={{ "--pf": `rotate(${pi * 60}deg) translateY(-${30 + (pi % 3) * 10}px)` } as React.CSSProperties} />
                ))}
              </div>
            );
          })
        )}
        {burst && !clearingRows.length && !clearingCols.length && (
          <div
            className={burst.intense ? "burst burstIntense" : "burst"}
            style={{
              left: (burst.col + 0.5) * totalCellSize,
              top: (burst.row + 0.5) * totalCellSize,
              color: burst.color,
            }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <span key={`ray-${index}`} className="burstRay" style={{ "--rot": `${index * 45}deg` } as React.CSSProperties} />
            ))}
            {Array.from({ length: 12 }, (_, index) => (
              <span key={`particle-${index}`} className="burstParticle" style={{ "--pf": `rotate(${index * 30}deg) translateY(-${burst.intense ? 48 + (index % 3) * 12 : 28 + (index % 3) * 7}px)` } as React.CSSProperties} />
            ))}
            <span className="burstCore" />
          </div>
        )}
        {renderPreview()}
      </div>

      {/* Shapes tray */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 24,
          padding: "16px 20px",
          background: theme.headerBg,
          borderRadius: 16,
          width: "100%",
          maxWidth: 460,
          justifyContent: "center",
          alignItems: "center",
          minHeight: 100,
        }}
      >
        {shapes.map((shape, i) => (
          <div
            key={i}
            onPointerDown={
              shape && !drag && !isClearing && !gameOver
                ? (e) => handlePointerDown(e, i, shape)
                : undefined
            }
            style={{
              cursor: shape && !drag ? "grab" : "default",
              opacity: !shape || (drag && drag.shapeIndex === i) ? 0.15 : 1,
              padding: 10,
              borderRadius: 12,
              background: shape && !drag ? "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))" : "transparent",
              border: shape && !drag ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
              boxShadow: "none",
              transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
              transform: shape && !drag ? "scale(1) translateY(0)" : "scale(0.9) translateY(3px)",
              minWidth: shape ? undefined : (cellSize - 8) * 3 + 12,
              minHeight: shape ? undefined : (cellSize - 8) * 3 + 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shape && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${shape.width}, ${cellSize - 8}px)`,
                  gridTemplateRows: `repeat(${shape.height}, ${cellSize - 8}px)`,
                  gap: 1,
                }}
              >
                {shape.cells.map((row, r) =>
                  row.map((filled, c) => (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        width: cellSize - 8,
                        height: cellSize - 8,
                        background: filled
                      ? `linear-gradient(135deg, rgba(255,255,255,0.42) 0%, ${shape.color} 25%, ${shape.color} 70%, rgba(0,0,0,0.3) 100%)`
                      : "transparent",
                        borderRadius: 3,
                        boxShadow: filled
                          ? `inset 0 -4px 0 rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.2), inset -3px 0 0 rgba(0,0,0,0.12), inset 3px 0 0 rgba(255,255,255,0.08)`
                          : "none",
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dragging shape ghost */}
      {drag && (
        <div style={getDragGhostStyle()}>
          {drag.shape.cells.map((row, r) =>
            row.map((filled, c) => (
              <div
                key={`drag-${r}-${c}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: filled ? drag.shape.color : "transparent",
                  borderRadius: 3,
                  boxShadow: filled
                    ? `inset 0 -4px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.25), inset -3px 0 0 rgba(0,0,0,0.15), inset 3px 0 0 rgba(255,255,255,0.1)`
                    : "none",
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: showGameOverTitle ? "rgba(0,0,0,0.72)" : "transparent",
            pointerEvents: showGameOverTitle ? "auto" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            animation: "fadeIn 0.3s ease",
            overflow: "hidden",
          }}
        >
          {/* Fireworks */}
          {fireworks.map((fw) => (
            <div key={fw.id} className="firework" style={{ left: `${fw.x}%`, top: `${fw.y}%`, "--fw-color": fw.color } as React.CSSProperties}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="fireworkParticle" style={{ "--fw-rot": `${i * 30}deg`, "--fw-color": fw.color } as React.CSSProperties} />
              ))}
            </div>
          ))}
          <div
            style={{
              background: theme.headerBg,
              borderRadius: 24,
              padding: "40px 48px",
              textAlign: "center",
              maxWidth: 360,
              width: "90%",
              boxShadow: showGameOverTitle ? `0 20px 60px rgba(0,0,0,0.5)` : "none",
              opacity: showGameOverTitle ? 1 : 0,
              transform: showGameOverTitle ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
              transition: "opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {showGameOverTitle ? (
              <>
                {showLevelUp ? (
                  <>
                    <div style={{ fontSize: 64, marginBottom: 8, animation: "comboPop 0.5s ease" }}>🎆</div>
                    <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px 0", color: "#ffd447", animation: "comboPop 0.3s ease", textAlign: "center" }}>
                      KAZANDINIZ!
                    </h2>
                    <div style={{ fontSize: 18, opacity: 0.8, marginBottom: 20, textAlign: "center" }}>
                      Serüven {adventureLevel} tamamlandı!
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", margin: "4px 0 16px" }}>
                      <div style={{ fontSize: 16, lineHeight: 1.2, opacity: 0.7, marginBottom: 6, textAlign: "center" }}>Skorun</div>
                      <div style={{ fontSize: 56, lineHeight: 1, fontWeight: 900, fontFamily: "'Fredoka', sans-serif", color: theme.textColor, textAlign: "center" }}>
                        {score}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, marginBottom: 28, fontWeight: 700, textAlign: "center" }}>
                      🪙 {coinsEarned} coin kazandın!
                    </div>
                    <div style={{ fontSize: 16, opacity: 0.6, fontWeight: 700, textAlign: "center" }}>
                      Sonraki serüvene geçiliyor...
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px 0", color: theme.accent, animation: "comboPop 0.3s ease", textAlign: "center" }}>
                      Oyun Bitti!
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", margin: "4px 0 20px" }}>
                      <div style={{ fontSize: 14, lineHeight: 1.2, opacity: 0.6, marginBottom: 6, textAlign: "center" }}>Skorun</div>
                      <div style={{ fontSize: 48, lineHeight: 1, fontWeight: 900, fontFamily: "'Fredoka', sans-serif", color: theme.textColor, textAlign: "center" }}>
                        {score}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, marginBottom: 28, fontWeight: 700, textAlign: "center" }}>
                      🪙 {coinsEarned} coin kazandın!
                    </div>
                    {showGameOverButtons ? (
                      <div style={{ display: "flex", gap: 12, flexDirection: "column", animation: "fadeIn 0.4s ease" }}>
                        <button onClick={handleRestart} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 18, fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}>
                          Tekrar Oyna
                        </button>
                        <button onClick={() => onGameOver(score, coinsEarned, false, { maxCombo: maxComboRef.current, maxMultiClear: maxMultiClearRef.current, blocksPlaced: blocksPlacedRef.current })} style={{ background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 14, padding: "12px 32px", fontSize: 16, fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "background 0.2s" }}>
                          Menüye Dön
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, opacity: 0.5, fontWeight: 700 }}>...</div>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
