import React from "react";
import { useStore } from "../lib/store";

export function StatusBar() {
  return (
    <footer className="border-t border-[var(--color-text-dim)] px-4 py-1 flex justify-between text-[10px] text-[var(--color-text-dim)]">
      <span className="uppercase">Status: Operational</span>
      <span className="tabular-nums">
        {new Date().toISOString().slice(0, 19).replace("T", " ")}
      </span>
    </footer>
  );
}
