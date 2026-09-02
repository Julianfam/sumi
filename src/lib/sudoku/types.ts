export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; blurb: string; clues: [number, number]; rank: string }
> = {
  easy: {
    label: "Fácil",
    blurb: "Calentamiento. Muchas pistas, ritmo suave.",
    clues: [40, 46],
    rank: "I",
  },
  medium: {
    label: "Media",
    blurb: "Equilibrio. Hay que pensar cada bloque.",
    clues: [32, 36],
    rank: "II",
  },
  hard: {
    label: "Difícil",
    blurb: "Pocas pistas. Exige candados y pares.",
    clues: [26, 30],
    rank: "III",
  },
  expert: {
    label: "Experto",
    blurb: "Mínimo de pistas. Una sola solución.",
    clues: [22, 25],
    rank: "IV",
  },
};

export type Screen = "menu" | "playing" | "ranks";
