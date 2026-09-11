export type Shape = {
    cells: boolean[][];
    color: string;
    width: number;
    height: number;
  };
  
  export const COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#ec4899", // pink
    "#a855f7", // purple
  ];
  
  export const GRID_SIZE = 8;
  
  export type ShapeFamily =
    | "dot"
    | "bar"
    | "square"
    | "rect"
    | "corner"
    | "L"
    | "T"
    | "S"
    | "plus"
    | "U";
  
  export type ShapeSizeClass = "tiny" | "small" | "medium" | "large";
  
  export type ShapeDef = {
    cells: number[][];
    family: ShapeFamily;
  };
  
  export const SHAPE_DEFS: ShapeDef[] = [
    // 1x1
    { family: "dot", cells: [[1]] },
    // Straight bars
    { family: "bar", cells: [[1, 1]] },
    { family: "bar", cells: [[1], [1]] },
    { family: "bar", cells: [[1, 1, 1]] },
    { family: "bar", cells: [[1], [1], [1]] },
    { family: "bar", cells: [[1, 1, 1, 1]] },
    { family: "bar", cells: [[1], [1], [1], [1]] },
    { family: "bar", cells: [[1, 1, 1, 1, 1]] },
    { family: "bar", cells: [[1], [1], [1], [1], [1]] },
    // Squares
    { family: "square", cells: [[1, 1], [1, 1]] },
    { family: "square", cells: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
    // Rectangles
    { family: "rect", cells: [[1, 1, 1], [1, 1, 1]] },
    { family: "rect", cells: [[1, 1], [1, 1], [1, 1]] },
    // Small L / corner (3 cells)
    { family: "corner", cells: [[1, 0], [1, 1]] },
    { family: "corner", cells: [[1, 1], [1, 0]] },
    { family: "corner", cells: [[1, 1], [0, 1]] },
    { family: "corner", cells: [[0, 1], [1, 1]] },
    // L / J (4 cells)
    { family: "L", cells: [[1, 0], [1, 0], [1, 1]] },
    { family: "L", cells: [[1, 1, 1], [1, 0, 0]] },
    { family: "L", cells: [[1, 1], [0, 1], [0, 1]] },
    { family: "L", cells: [[0, 0, 1], [1, 1, 1]] },
    { family: "L", cells: [[0, 1], [0, 1], [1, 1]] },
    { family: "L", cells: [[1, 0, 0], [1, 1, 1]] },
    { family: "L", cells: [[1, 1], [1, 0], [1, 0]] },
    { family: "L", cells: [[1, 1, 1], [0, 0, 1]] },
    // Big L (5 cells)
    { family: "L", cells: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { family: "L", cells: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { family: "L", cells: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
    { family: "L", cells: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
    // T-shapes
    { family: "T", cells: [[1, 1, 1], [0, 1, 0]] },
    { family: "T", cells: [[1, 0], [1, 1], [1, 0]] },
    { family: "T", cells: [[0, 1, 0], [1, 1, 1]] },
    { family: "T", cells: [[0, 1], [1, 1], [0, 1]] },
    // S / Z
    { family: "S", cells: [[0, 1, 1], [1, 1, 0]] },
    { family: "S", cells: [[1, 0], [1, 1], [0, 1]] },
    { family: "S", cells: [[1, 1, 0], [0, 1, 1]] },
    { family: "S", cells: [[0, 1], [1, 1], [1, 0]] },
    // Plus
    { family: "plus", cells: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
  ];
  
  export function createEmptyGrid(): number[][] {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => 0)
    );
  }
  
  function shapeFromDef(def: ShapeDef, color: string): Shape {
    const cells = def.cells.map((row) => row.map((v) => v === 1));
    return {
      cells,
      color,
      width: cells[0].length,
      height: cells.length,
    };
  }
  
  function countCells(def: ShapeDef): number {
    let n = 0;
    for (const row of def.cells) {
      for (const v of row) if (v === 1) n += 1;
    }
    return n;
  }
  
  function sizeClassOf(def: ShapeDef): ShapeSizeClass {
    const n = countCells(def);
    if (n <= 2) return "tiny";
    if (n === 3) return "small";
    if (n === 4) return "medium";
    return "large";
  }
  
  function randomColor(): string {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  
  function countEmptyCells(grid: number[][]): number {
    let empty = 0;
    for (const row of grid) {
      for (const v of row) if (v === 0) empty += 1;
    }
    return empty;
  }
  
  function occupancyOf(grid: number[][]): number {
    return 1 - countEmptyCells(grid) / (GRID_SIZE * GRID_SIZE);
  }
  
  function pickWeighted<T>(items: T[], weightFn: (item: T) => number): T {
    let total = 0;
    const weights = items.map((item) => {
      const w = Math.max(0, weightFn(item));
      total += w;
      return w;
    });
    if (total <= 0) {
      return items[Math.floor(Math.random() * items.length)];
    }
    let roll = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  
  function sizeClassWeights(
    occupancy: number,
    level: number
  ): Record<ShapeSizeClass, number> {
    const tightness = Math.min(1, Math.max(0, occupancy));
    const levelBoost = Math.min(0.12, Math.max(0, level - 1) * 0.015);
    return {
      tiny: 0.1 + tightness * 0.42,
      small: 0.22 + tightness * 0.18,
      medium: 0.38 - tightness * 0.22,
      large: Math.max(0.04, 0.3 - tightness * 0.38 + levelBoost),
    };
  }
  
  function defWeight(
    def: ShapeDef,
    occupancy: number,
    level: number,
    usedFamilies: Set<ShapeFamily>,
    usedSizeClasses: ShapeSizeClass[],
    prevDef?: ShapeDef
  ): number {
    const cls = sizeClassOf(def);
    let w = sizeClassWeights(occupancy, level)[cls];
    if (usedFamilies.has(def.family)) w *= 0.28;
    const sameSizeCount = usedSizeClasses.filter((s) => s === cls).length;
    if (sameSizeCount >= 1) w *= 0.45;
    if (sameSizeCount >= 2) w *= 0.2;
    if (cls === "large" && usedSizeClasses.includes("large")) w *= 0.12;
  
    // Sonraki şeklin öndekini tamamlaması/dengelemesi için uyum kuralı
    if (prevDef) {
      const prevCells = countCells(prevDef);
      const currCells = countCells(def);
      // Önceki şekil büyükse, sonrakini tamamlaması için küçük/orta boyları destekle
      if (prevCells >= 4 && currCells <= 3) {
        w *= 1.8;
      } else if (prevCells <= 2 && currCells >= 4) {
        w *= 1.8;
      }
    }
  
    return w;
  }
  
  export function getPlaceableDefs(grid: number[][]): ShapeDef[] {
    return SHAPE_DEFS.filter((def) =>
      canPlaceAnywhere(grid, shapeFromDef(def, COLORS[0]))
    );
  }
  
  export function randomShape(
    level: number = 1,
    grid: number[][] = createEmptyGrid()
  ): Shape {
    const def = pickShapeDef(grid, level, new Set(), [], undefined);
    return shapeFromDef(def, randomColor());
  }
  
  function pickShapeDef(
    grid: number[][],
    level: number,
    usedFamilies: Set<ShapeFamily>,
    usedSizeClasses: ShapeSizeClass[],
    prevDef?: ShapeDef
  ): ShapeDef {
    const occupancy = occupancyOf(grid);
    const placeable = getPlaceableDefs(grid);
    const pool = placeable.length > 0 ? placeable : SHAPE_DEFS.filter((d) => d.family === "dot");
    return pickWeighted(pool, (def) =>
      defWeight(def, occupancy, level, usedFamilies, usedSizeClasses, prevDef)
    );
  }
  
  function ensureLifeline(
    defs: ShapeDef[],
    grid: number[][],
    level: number
  ): ShapeDef[] {
    const occupancy = occupancyOf(grid);
    if (occupancy < 0.38) return defs;
    const hasSmall = defs.some((d) => countCells(d) <= 3);
    if (hasSmall) return defs;
    const placeable = getPlaceableDefs(grid).filter((d) => countCells(d) <= 3);
    if (placeable.length === 0) return defs;
    const next = [...defs];
    next[next.length - 1] = pickWeighted(placeable, (def) =>
      defWeight(def, occupancy, level, new Set(), [], defs[defs.length - 2])
    );
    return next;
  }
  
  export function generateThreeShapes(
    level: number = 1,
    grid: number[][] = createEmptyGrid()
  ): Shape[] {
    const usedFamilies = new Set<ShapeFamily>();
    const usedSizeClasses: ShapeSizeClass[] = [];
    const defs: ShapeDef[] = [];
  
    for (let i = 0; i < 3; i++) {
      const prevDef = i > 0 ? defs[i - 1] : undefined;
      const def = pickShapeDef(grid, level, usedFamilies, usedSizeClasses, prevDef);
      defs.push(def);
      usedFamilies.add(def.family);
      usedSizeClasses.push(sizeClassOf(def));
    }
  
    return ensureLifeline(defs, grid, level).map((def) =>
      shapeFromDef(def, randomColor())
    );
  }
  
  export function canPlaceShape(
    grid: number[][],
    shape: Shape,
    row: number,
    col: number
  ): boolean {
    if (row < 0 || col < 0) return false;
    if (row + shape.height > GRID_SIZE) return false;
    if (col + shape.width > GRID_SIZE) return false;
    for (let r = 0; r < shape.height; r++) {
      for (let c = 0; c < shape.width; c++) {
        if (shape.cells[r][c] && grid[row + r][col + c] !== 0) {
          return false;
        }
      }
    }
    return true;
  }
  
  export function placeShape(
    grid: number[][],
    shape: Shape,
    row: number,
    col: number
  ): number[][] {
    const newGrid = grid.map((r) => [...r]);
    const colorValue = COLORS.indexOf(shape.color) + 1;
    for (let r = 0; r < shape.height; r++) {
      for (let c = 0; c < shape.width; c++) {
        if (shape.cells[r][c]) {
          newGrid[row + r][col + c] = colorValue;
        }
      }
    }
    return newGrid;
  }
  
  export function clearLines(grid: number[][]): {
    newGrid: number[][];
    linesCleared: number;
    clearedRows: number[];
    clearedCols: number[];
  } {
    const newGrid = grid.map((r) => [...r]);
    const clearedRows: number[] = [];
    const clearedCols: number[] = [];
  
    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every((v) => v !== 0)) {
        clearedRows.push(r);
      }
    }
  
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid.every((row) => row[c] !== 0)) {
        clearedCols.push(c);
      }
    }
  
    for (const r of clearedRows) {
      for (let c = 0; c < GRID_SIZE; c++) {
        newGrid[r][c] = 0;
      }
    }
  
    for (const c of clearedCols) {
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r][c] = 0;
      }
    }
  
    const linesCleared = clearedRows.length + clearedCols.length;
    return { newGrid, linesCleared, clearedRows, clearedCols };
  }
  
  export function canPlaceAnywhere(grid: number[][], shape: Shape): boolean {
    for (let r = 0; r <= GRID_SIZE - shape.height; r++) {
      for (let c = 0; c <= GRID_SIZE - shape.width; c++) {
        if (canPlaceShape(grid, shape, r, c)) {
          return true;
        }
      }
    }
    return false;
  }
  
  export function hasAnyValidMove(grid: number[][], shapes: Shape[]): boolean {
    return shapes.some((s) => s !== null && canPlaceAnywhere(grid, s));
  }
  
  export function calculateScore(
    placedCells: number,
    linesCleared: number,
    combo: number
  ): { points: number; coins: number } {
    let points = placedCells;
    if (linesCleared > 0) {
      points += linesCleared * 10 * GRID_SIZE;
      if (linesCleared >= 2) {
        points += (linesCleared - 1) * 20 * GRID_SIZE;
      }
      if (combo > 1) {
        points += combo * 15;
      }
    }
    const coins = Math.floor(points / 10);
    return { points, coins };
  }