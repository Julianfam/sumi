import { useEffect, useState } from "react";
import { ArrowRight, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SampleGrid } from "@/components/game/SampleGrid";
import { formatTime } from "@/lib/utils";
import { loadGame } from "@/lib/sudoku/save";
import { useGame } from "@/lib/sudoku/store";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/sudoku/types";

export function Menu() {
  const startNew = useGame((s) => s.startNew);
  const resumeSaved = useGame((s) => s.resumeSaved);
  const goRanks = useGame((s) => s.goRanks);
  const best = useGame((s) => s.best);
  const hydrate = useGame((s) => s.hydrate);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    hydrate();
    setHasSave(Boolean(loadGame()));
  }, [hydrate]);

  return (
    <div className="screen-enter mx-auto grid w-full max-w-lg flex-1 content-center gap-8 self-stretch sm:gap-10 lg:max-w-none lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-16">
      <div className="stagger-in flex flex-col gap-6 sm:gap-10">
        <header className="flex flex-col items-start gap-2 sm:gap-3">
          <p className="text-2xs font-medium tracking-label text-muted uppercase">
            Sudoku de tinta
          </p>
          <h1 className="font-display text-4xl font-medium text-ink sm:text-6xl">
            Sumi
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Un cuaderno de 9×9. Elige dificultad, corre el cronómetro y entra al
            ranking si cierras el tablero.
          </p>
        </header>

        {hasSave ? (
          <Button
            type="button"
            size="lg"
            className="w-full justify-between"
            onClick={resumeSaved}
          >
            Continuar partida
            <ArrowRight className="size-4" />
          </Button>
        ) : null}

        <ul className="flex flex-col gap-2">
          {DIFFICULTIES.map((d: Difficulty) => {
            const meta = DIFFICULTY_META[d];
            const bestMs = best[d];
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => startNew(d)}
                  className="group flex w-full min-h-14 items-center gap-3 rounded-xl bg-surface px-3 py-3 text-left paper-shadow transition-[transform,background-color] duration-150 ease-[var(--ease-smooth-out)] hover:-translate-y-px hover:bg-selected active:scale-96 sm:min-h-0 sm:gap-4 sm:px-4 sm:py-3.5"
                >
                  <span className="font-display w-7 text-lg text-primary tabular-nums sm:w-8">
                    {meta.rank}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-ink">{meta.label}</span>
                    <span className="truncate text-xs text-muted">{meta.blurb}</span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5 text-xs text-subtle">
                    {bestMs !== undefined ? (
                      <span className="inline-flex items-center gap-1 tabular-nums text-entry">
                        <Clock className="size-3" />
                        {formatTime(bestMs)}
                      </span>
                    ) : (
                      <span>Sin marca</span>
                    )}
                    <ArrowRight className="size-4 text-subtle transition-transform duration-150 ease-[var(--ease-smooth-out)] group-hover:translate-x-0.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <Button type="button" variant="outline" className="w-full" onClick={goRanks}>
          <Trophy className="size-4" />
          Ranking global
        </Button>
      </div>
      <SampleGrid />
    </div>
  );
}
