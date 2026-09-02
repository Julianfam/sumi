import { create } from "zustand";
import {
  clueCount,
  conflictSet,
  generatePuzzle,
  hintCell,
  isComplete,
  matchesSolution,
} from "./engine";
import {
  clearGame,
  loadBest,
  loadGame,
  recordBest,
  saveGame,
  type BestTimes,
  type SavedGame,
} from "./save";
import { DIFFICULTY_META, type Difficulty, type Screen } from "./types";

const HINT_PENALTY_MS = 20_000;

type Snapshot = { values: number[]; notes: number[] };

type GameStore = {
  screen: Screen;
  difficulty: Difficulty;
  puzzle: number[];
  solution: number[];
  values: number[];
  notes: number[];
  selected: number | null;
  notesMode: boolean;
  elapsedMs: number;
  runningSince: number | null;
  hintsUsed: number;
  history: Snapshot[];
  historyIndex: number;
  generating: boolean;
  won: boolean;
  best: BestTimes;
  conflicts: Set<number>;

  hydrate: () => void;
  goMenu: () => void;
  goRanks: () => void;
  startNew: (d: Difficulty) => void;
  resumeSaved: () => void;
  select: (i: number | null) => void;
  inputDigit: (d: number) => void;
  erase: () => void;
  toggleNotes: () => void;
  undo: () => void;
  redo: () => void;
  hint: () => void;
  pause: () => void;
  resume: () => void;
  tick: (now: number) => void;
  persist: () => void;
};

function snapshotOf(values: number[], notes: number[]): Snapshot {
  return { values: values.slice(), notes: notes.slice() };
}

function sameSnap(a: Snapshot, b: Snapshot): boolean {
  for (let i = 0; i < 81; i++) {
    if (a.values[i] !== b.values[i] || a.notes[i] !== b.notes[i]) return false;
  }
  return true;
}

function persistNow(get: () => GameStore) {
  const s = get();
  if (s.won || s.puzzle.length !== 81) return;
  if (isComplete(s.values) && matchesSolution(s.values, s.solution)) return;
  const live =
    s.elapsedMs + (s.runningSince ? Date.now() - s.runningSince : 0);
  const blob: SavedGame = {
    version: 1,
    difficulty: s.difficulty,
    puzzle: s.puzzle,
    solution: s.solution,
    values: s.values,
    notes: s.notes,
    elapsedMs: live,
    hintsUsed: s.hintsUsed,
    history: s.history,
    historyIndex: s.historyIndex,
  };
  saveGame(blob);
}

