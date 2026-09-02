import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Keyboard } from "@/components/game/Keyboard";
import { Menu } from "@/components/game/Menu";
import { PlayScreen } from "@/components/game/PlayScreen";
import { Ranks } from "@/components/game/Ranks";
import { useGame } from "@/lib/sudoku/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const screen = useGame((s) => s.screen);
  const persist = useGame((s) => s.persist);
  const playing = screen === "playing";

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
    };
  }, [persist]);

  return (
    <main
      className={cn(
        "relative overflow-x-hidden",
        playing ? "h-dvh overflow-hidden overscroll-none" : "min-h-dvh",
      )}
    >
      <div
        aria-hidden="true"
        className="washi-veil pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/washi.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        className={cn(
          "page-shell relative mx-auto flex w-full max-w-5xl flex-col px-3 sm:px-6",
          playing
            ? "page-shell-play h-dvh min-h-0 py-0"
            : "min-h-dvh px-4 py-6 sm:py-10",
        )}
      >
        {screen === "menu" ? <Menu /> : null}
        {screen === "playing" ? <PlayScreen /> : null}
        {screen === "ranks" ? <Ranks /> : null}
        <Keyboard />
        {playing ? null : (
          <footer className="mt-auto pt-8 text-2xs tracking-wide text-subtle sm:pt-10">
            Sumi — papel, tinta y un solo hueco correcto.
          </footer>
        )}
      </div>
    </main>
  );
}
