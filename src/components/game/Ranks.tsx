import { useEffect, useState } from "react";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from "@/lib/utils";
import { listScores, type ScoreRow } from "@/lib/sudoku/scores";
import { useGame } from "@/lib/sudoku/store";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/sudoku/types";

function RankList({ difficulty }: { difficulty: Difficulty }) {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    listScores({ data: { difficulty } })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar.");
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  if (rows === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-danger">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Aún no hay tiempos en {DIFFICULTY_META[difficulty].label}. Sé el primero.
      </p>
    );
  }

  return (
    <ol className="stagger-in flex flex-col">
      {rows.map((row, i) => (
        <li
          key={row.id}
          className="flex items-baseline gap-3 border-b border-line py-2.5 last:border-b-0"
        >
          <span
            className={
              i === 0
                ? "w-6 font-display text-sm tabular-nums text-primary"
                : "w-6 font-display text-sm tabular-nums text-subtle"
            }
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {row.nickname}
          </span>
          <span className="font-display text-sm tabular-nums text-entry">
            {formatTime(row.timeMs)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Ranks() {
  const goMenu = useGame((s) => s.goMenu);
  const difficulty = useGame((s) => s.difficulty);

  return (
    <div className="screen-enter mx-auto flex w-full max-w-lg flex-1 flex-col content-center justify-center gap-6">
      <header className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={goMenu}
          aria-label="Volver al menú"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <p className="text-2xs font-medium tracking-label text-muted uppercase">
            Mejores tiempos
          </p>
          <h1 className="font-display text-3xl tracking-tight text-ink">Ranking</h1>
        </div>
      </header>

      <Tabs defaultValue={difficulty}>
        <TabsList className="grid h-11 w-full grid-cols-4">
          {DIFFICULTIES.map((d) => (
            <TabsTrigger key={d} value={d} className="min-w-0 px-1 text-2xs sm:text-xs">
              {DIFFICULTY_META[d].label}
            </TabsTrigger>
          ))}
        </TabsList>
        {DIFFICULTIES.map((d) => (
          <TabsContent key={d} value={d}>
            <div className="rounded-xl bg-surface px-4 py-2 paper-shadow">
              <RankList difficulty={d} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
