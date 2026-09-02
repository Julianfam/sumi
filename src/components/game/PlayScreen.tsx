import { ChevronLeft, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Board } from "@/components/game/Board";
import { Pad } from "@/components/game/Pad";
import { Timer } from "@/components/game/Timer";
import { WinCard } from "@/components/game/WinCard";
import { remainingCells, useGame } from "@/lib/sudoku/store";
import { DIFFICULTY_META } from "@/lib/sudoku/types";

export function PlayScreen() {
  const difficulty = useGame((s) => s.difficulty);
  const generating = useGame((s) => s.generating);
  const won = useGame((s) => s.won);
  const runningSince = useGame((s) => s.runningSince);
  const values = useGame((s) => s.values);
  const goMenu = useGame((s) => s.goMenu);
  const pause = useGame((s) => s.pause);
  const resume = useGame((s) => s.resume);
  const paused = !won && !generating && runningSince === null;
  const left = remainingCells(values);
  const meta = DIFFICULTY_META[difficulty];

  return (
    <div className="play-layout screen-enter relative">
      <header className="play-header flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={goMenu}
          aria-label="Volver al menú"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium tracking-label text-muted uppercase">
            {meta.label}
          </p>
          <p className="truncate text-sm text-ink">
            {generating ? (
              <span className="shimmer-text">Componiendo el tablero</span>
            ) : (
              `${left} celdas libres`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="timer-chip rounded-md bg-surface px-2.5 py-1 sm:px-3 sm:py-1.5">
            <Timer className="font-display text-xl tabular-nums text-ink sm:text-2xl" />
          </div>
          {!won ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={paused ? resume : pause}
              aria-label={paused ? "Reanudar" : "Pausar"}
            >
              <span className="relative size-4">
                <Pause
                  className={`absolute inset-0 size-4 transition-[opacity,transform,filter] duration-250 ease-[var(--ease-smooth-out)] ${
                    paused
                      ? "scale-25 opacity-0 blur-sm"
                      : "scale-100 opacity-100 blur-none"
                  }`}
                />
                <Play
                  className={`absolute inset-0 size-4 transition-[opacity,transform,filter] duration-250 ease-[var(--ease-smooth-out)] ${
                    paused
                      ? "scale-100 opacity-100 blur-none"
                      : "scale-25 opacity-0 blur-sm"
                  }`}
                />
              </span>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="board-slot">
        <Board />
      </div>

      <div className="pad-slot">
        <Pad />
      </div>

      {paused ? (
        <div className="overlay-fog absolute inset-0 z-20 flex items-center justify-center bg-bg/80 px-4">
          <div className="overlay-panel flex w-full max-w-xs flex-col items-center gap-4 rounded-xl bg-surface p-6 text-center paper-shadow">
            <p className="font-display text-2xl text-ink">Pausa</p>
            <p className="text-sm leading-relaxed text-muted">
              El cronómetro está detenido. El tablero sigue guardado en este
              dispositivo.
            </p>
            <Button type="button" className="w-full" onClick={resume}>
              <Play className="size-4" />
              Reanudar
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={goMenu}>
              Salir al menú
            </Button>
          </div>
        </div>
      ) : null}

      {won ? (
        <div className="overlay-fog absolute inset-0 z-20 flex items-end justify-center overflow-y-auto bg-bg/55 px-3 py-3 sm:items-center sm:py-4">
          <div className="overlay-panel my-auto w-full max-w-md">
            <WinCard />
          </div>
        </div>
      ) : null}
    </div>
  );
}
