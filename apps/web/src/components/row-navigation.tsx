"use client";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

const NEXT = new Set(["ArrowDown", "j"]);
const PREVIOUS = new Set(["ArrowUp", "k"]);

/**
 * Moves focus between the rows (`[data-row]`) inside it with the arrow keys, J and K, Home and End. The rows are
 * links or buttons, so Enter opens the focused one. With nothing focused on the page, the first arrow press
 * focuses the first row.
 */
export function RowNavigation({ children, className }: { children: ReactNode; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      if (!NEXT.has(event.key) && !PREVIOUS.has(event.key)) return;
      const first = container.current?.querySelector<HTMLElement>("[data-row]");
      if (!first) return;
      event.preventDefault();
      first.focus();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const rows = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-row]")];
    if (!rows.length) return;
    const index = rows.findIndex((row) => row === document.activeElement);
    if (index < 0) return;
    let next: number | undefined;
    if (NEXT.has(event.key)) next = Math.min(rows.length - 1, index + 1);
    else if (PREVIOUS.has(event.key)) next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = rows.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    rows[next]?.focus();
    rows[next]?.scrollIntoView({ block: "nearest" });
  }
  return (
    <div ref={container} className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}
