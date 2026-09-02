import { Eraser, Lightbulb, Pause, Pencil, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { digitCounts } from "@/lib/sudoku/engine";
import { useGame } from "@/lib/sudoku/store";

export function Pad() {
  const values = useGame((s) => s.values);
  const notesMode = useGame((s) => s.notesMode);
  const won = useGame((s) => s.won);
  const generating = useGame((s) => s.generating);
  const historyIndex = useGame((s) => s.historyIndex);
  const inputDigit = useGame((s) => s.inputDigit);
  const erase = useGame((s) => s.erase);
  const toggleNotes = useGame((s) => s.toggleNotes);
  const undo = useGame((s) => s.undo);
  const hint = useGame((s) => s.hint);
  const pause = useGame((s) => s.pause);
  const counts = digitCounts(values);
  const locked = won || generating;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-9 gap-1 lg:grid-cols-3 lg:gap-1.5">
        {Array.from({ length: 9 }, (_, n) => {
          const d = n + 1;
          const left = 9 - (counts[d] ?? 0);
          return (
            <button
              key={d}
              type="button"
              disabled={locked}
              onClick={() => inputDigit(d)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-md bg-surface paper-shadow",
                "aspect-square text-lg font-medium tabular-nums transition-[transform,background-color,color,opacity] duration-150 ease-[var(--ease-smooth-out)]",
                "hover:bg-selected active:scale-96",
                "disabled:opacity-40",
                notesMode ? "text-muted" : "text-entry",
                left === 0 && "opacity-35",
              )}
              aria-label={`Número ${d}, quedan ${Math.max(0, left)}`}
            >
              <span>{d}</span>
              <span className="hidden text-2xs font-medium text-subtle tabular-nums lg:block">
                {Math.max(0, left)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Button
          type="button"
          variant={notesMode ? "default" : "outline"}
          disabled={locked}
          onClick={toggleNotes}
          className="h-11 flex-col gap-0.5 px-1 text-2xs sm:text-xs"
          aria-pressed={notesMode}
        >
          <Pencil className="size-4" />
          Notas
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={locked}
          onClick={erase}
          className="h-11 flex-col gap-0.5 px-1 text-2xs sm:text-xs"
        >
          <Eraser className="size-4" />
          Borrar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={locked || historyIndex <= 0}
          onClick={undo}
          className="h-11 flex-col gap-0.5 px-1 text-2xs sm:text-xs"
        >
          <Undo2 className="size-4" />
          Deshacer
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={locked}
          onClick={hint}
          className="h-11 flex-col gap-0.5 px-1 text-2xs sm:text-xs"
        >
          <Lightbulb className="size-4" />
          Pista
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={locked}
        onClick={pause}
        className="hidden sm:inline-flex"
      >
        <Pause className="size-4" />
        Pausar
      </Button>
      <p className="hidden text-center text-xs text-subtle sm:block">
        Cada pista suma 20 s al cronómetro.
      </p>
    </div>
  );
}
