import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";
import { liveElapsed, useGame } from "@/lib/sudoku/store";

export function Timer({ className }: { className?: string }) {
  const elapsedMs = useGame((s) => s.elapsedMs);
  const runningSince = useGame((s) => s.runningSince);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (runningSince === null) return;
    let raf = 0;
    const loop = () => {
      const next = Date.now();
      setNow((prev) =>
        Math.floor(prev / 1000) === Math.floor(next / 1000) ? prev : next,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [runningSince]);

  const ms = liveElapsed({ elapsedMs, runningSince, now });

  return (
    <time
      dateTime={`PT${Math.floor(ms / 1000)}S`}
      className={className}
      aria-label="Tiempo transcurrido"
    >
      {formatTime(ms)}
    </time>
  );
}
