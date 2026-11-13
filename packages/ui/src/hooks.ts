"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { detectPlatform, isPlainChord, matchChord, parseChord, type Chord, type Platform } from "./keys.ts";
import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from "./theme.ts";

const noSubscription = () => () => {};

/** The platform for key display and matching. The server renders Mac keys; the client corrects them on hydration. */
export function usePlatform(): Platform {
  return useSyncExternalStore(
    noSubscription,
    () => detectPlatform(typeof navigator === "undefined" ? undefined : navigator),
    () => "mac",
  );
}

// Local storage holds per-viewer conveniences only (pane sizes, the open tab). Reads and writes never throw.
const storageListeners = new Set<() => void>();

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable; the value then lasts only for this page.
  }
  for (const listener of storageListeners) listener();
}

function subscribeStorage(listener: () => void): () => void {
  storageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    storageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** A string in local storage, null on the server and when absent. */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => null,
  );
}

export type KeyBinding = {
  /** For example "Mod+Enter" or "Alt+Digit1". See keys.ts. */
  chord: string;
  run: () => void;
  /** False turns the binding off without removing it. */
  enabled?: boolean;
};

/**
 * Global key bindings, matched in the capture phase so they work inside the editor too. A matched chord is not
 * passed on. Chords without Mod, Ctrl or Alt are ignored while focus is in a text field.
 */
export function useKeyBindings(bindings: readonly KeyBinding[]): void {
  const platform = usePlatform();
  const current = useRef(bindings);
  useEffect(() => {
    current.current = bindings;
  });
  useEffect(() => {
    const parsed = new Map<string, Chord>();
    const chordOf = (text: string) => {
      let chord = parsed.get(text);
      if (!chord) parsed.set(text, (chord = parseChord(text)));
      return chord;
    };
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      // A modal dialog has the keys to itself.
      if (document.querySelector("dialog[open]")) return;
      for (const binding of current.current) {
        if (binding.enabled === false) continue;
        const chord = chordOf(binding.chord);
        if (!matchChord(event, chord, platform)) continue;
        if (isPlainChord(chord) && isTextField(event.target)) continue;
        event.preventDefault();
        event.stopPropagation();
        binding.run();
        return;
      }
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [platform]);
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement)
    return !["button", "checkbox", "radio", "range", "submit", "reset"].includes(target.type);
  return false;
}

/** The id of the pane (`data-pane`) that holds keyboard focus, or the last one that did. */
export function useFocusedPane(initial: string): [string, (pane: string) => void] {
  const [pane, setPane] = useState(initial);
  useEffect(() => {
    const listener = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-pane]") : null;
      const id = target?.dataset.pane;
      if (id) setPane(id);
    };
    document.addEventListener("focusin", listener);
    return () => document.removeEventListener("focusin", listener);
  }, []);
  return [pane, setPane];
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "learn";
}

function subscribeTheme(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The theme on the root element, and a setter that applies it and keeps it in local storage. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);
  const set = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    writeStorage(THEME_STORAGE_KEY, next);
  }, []);
  return [theme, set];
}