export const useGame = create<GameStore>((set, get) => ({
  screen: "menu",
  difficulty: "easy",
  puzzle: [],
  solution: [],
  values: [],
  notes: [],
  selected: null,
  notesMode: false,
  elapsedMs: 0,
  runningSince: null,
  hintsUsed: 0,
  history: [],
  historyIndex: -1,
  generating: false,
  won: false,
  best: {},
  conflicts: new Set(),

  hydrate: () => {
    set({ best: loadBest() });
  },

  goMenu: () => {
    persistNow(get);
    const s = get();
    const frozen =
      s.elapsedMs + (s.runningSince ? Date.now() - s.runningSince : 0);
    set({
      screen: "menu",
      runningSince: null,
      elapsedMs: s.won ? s.elapsedMs : frozen,
      best: loadBest(),
    });
  },

  goRanks: () => {
    persistNow(get);
    const s = get();
    const frozen =
      s.elapsedMs + (s.runningSince ? Date.now() - s.runningSince : 0);
    set({
      screen: "ranks",
      runningSince: null,
      elapsedMs: s.won ? s.elapsedMs : frozen,
    });
  },

  startNew: (d) => {
    set({
      generating: true,
      screen: "playing",
      difficulty: d,
      won: false,
      puzzle: new Array(81).fill(0),
      solution: [],
      values: new Array(81).fill(0),
      notes: new Array(81).fill(0),
      selected: null,
      runningSince: null,
      elapsedMs: 0,
      conflicts: new Set(),
    });
    // Yield so the generating spinner can paint.
    setTimeout(() => {
      const [lo, hi] = DIFFICULTY_META[d].clues;
      const target = lo + ((Math.random() * (hi - lo + 1)) | 0);
      const { puzzle, solution } = generatePuzzle(target);
      const values = puzzle.slice();
      const notes = new Array<number>(81).fill(0);
      const snap = snapshotOf(values, notes);
      set({
        puzzle,
        solution,
        values,
        notes,
        selected: puzzle.findIndex((v) => v === 0),
        notesMode: false,
        elapsedMs: 0,
        runningSince: Date.now(),
        hintsUsed: 0,
        history: [snap],
        historyIndex: 0,
        generating: false,
        won: false,
        conflicts: new Set(),
        screen: "playing",
        difficulty: d,
      });
      persistNow(get);
    }, 30);
  },

  resumeSaved: () => {
    const saved = loadGame();
    if (!saved) return;
    if (
      isComplete(saved.values) &&
      matchesSolution(saved.values, saved.solution)
    ) {
      clearGame();
      return;
    }
    set({
      screen: "playing",
      difficulty: saved.difficulty,
      puzzle: saved.puzzle,
      solution: saved.solution,
      values: saved.values,
      notes: saved.notes,
      selected: saved.puzzle.findIndex((v, i) => v === 0 && !saved.values[i]),
      notesMode: false,
      elapsedMs: saved.elapsedMs,
      runningSince: Date.now(),
      hintsUsed: saved.hintsUsed,
      history: saved.history.length
        ? saved.history
        : [snapshotOf(saved.values, saved.notes)],
      historyIndex: saved.historyIndex >= 0 ? saved.historyIndex : 0,
      generating: false,
      won: false,
      conflicts: conflictSet(saved.values),
    });
  },

  select: (i) => set({ selected: i }),

  inputDigit: (d) => {
    const s = get();
    if (s.won || s.generating || s.selected === null) return;
    if (s.runningSince === null) return;
    const i = s.selected;
    if (s.puzzle[i]) return;

    const values = s.values.slice();
    const notes = s.notes.slice();

    if (s.notesMode) {
      if (values[i]) return;
      notes[i] = notes[i]! ^ (1 << d);
    } else {
      values[i] = values[i] === d ? 0 : d;
      notes[i] = 0;
      if (values[i]) {
        // Strip this digit from peers' notes
        const r = (i / 9) | 0;
        const c = i % 9;
        const br = ((r / 3) | 0) * 3;
        const bc = ((c / 3) | 0) * 3;
        const flag = 1 << d;
        for (let k = 0; k < 9; k++) {
          notes[r * 9 + k]! &= ~flag;
          notes[k * 9 + c]! &= ~flag;
        }
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            notes[(br + dr) * 9 + bc + dc]! &= ~flag;
          }
        }
      }
    }

    const prev = s.history[s.historyIndex];
    const next = snapshotOf(values, notes);
    let history = s.history;
    let historyIndex = s.historyIndex;
    if (!prev || !sameSnap(prev, next)) {
      history = s.history.slice(0, s.historyIndex + 1);
      history.push(next);
      if (history.length > 80) history = history.slice(history.length - 80);
      historyIndex = history.length - 1;
    }

    const won =
      !s.notesMode && isComplete(values) && matchesSolution(values, s.solution);
    const live =
      s.elapsedMs + (s.runningSince ? Date.now() - s.runningSince : 0);
    if (won) {
      recordBest(s.difficulty, live);
      clearGame();
    }

    set({
      values,
      notes,
      history,
      historyIndex,
      won,
      runningSince: won ? null : s.runningSince,
      elapsedMs: won ? live : s.elapsedMs,
      conflicts: conflictSet(values),
      best: won ? loadBest() : s.best,
    });
    if (!won) persistNow(get);
  },

  erase: () => {
    const s = get();
    if (s.won || s.selected === null || s.runningSince === null) return;
    const i = s.selected;
    if (s.puzzle[i]) return;
    const values = s.values.slice();
    const notes = s.notes.slice();
    values[i] = 0;
    notes[i] = 0;
    const next = snapshotOf(values, notes);
    const history = s.history.slice(0, s.historyIndex + 1);
    history.push(next);
    set({
      values,
      notes,
      history,
      historyIndex: history.length - 1,
      conflicts: conflictSet(values),
    });
    persistNow(get);
  },

  toggleNotes: () => set((s) => ({ notesMode: !s.notesMode })),

  undo: () => {
    const s = get();
    if (s.won || s.historyIndex <= 0) return;
    const idx = s.historyIndex - 1;
    const snap = s.history[idx]!;
    set({
      values: snap.values.slice(),
      notes: snap.notes.slice(),
      historyIndex: idx,
      conflicts: conflictSet(snap.values),
    });
    persistNow(get);
  },

  redo: () => {
    const s = get();
    if (s.won || s.historyIndex >= s.history.length - 1) return;
    const idx = s.historyIndex + 1;
    const snap = s.history[idx]!;
    set({
      values: snap.values.slice(),
      notes: snap.notes.slice(),
      historyIndex: idx,
      conflicts: conflictSet(snap.values),
    });
    persistNow(get);
  },

  hint: () => {
    const s = get();
    if (s.won || s.runningSince === null) return;
    const i = hintCell(s.values, s.solution);
    if (i === null) return;
    const values = s.values.slice();
    const notes = s.notes.slice();
    values[i] = s.solution[i]!;
    notes[i] = 0;
    const history = s.history.slice(0, s.historyIndex + 1);
    history.push(snapshotOf(values, notes));
    const won = isComplete(values) && matchesSolution(values, s.solution);
    const live =
      s.elapsedMs +
      HINT_PENALTY_MS +
      (s.runningSince ? Date.now() - s.runningSince : 0);
    if (won) {
      recordBest(s.difficulty, live);
      clearGame();
    }
    set({
      values,
      notes,
      selected: i,
      hintsUsed: s.hintsUsed + 1,
      history,
      historyIndex: history.length - 1,
      elapsedMs: s.elapsedMs + HINT_PENALTY_MS,
      won,
      runningSince: won ? null : s.runningSince,
      conflicts: conflictSet(values),
      best: won ? loadBest() : s.best,
    });
    if (!won) persistNow(get);
  },

  pause: () => {
    const s = get();
    if (s.won || s.runningSince === null) return;
    set({
      elapsedMs: s.elapsedMs + (Date.now() - s.runningSince),
      runningSince: null,
    });
    persistNow(get);
  },

  resume: () => {
    const s = get();
    if (s.won || s.generating) return;
    set({ runningSince: Date.now() });
  },

  tick: (now) => {
    const s = get();
    if (s.runningSince === null) return;
    // Store is the source; UI reads elapsedMs + (now - runningSince).
    void now;
  },

  persist: () => persistNow(get),
}));

export function liveElapsed(s: {
  elapsedMs: number;
  runningSince: number | null;
  now?: number;
}): number {
  const now = s.now ?? Date.now();
  return s.elapsedMs + (s.runningSince ? now - s.runningSince : 0);
}

export function remainingCells(values: number[]): number {
  let n = 0;
  for (const v of values) if (!v) n++;
  return n;
}

export function givenCount(puzzle: number[]): number {
  return clueCount(puzzle);
}

export { HINT_PENALTY_MS };
