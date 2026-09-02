import type { Difficulty } from "./types";

export const SAVE_VERSION = 1;
const KEY = "sumi:save:v1";
const BEST_KEY = "sumi:best:v1";
const NICK_KEY = "sumi:nick:v1";

export type SavedGame = {
  version: number;
  difficulty: Difficulty;
  puzzle: number[];
  solution: number[];
  values: number[];
  notes: number[];
  elapsedMs: number;
  hintsUsed: number;
  history: { values: number[]; notes: number[] }[];
  historyIndex: number;
};

export type BestTimes = Partial<Record<Difficulty, number>>;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadGame(): SavedGame | null {
  const data = safeParse<SavedGame>(
    typeof localStorage === "undefined" ? null : localStorage.getItem(KEY),
  );
  if (!data || data.version !== SAVE_VERSION) return null;
  if (!Array.isArray(data.puzzle) || data.puzzle.length !== 81) return null;
  if (!Array.isArray(data.values) || data.values.length !== 81) return null;
  return data;
}

export function saveGame(state: SavedGame): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: SAVE_VERSION }));
  } catch {
    /* quota / private mode */
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function loadBest(): BestTimes {
  return safeParse<BestTimes>(
    typeof localStorage === "undefined" ? null : localStorage.getItem(BEST_KEY),
  ) ?? {};
}

export function recordBest(difficulty: Difficulty, timeMs: number): number {
  const best = loadBest();
  const prev = best[difficulty];
  if (prev === undefined || timeMs < prev) {
    best[difficulty] = timeMs;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(best));
    } catch {
      /* ignore */
    }
    return timeMs;
  }
  return prev;
}

export function loadNick(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNick(nick: string): void {
  try {
    localStorage.setItem(NICK_KEY, nick);
  } catch {
    /* ignore */
  }
}
