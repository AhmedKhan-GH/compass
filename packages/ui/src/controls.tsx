"use client";
import type { ComponentPropsWithRef, KeyboardEvent, ReactNode } from "react";
import { join } from "./classes.ts";
import { useKeyBindings, usePlatform, useTheme } from "./hooks.ts";
import { formatChord } from "./keys.ts";
import { StatusGlyph } from "./status-mark.tsx";

/** A key chord in the mono face at the small size, for example "⌘↵". */
export function KeyHint({ chord, className }: { chord: string; className?: string }) {
  const platform = usePlatform();
  return <kbd className={join("sb-key", className)}>{formatChord(chord, platform)}</kbd>;
}

type ButtonProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  chord?: string;
  children?: ReactNode;
  /** The action this button started is running: the button takes the running colour and a running mark. */
  running?: boolean;
};

/** One target holding the key and the action it runs: "⌘↵ Run tests". */
export function KeyButton({ chord, children, className, running, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={join("sb-key-button", className)} data-running={running || undefined}>
      {running ? <StatusGlyph status="running" /> : chord && <KeyHint chord={chord} />}
      {children !== undefined && <span className="sb-key-button-label">{children}</span>}
    </button>
  );
}

/** The primary action, one per view: a square bronze plate with its key. */
export function PrimaryButton({ chord, children, className, running, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={join("sb-primary", className)} data-running={running || undefined}>
      {running ? <StatusGlyph status="running" /> : chord && <KeyHint chord={chord} />}
      {children !== undefined && <span className="sb-primary-label">{children}</span>}
    </button>
  );
}

const THEME_CHORD = "Alt+Shift+KeyL";

/** The theme setting: light (the learn theme) or dark, with a key that switches between them. */
export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  useKeyBindings([{ chord: THEME_CHORD, run: () => setTheme(theme === "dark" ? "learn" : "dark") }]);
  return (
    <span className="sb-segment" role="group" aria-label="Theme">
      <KeyHint chord={THEME_CHORD} />
      <button type="button" aria-pressed={theme === "learn"} onClick={() => setTheme("learn")}>
        Light
      </button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
        Dark
      </button>
    </span>
  );
}

/** A secondary action: a bare word, underlined under the pointer. */
export function WordButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={join("sb-word-button", className)}>
      {children}
    </button>
  );
}

export type Tab = {
  id: string;
  label: string;
  chord?: string;
  /** A count or short value after the label, for example the number of runs. */
  detail?: string;
  hidden?: boolean;
};

/**
 * A strip of tabs (WAI-ARIA tabs). Arrow keys move between tabs; Home and End go to the ends. The panels carry
 * `id={`${idPrefix}-panel-${tab.id}`}` and `aria-labelledby={`${idPrefix}-tab-${tab.id}`}`.
 */
export function TabStrip({
  tabs,
  active,
  onSelect,
  idPrefix,
  label,
  className,
}: {
  tabs: readonly Tab[];
  active: string;
  onSelect: (id: string) => void;
  idPrefix: string;
  label: string;
  className?: string;
}) {
  const visible = tabs.filter((tab) => !tab.hidden);
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = visible.findIndex((tab) => tab.id === active);
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (index + 1) % visible.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + visible.length) % visible.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = visible.length - 1;
    const tab = next === undefined ? undefined : visible[next];
    if (!tab) return;
    event.preventDefault();
    onSelect(tab.id);
    document.getElementById(`${idPrefix}-tab-${tab.id}`)?.focus();
  }
  return (
    <div role="tablist" aria-label={label} className={join("sb-tabs", className)} onKeyDown={onKeyDown}>
      {visible.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className="sb-tab"
            onClick={() => onSelect(tab.id)}
          >
            <span className="sb-tab-label">{tab.label}</span>
            {tab.detail && <span className="sb-tab-detail">{tab.detail}</span>}
            {tab.chord && <KeyHint chord={tab.chord} />}
          </button>
        );
      })}
    </div>
  );
}
