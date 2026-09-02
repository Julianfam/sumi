import { useState } from "react";
import { LoaderCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { loadNick, saveNick } from "@/lib/sudoku/save";
import { submitScore } from "@/lib/sudoku/scores";
import { liveElapsed, useGame } from "@/lib/sudoku/store";
import { DIFFICULTY_META } from "@/lib/sudoku/types";

export function WinCard() {
  const difficulty = useGame((s) => s.difficulty);
  const elapsedMs = useGame((s) => s.elapsedMs);
  const runningSince = useGame((s) => s.runningSince);
  const hintsUsed = useGame((s) => s.hintsUsed);
  const startNew = useGame((s) => s.startNew);
  const goMenu = useGame((s) => s.goMenu);
  const goRanks = useGame((s) => s.goRanks);
  const timeMs = liveElapsed({ elapsedMs, runningSince });
  const [nick, setNick] = useState(() => loadNick());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [rank, setRank] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "saving" || status === "saved") return;
    setStatus("saving");
    setError("");
    try {
      const result = await submitScore({
        data: { nickname: nick.trim(), difficulty, timeMs },
      });
      saveNick(nick.trim());
      setRank(result.rank);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo publicar.");
    }
  }

  return (
    <div className="w-full rounded-xl bg-surface p-6 paper-shadow">
      <p className="text-2xs font-medium tracking-label text-muted uppercase">
        Tablero cerrado
      </p>
      <h2 className="font-display mt-1 text-3xl text-ink">Completado</h2>
      <div className="mt-4 flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs text-subtle">Tiempo</p>
          <p className="font-display text-3xl tabular-nums text-ink">
            {formatTime(timeMs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">Nivel</p>
          <p className="text-sm font-medium text-ink">
            {DIFFICULTY_META[difficulty].label}
          </p>
          <p className="text-xs text-muted">
            {hintsUsed === 0
              ? "Sin pistas"
              : `${hintsUsed} pista${hintsUsed === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {status === "saved" ? (
        <div className="mt-4 rounded-lg bg-secondary px-3 py-3 text-sm text-ink anim-digit">
          Publicado. Puesto {rank} en {DIFFICULTY_META[difficulty].label}.
        </div>
      ) : (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="text-xs font-medium text-muted" htmlFor="nick">
            Alias para el ranking
          </label>
          <Input
            id="nick"
            value={nick}
            maxLength={16}
            autoComplete="nickname"
            placeholder="Tu alias"
            onChange={(e) => setNick(e.target.value)}
            required
            minLength={2}
          />
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Button type="submit" disabled={status === "saving" || nick.trim().length < 2}>
            {status === "saving" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trophy className="size-4" />
            )}
            Publicar tiempo
          </Button>
        </form>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => startNew(difficulty)}>
          Otra vez
        </Button>
        <Button type="button" variant="ghost" onClick={goRanks}>
          Ver ranking
        </Button>
      </div>
      <Button type="button" variant="ghost" className="mt-1 w-full" onClick={goMenu}>
        Menú
      </Button>
    </div>
  );
}
