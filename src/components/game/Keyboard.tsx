import { useEffect } from "react";
import { useGame } from "@/lib/sudoku/store";

export function Keyboard() {
  const screen = useGame((s) => s.screen);

  useEffect(() => {
    if (screen !== "playing") return;

    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (s.screen !== "playing" || s.won || s.generating) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === " " && s.runningSince === null) {
        e.preventDefault();
        s.resume();
        return;
      }
      if (s.runningSince === null) return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        s.inputDigit(Number(e.key));
        return;
      }
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        s.erase();
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        s.toggleNotes();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        s.pause();
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        s.hint();
        return;
      }

      const selected = s.selected;
      if (selected === null) return;
      const r = (selected / 9) | 0;
      const c = selected % 9;
      let nr = r;
      let nc = c;
      if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
      else if (e.key === "ArrowDown") nr = Math.min(8, r + 1);
      else if (e.key === "ArrowLeft") nc = Math.max(0, c - 1);
      else if (e.key === "ArrowRight") nc = Math.min(8, c + 1);
      else return;
      e.preventDefault();
      s.select(nr * 9 + nc);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  return null;
}
