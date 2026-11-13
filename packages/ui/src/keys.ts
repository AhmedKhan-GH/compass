/**
 * Key chords: parsing, matching against keyboard events, and display.
 *
 * A chord is written as modifiers and a key joined by "+", for example "Mod+Enter", "Alt+Shift+BracketRight" or
 * "F6". The key is a `KeyboardEvent.code`, so a chord names a physical key and works the same on every layout and
 * with Option held on a Mac (where `event.key` would be a typed symbol). "Mod" is Command on a Mac and Control
 * elsewhere.
 */

export type Platform = "mac" | "other";

export type Chord = {
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  /** A `KeyboardEvent.code`, such as "Enter", "Digit1" or "BracketRight". */
  code: string;
};

/** The part of a keyboard event a chord is matched against. */
export type KeyEventLike = {
  code: string;
  key?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

const MODIFIERS = new Set(["Mod", "Ctrl", "Alt", "Shift"]);

export function parseChord(text: string): Chord {
  const parts = text.split("+").map((part) => part.trim());
  const code = parts.pop();
  if (!code || MODIFIERS.has(code)) throw new Error(`A chord needs a key: ${text}`);
  const chord: Chord = { mod: false, ctrl: false, alt: false, shift: false, code };
  for (const part of parts) {
    if (part === "Mod") chord.mod = true;
    else if (part === "Ctrl") chord.ctrl = true;
    else if (part === "Alt") chord.alt = true;
    else if (part === "Shift") chord.shift = true;
    else throw new Error(`Unknown modifier "${part}" in ${text}`);
  }
  return chord;
}

/** Codes that stand for the same key. */
const EQUIVALENT: Record<string, string> = { NumpadEnter: "Enter" };

export function matchChord(event: KeyEventLike, chord: Chord, platform: Platform): boolean {
  const code = EQUIVALENT[event.code] ?? event.code;
  if (code !== chord.code) return false;
  // Mod is Command on a Mac and Control elsewhere; Ctrl always means the Control key.
  const wantMeta = platform === "mac" ? chord.mod : false;
  const wantCtrl = platform === "mac" ? chord.ctrl : chord.mod || chord.ctrl;
  return (
    event.metaKey === wantMeta &&
    event.ctrlKey === wantCtrl &&
    event.altKey === chord.alt &&
    event.shiftKey === chord.shift
  );
}

const KEY_LABELS: Record<string, { mac: string; other: string }> = {
  Enter: { mac: "↵", other: "Enter" },
  Escape: { mac: "esc", other: "Esc" },
  Backspace: { mac: "⌫", other: "Backspace" },
  Delete: { mac: "⌦", other: "Del" },
  Tab: { mac: "⇥", other: "Tab" },
  Space: { mac: "Space", other: "Space" },
  ArrowUp: { mac: "↑", other: "↑" },
  ArrowDown: { mac: "↓", other: "↓" },
  ArrowLeft: { mac: "←", other: "←" },
  ArrowRight: { mac: "→", other: "→" },
  BracketLeft: { mac: "[", other: "[" },
  BracketRight: { mac: "]", other: "]" },
  Comma: { mac: ",", other: "," },
  Period: { mac: ".", other: "." },
  Slash: { mac: "/", other: "/" },
  Backslash: { mac: "\\", other: "\\" },
  Minus: { mac: "-", other: "-" },
  Equal: { mac: "=", other: "=" },
  Home: { mac: "↖", other: "Home" },
  End: { mac: "↘", other: "End" },
  PageUp: { mac: "⇞", other: "PgUp" },
  PageDown: { mac: "⇟", other: "PgDn" },
};

export function keyLabel(code: string, platform: Platform): string {
  const known = KEY_LABELS[code];
  if (known) return known[platform];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return code;
}

/** "⌥⇧]" on a Mac, "Alt+Shift+]" elsewhere. The Mac order is Control, Option, Shift, Command. */
export function formatChord(chord: Chord | string, platform: Platform): string {
  const parsed = typeof chord === "string" ? parseChord(chord) : chord;
  const key = keyLabel(parsed.code, platform);
  if (platform === "mac") {
    const symbols =
      (parsed.ctrl ? "⌃" : "") + (parsed.alt ? "⌥" : "") + (parsed.shift ? "⇧" : "") + (parsed.mod ? "⌘" : "");
    return symbols + key;
  }
  const names = [
    ...(parsed.mod || parsed.ctrl ? ["Ctrl"] : []),
    ...(parsed.alt ? ["Alt"] : []),
    ...(parsed.shift ? ["Shift"] : []),
  ];
  return [...names, key].join("+");
}

/** True for a chord without Mod, Ctrl or Alt, which must not fire while the learner types in a field. */
export function isPlainChord(chord: Chord): boolean {
  return !chord.mod && !chord.ctrl && !chord.alt && !/^F[0-9]{1,2}$/.test(chord.code);
}

export function detectPlatform(navigatorLike: { platform?: string; userAgent?: string } | undefined): Platform {
  if (!navigatorLike) return "other";
  const text = `${navigatorLike.platform ?? ""} ${navigatorLike.userAgent ?? ""}`;
  return /Mac|iPhone|iPad|iPod/.test(text) ? "mac" : "other";
}
