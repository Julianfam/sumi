/** Bitmask Sudoku: generate unique puzzles, validate, hint. */

const SIZE = 9;
const BOX = 3;
const ALL = 0b1111111110; // bits 1..9

function shuffled<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function boxIndex(r: number, c: number): number {
  return ((r / BOX) | 0) * BOX + ((c / BOX) | 0);
}

function bit(d: number): number {
  return 1 << d;
}

export function emptyGrid(): number[] {
  return new Array<number>(81).fill(0);
}

export function cloneGrid(grid: number[]): number[] {
  return grid.slice();
}

export function cellIndex(r: number, c: number): number {
  return r * SIZE + c;
}

export function rowOf(i: number): number {
  return (i / SIZE) | 0;
}

export function colOf(i: number): number {
  return i % SIZE;
}

/** Mask of digits already used in the cell's row, column and box. */
export function usedMask(grid: number[], i: number): number {
  const r = rowOf(i);
  const c = colOf(i);
  let used = 0;
  for (let k = 0; k < SIZE; k++) {
    used |= bit(grid[r * SIZE + k]!);
    used |= bit(grid[k * SIZE + c]!);
  }
  const br = ((r / BOX) | 0) * BOX;
  const bc = ((c / BOX) | 0) * BOX;
  for (let dr = 0; dr < BOX; dr++) {
    for (let dc = 0; dc < BOX; dc++) {
      used |= bit(grid[(br + dr) * SIZE + (bc + dc)]!);
    }
  }
  used &= ~1; // ignore 0
  return used;
}

export function candidates(grid: number[], i: number): number[] {
  if (grid[i]) return [];
  const used = usedMask(grid, i);
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if ((used & bit(d)) === 0) out.push(d);
  return out;
}

export function candidateMask(grid: number[], i: number): number {
  if (grid[i]) return 0;
  return ALL & ~usedMask(grid, i);
}

function findMrv(grid: number[]): number {
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    const mask = candidateMask(grid, i);
    const count = bitCount(mask);
    if (count === 0) return i;
    if (count < bestCount) {
      bestCount = count;
      best = i;
      if (count === 1) return i;
    }
  }
  return best;
}

function bitCount(n: number): number {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

function firstBit(mask: number): number {
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) return d;
  return 0;
}

type Counters = { rows: Uint16Array; cols: Uint16Array; boxes: Uint16Array };

function buildCounters(grid: number[]): Counters {
  const rows = new Uint16Array(9);
  const cols = new Uint16Array(9);
  const boxes = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const d = grid[i]!;
    if (!d) continue;
    const b = bit(d);
    const r = rowOf(i);
    const c = colOf(i);
    rows[r]! |= b;
    cols[c]! |= b;
    boxes[boxIndex(r, c)]! |= b;
  }
  return { rows, cols, boxes };
}

function solveCount(grid: number[], limit: number): number {
  const g = grid.slice();
  const { rows, cols, boxes } = buildCounters(g);
  let found = 0;

  const rec = (): boolean => {
    if (found >= limit) return true;
    const i = findMrv(g);
    if (i < 0) {
      found++;
      return found >= limit;
    }
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxIndex(r, c);
    let mask = ALL & ~(rows[r]! | cols[c]! | boxes[b]!);
    while (mask) {
      const d = firstBit(mask);
      const bt = bit(d);
      mask &= ~bt;
      g[i] = d;
      rows[r]! |= bt;
      cols[c]! |= bt;
      boxes[b]! |= bt;
      if (rec()) return true;
      g[i] = 0;
      rows[r]! &= ~bt;
      cols[c]! &= ~bt;
      boxes[b]! &= ~bt;
    }
    return false;
  };

  rec();
  return found;
}

export function countSolutions(grid: number[], limit = 2): number {
  return solveCount(grid, limit);
}

export function solve(grid: number[]): number[] | null {
  const g = grid.slice();
  const { rows, cols, boxes } = buildCounters(g);

  const rec = (): boolean => {
    const i = findMrv(g);
    if (i < 0) return true;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxIndex(r, c);
    const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const allowed = ALL & ~(rows[r]! | cols[c]! | boxes[b]!);
    for (const d of digits) {
      const bt = bit(d);
      if ((allowed & bt) === 0) continue;
      g[i] = d;
      rows[r]! |= bt;
      cols[c]! |= bt;
      boxes[b]! |= bt;
      if (rec()) return true;
      g[i] = 0;
      rows[r]! &= ~bt;
      cols[c]! &= ~bt;
      boxes[b]! &= ~bt;
    }
    return false;
  };

  return rec() ? g : null;
}

