import { cn } from "@/lib/utils";

const SAMPLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0,
  6, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2,
  0, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0,
  0, 0, 8, 0, 0, 7, 9,
];

export function SampleGrid() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto hidden w-full max-w-md justify-self-end lg:block"
    >
      <div className="rounded-xl bg-surface p-3 paper-shadow">
        <div className="grid aspect-square grid-cols-9 grid-rows-9 overflow-hidden rounded-md bg-line-strong">
          {SAMPLE.map((value, i) => {
            const r = (i / 9) | 0;
            const c = i % 9;
            const thickRight = c === 2 || c === 5;
            const thickBottom = r === 2 || r === 5;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center bg-surface font-display text-xl text-ink/70",
                  thickRight && "border-r-2 border-r-line-strong",
                  thickBottom && "border-b-2 border-b-line-strong",
                  c < 8 && !thickRight && "border-r border-r-line",
                  r < 8 && !thickBottom && "border-b border-b-line",
                )}
              >
                {value || ""}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center text-2xs tracking-label text-subtle uppercase">
        Edición de papel
      </p>
    </div>
  );
}
