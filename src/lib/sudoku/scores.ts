import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DIFFICULTIES, type Difficulty } from "./types";

const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(16, "Máximo 16 caracteres")
  .regex(/^[\p{L}\p{N} ._-]+$/u, "Solo letras, números y . _ -");

const difficultySchema = z.enum(DIFFICULTIES);

export type ScoreRow = {
  id: number;
  nickname: string;
  difficulty: Difficulty;
  timeMs: number;
  createdAt: string;
};

export const listScores = createServerFn({ method: "GET" })
  .validator(z.object({ difficulty: difficultySchema }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<ScoreRow>`
      select
        id,
        nickname,
        difficulty,
        time_ms as "timeMs",
        created_at::text as "createdAt"
      from sudoku_scores
      where difficulty = ${data.difficulty}
      order by time_ms asc, created_at asc
      limit 15
    `;
    return rows;
  });

export const submitScore = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nickname: nicknameSchema,
      difficulty: difficultySchema,
      timeMs: z.number().int().min(1_000).max(24 * 60 * 60 * 1000),
    }),
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<ScoreRow>`
      insert into sudoku_scores (nickname, difficulty, time_ms)
      values (${data.nickname}, ${data.difficulty}, ${data.timeMs})
      returning
        id,
        nickname,
        difficulty,
        time_ms as "timeMs",
        created_at::text as "createdAt"
    `;
    const saved = rows[0];
    if (!saved) throw new Error("No se pudo guardar el resultado");

    const rankRows = await sql<{ rank: number }>`
      select count(*)::int + 1 as rank
      from sudoku_scores
      where difficulty = ${data.difficulty}
        and (
          time_ms < ${data.timeMs}
          or (time_ms = ${data.timeMs} and created_at < ${saved.createdAt}::timestamptz)
        )
    `;
    return { score: saved, rank: rankRows[0]?.rank ?? 1 };
  });
