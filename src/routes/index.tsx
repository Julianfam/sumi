import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Keyboard } from "@/components/game/Keyboard";
import { Menu } from "@/components/game/Menu";
import { PlayScreen } from "@/components/game/PlayScreen";
import { Ranks } from "@/components/game/Ranks";
import { useGame } from "@/lib/sudoku/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const screen = useGame((s) => s.screen);
  const persist = useGame((s) => s.persist);

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
    <main className="relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden="true"
        className="washi-veil pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/washi.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="page-shell relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {screen === "menu" ? <Menu /> : null}
        {screen === "playing" ? <PlayScreen /> : null}
        {screen === "ranks" ? <Ranks /> : null}
        <Keyboard />
        {screen !== "playing" ? (
          <footer className="mt-auto pt-10 text-2xs tracking-wide text-subtle">
            Sumi — papel, tinta y un solo hueco correcto.
          </footer>
        ) : null}
      </div>
    </main>
  );
}