function fillBox(grid: number[], br: number, bc: number): void {
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let k = 0;
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      grid[(br + r) * SIZE + (bc + c)] = digits[k++]!;
    }
  }
}

export function generateComplete(): number[] {
  const grid = emptyGrid();
  fillBox(grid, 0, 0);
  fillBox(grid, 3, 3);
  fillBox(grid, 6, 6);
  const solved = solve(grid);
  if (!solved) return generateComplete();
  return solved;
}

export function clueCount(grid: number[]): number {
  let n = 0;
  for (let i = 0; i < 81; i++) if (grid[i]) n++;
  return n;
}

export function digHoles(complete: number[], targetClues: number): number[] {
  const puzzle = complete.slice();
  let clues = 81;

  for (let pass = 0; pass < 3 && clues > targetClues; pass++) {
    const order = shuffled(
      [...Array(81).keys()].filter((i) => puzzle[i] !== 0),
    );
    for (const i of order) {
      if (clues <= targetClues) break;
      const saved = puzzle[i]!;
      puzzle[i] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[i] = saved;
      } else {
        clues--;
      }
    }
  }
  return puzzle;
}

export type Puzzle = {
  puzzle: number[];
  solution: number[];
};

export function generatePuzzle(targetClues: number): Puzzle {
  let bestPuzzle: number[] | null = null;
  let bestSolution: number[] = [];
  let bestClues = 81;
  const attempts = targetClues <= 26 ? 5 : 2;
  for (let n = 0; n < attempts; n++) {
    const solution = generateComplete();
    const puzzle = digHoles(solution, targetClues);
    const clues = clueCount(puzzle);
    if (clues < bestClues) {
      bestPuzzle = puzzle;
      bestSolution = solution;
      bestClues = clues;
      if (clues <= targetClues) break;
    }
  }
  return { puzzle: bestPuzzle!, solution: bestSolution };
}

export function isComplete(values: number[]): boolean {
  for (let i = 0; i < 81; i++) if (!values[i]) return false;
  return true;
}

export function matchesSolution(values: number[], solution: number[]): boolean {
  for (let i = 0; i < 81; i++) if (values[i] !== solution[i]) return false;
  return true;
}

/** Cells that break Sudoku (duplicate in row/col/box). */
export function conflictSet(values: number[]): Set<number> {
  const bad = new Set<number>();

  const markDupes = (indices: number[]) => {
    const seen = new Map<number, number>();
    for (const i of indices) {
      const v = values[i]!;
      if (!v) continue;
      const prev = seen.get(v);
      if (prev !== undefined) {
        bad.add(prev);
        bad.add(i);
      } else {
        seen.set(v, i);
      }
    }
  };

  for (let r = 0; r < 9; r++) {
    markDupes(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }
  for (let c = 0; c < 9; c++) {
    markDupes(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const idx: number[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) idx.push((br + r) * 9 + bc + c);
      }
      markDupes(idx);
    }
  }
  return bad;
}

export function peerIndices(i: number): number[] {
  const r = rowOf(i);
  const c = colOf(i);
  const seen = new Set<number>();
  for (let k = 0; k < 9; k++) {
    seen.add(r * 9 + k);
    seen.add(k * 9 + c);
  }
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) seen.add((br + dr) * 9 + bc + dc);
  }
  seen.delete(i);
  return [...seen];
}

export function digitCounts(values: number[]): number[] {
  const counts = new Array<number>(10).fill(0);
  for (const v of values) if (v) counts[v]!++;
  return counts;
}

/** First empty naked single, else any empty, else a wrong entry. */
export function hintCell(values: number[], solution: number[]): number | null {
  for (let i = 0; i < 81; i++) {
    if (values[i]) continue;
    const opts = candidates(values, i);
    if (opts.length === 1) return i;
  }
  for (let i = 0; i < 81; i++) {
    if (!values[i] && solution[i]) return i;
  }
  for (let i = 0; i < 81; i++) {
    if (values[i] && values[i] !== solution[i]) return i;
  }
  return null;
}

export function isGiven(puzzle: number[], i: number): boolean {
  return puzzle[i] !== 0;
}
