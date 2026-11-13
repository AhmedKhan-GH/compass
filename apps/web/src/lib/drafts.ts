/**
 * Drafts: the learner's files for an item, kept in the browser's local storage per item and revision. A changed
 * revision starts from its own starter, and the draft of the earlier revision stays where it was.
 */
import type { ItemView } from "@compass/schema";

export const DRAFT_PREFIX = "compass:draft:";

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Files = Record<string, string>;
type ItemFiles = Pick<ItemView, "design" | "starter">;

/** `compass:draft:<course id>:<item id>:<revision>`. The item id is the UUID, so a renamed slug keeps its draft. */
export function draftKey(courseId: string, itemId: string, revision: string): string {
  return `${DRAFT_PREFIX}${courseId}:${itemId}:${revision}`;
}

/** The files the learner may edit and submit: the solution file and the editable support files, in that order. */
export function editableNames(item: ItemFiles): string[] {
  const names = [item.design.solution, ...item.design.editable.filter((name) => name !== item.design.solution)];
  return names.filter((name, index) => names.indexOf(name) === index && name in item.starter);
}

/** Every file shown in the editor: the editable ones first, then the read-only support files. */
export function shownNames(item: ItemFiles): string[] {
  const editable = editableNames(item);
  return [...editable, ...item.design.support.filter((name) => !editable.includes(name) && name in item.starter)];
}

export function starterFiles(item: ItemFiles): Files {
  return Object.fromEntries(editableNames(item).map((name) => [name, item.starter[name] ?? ""]));
}

/** Reads a stored draft. Unknown names are dropped and missing ones come from the starter. */
export function parseDraft(text: string | null, item: ItemFiles): Files | undefined {
  if (!text) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!value || typeof value !== "object" || !("files" in value)) return undefined;
  const files = (value as { files: unknown }).files;
  if (!files || typeof files !== "object") return undefined;
  const starter = starterFiles(item);
  const result: Files = {};
  for (const name of Object.keys(starter)) {
    const content = (files as Record<string, unknown>)[name];
    result[name] = typeof content === "string" ? content : (starter[name] ?? "");
  }
  return result;
}

export function loadDraft(storage: DraftStorage | undefined, key: string, item: ItemFiles): Files {
  let text: string | null = null;
  try {
    text = storage?.getItem(key) ?? null;
  } catch {
    text = null;
  }
  return parseDraft(text, item) ?? starterFiles(item);
}

/** Stores the draft, or removes it when it equals the starter. Returns false when storage refused it. */
export function saveDraft(
  storage: DraftStorage | undefined,
  key: string,
  files: Files,
  item: ItemFiles,
  savedAt: string,
): boolean {
  if (!storage) return false;
  try {
    if (sameFiles(files, starterFiles(item))) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify({ files, savedAt }));
    return true;
  } catch {
    return false;
  }
}

export function sameFiles(a: Files, b: Files): boolean {
  const names = Object.keys(a);
  return names.length === Object.keys(b).length && names.every((name) => a[name] === b[name]);
}

/** The draft's files that a run may carry: only the editable names. */
export function submittedFiles(files: Files, item: ItemFiles): Files {
  return Object.fromEntries(editableNames(item).map((name) => [name, files[name] ?? item.starter[name] ?? ""]));
}
