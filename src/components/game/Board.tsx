import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { peerIndices } from "@/lib/sudoku/engine";
import { useGame } from "@/lib/sudoku/store";

function Notes({ mask }: { mask: number }) {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-px">
      {Array.from({ length: 9 }, (_, n) => {
        const d = n + 1;
        const on = (mask & (1 << d)) !== 0;
        return (
          <span
            key={d}
            className={cn(
              "flex items-center justify-center text-2xs leading-none transition-opacity duration-150",
              on ? "text-muted" : "text-transparent",
            )}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}

export function Board() {
  const values = useGame((s) => s.values);
  const puzzle = useGame((s) => s.puzzle);
  const notes = useGame((s) => s.notes);
  const selected = useGame((s) => s.selected);
  const conflicts = useGame((s) => s.conflicts);
  const won = useGame((s) => s.won);
  const generating = useGame((s) => s.generating);
  const select = useGame((s) => s.select);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (generating) {
      setRevealing(false);
      return;
    }
    if (!puzzle.some(Boolean)) return;
    setRevealing(true);
    const id = window.setTimeout(() => setRevealing(false), 700);
    return () => window.clearTimeout(id);
  }, [generating, puzzle]);

  const selectedValue = selected !== null ? values[selected] : 0;
  const peers = useMemo(
    () => (selected === null ? new Set<number>() : new Set(peerIndices(selected))),
    [selected],
  );

  return (
    <div
      role="grid"
      aria-label="Tablero de sudoku"
      aria-rowcount={9}
      aria-colcount={9}
      className={cn(
        "sudoku-board relative select-none rounded-xl bg-surface p-1.5 paper-shadow sm:p-2",
        generating && "pointer-events-none",
      )}
    >
      <div className="grid h-full w-full grid-cols-9 grid-rows-9 overflow-hidden rounded-md bg-line-strong">
        {values.map((value, i) => {
          const r = (i / 9) | 0;
          const c = i % 9;
          const given = puzzle[i] !== 0;
          const isSel = selected === i;
          const isPeer = peers.has(i);
          const isSame = Boolean(selectedValue && value === selectedValue);
          const isConflict = conflicts.has(i) && value !== 0;
          const thickRight = c === 2 || c === 5;
          const thickBottom = r === 2 || r === 5;

          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-rowindex={r + 1}
              aria-colindex={c + 1}
              aria-selected={isSel}
              aria-label={
                value
                  ? `Fila ${r + 1}, columna ${c + 1}, ${value}${given ? ", pista" : ""}`
                  : `Fila ${r + 1}, columna ${c + 1}, vacía`
              }
              disabled={won}
              onClick={() => select(i)}
              className={cn(
                "relative flex min-h-0 min-w-0 items-center justify-center bg-surface text-base leading-none sm:text-xl",
                "touch-manipulation transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-smooth-out)]",
                given ? "font-semibold text-ink" : "font-medium text-entry",
                isPeer && !isSel && "bg-peer",
                isSame && !isSel && !isConflict && "bg-same",
                isSel && "cell-selected bg-selected",
                isConflict && "bg-conflict text-danger",
                won && "bg-surface",
                thickRight && "border-r-2 border-r-line-strong",
                thickBottom && "border-b-2 border-b-line-strong",
                c < 8 && !thickRight && "border-r border-r-line",
                r < 8 && !thickBottom && "border-b border-b-line",
              )}
            >
              {value ? (
                <span
                  key={`${i}-${value}`}
                  className={cn(
                    "tabular-nums",
                    revealing && given && "anim-reveal",
                    !given && "anim-digit",
                  )}
                  style={
                    revealing && given
                      ? ({ "--i": i } as CSSProperties)
                      : undefined
                  }
                >
                  {value}
                </span>
              ) : notes[i] ? (
                <Notes mask={notes[i]!} />
              ) : null}
            </button>
          );
        })}
      </div>
      {generating ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg/40">
          <p className="rounded-lg bg-surface px-4 py-2 text-sm paper-shadow">
            <span className="shimmer-text">Componiendo un tablero único</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
