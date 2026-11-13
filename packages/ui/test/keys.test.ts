import assert from "node:assert/strict";
import test from "node:test";
import { detectPlatform, formatChord, isPlainChord, matchChord, parseChord } from "../src/keys.ts";

const event = (
  code: string,
  modifiers: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {},
) => ({
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
});

test("a chord parses into its modifiers and key", () => {
  assert.deepEqual(parseChord("Mod+Shift+Enter"), { mod: true, ctrl: false, alt: false, shift: true, code: "Enter" });
  assert.deepEqual(parseChord("F6"), { mod: false, ctrl: false, alt: false, shift: false, code: "F6" });
  assert.throws(() => parseChord("Mod+Shift"));
  assert.throws(() => parseChord("Hyper+K"));
});

test("Mod is Command on a Mac and Control elsewhere", () => {
  const chord = parseChord("Mod+Enter");
  assert.equal(matchChord(event("Enter", { metaKey: true }), chord, "mac"), true);
  assert.equal(matchChord(event("Enter", { ctrlKey: true }), chord, "mac"), false);
  assert.equal(matchChord(event("Enter", { ctrlKey: true }), chord, "other"), true);
  assert.equal(matchChord(event("Enter", { metaKey: true }), chord, "other"), false);
  assert.equal(matchChord(event("NumpadEnter", { metaKey: true }), chord, "mac"), true);
});

test("modifiers must match exactly", () => {
  const run = parseChord("Mod+Enter");
  const submit = parseChord("Mod+Shift+Enter");
  const press = event("Enter", { metaKey: true, shiftKey: true });
  assert.equal(matchChord(press, run, "mac"), false);
  assert.equal(matchChord(press, submit, "mac"), true);
  assert.equal(matchChord(event("BracketRight", { altKey: true }), parseChord("Alt+BracketRight"), "mac"), true);
  assert.equal(
    matchChord(event("BracketRight", { altKey: true, shiftKey: true }), parseChord("Alt+BracketRight"), "mac"),
    false,
  );
});

test("chords display with symbols on a Mac and names elsewhere", () => {
  assert.equal(formatChord("Mod+Shift+Enter", "mac"), "⇧⌘↵");
  assert.equal(formatChord("Alt+Shift+BracketRight", "mac"), "⌥⇧]");
  assert.equal(formatChord("Alt+Digit3", "mac"), "⌥3");
  assert.equal(formatChord("Mod+Shift+Enter", "other"), "Ctrl+Shift+Enter");
  assert.equal(formatChord("Alt+KeyB", "other"), "Alt+B");
  assert.equal(formatChord("F6", "other"), "F6");
});

test("plain chords are the ones that typing would trigger", () => {
  assert.equal(isPlainChord(parseChord("KeyJ")), true);
  assert.equal(isPlainChord(parseChord("Shift+KeyJ")), true);
  assert.equal(isPlainChord(parseChord("Alt+KeyJ")), false);
  assert.equal(isPlainChord(parseChord("F6")), false);
});

test("the platform comes from the navigator", () => {
  assert.equal(detectPlatform({ platform: "MacIntel" }), "mac");
  assert.equal(detectPlatform({ platform: "Win32", userAgent: "Windows NT" }), "other");
  assert.equal(detectPlatform(undefined), "other");
});
