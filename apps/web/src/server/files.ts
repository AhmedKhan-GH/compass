/** The files a learner submits: which names an item accepts, their limits, and the merge over the starter files. */
import { createHash } from "node:crypto";
import { SOURCE_LIMITS, type ItemView } from "@compass/schema";
import { HttpError } from "./http.ts";

export type SourceFiles = Record<string, string>;

/** The names a learner may submit: the solution file and the editable support files. */
export function submittableNames(item: Pick<ItemView, "design">): string[] {
  return [item.design.solution, ...item.design.editable];
}

/**
 * Checks submitted files against the item: only the solution file and editable support files, the solution
 * file present, no file empty or larger than the limit. Returns the files sorted by name.
 */
export function validateSubmittedFiles(item: Pick<ItemView, "design">, files: SourceFiles): SourceFiles {
  const allowed = new Set(submittableNames(item));
  const names = Object.keys(files).sort();
  for (const name of names)
    if (!allowed.has(name))
      throw new HttpError(400, "invalid-files", `${name} is not a file this exercise lets you edit.`);
  if (!Object.hasOwn(files, item.design.solution))
    throw new HttpError(400, "invalid-files", `Submit ${item.design.solution}.`);
  const checked: SourceFiles = {};
  for (const name of names) {
    const text = files[name] ?? "";
    if (!text.trim()) throw new HttpError(400, "invalid-files", `${name} is empty.`);
    if (Buffer.byteLength(text, "utf8") > SOURCE_LIMITS.fileBytes)
      throw new HttpError(400, "invalid-files", `${name} is larger than ${SOURCE_LIMITS.fileBytes / 1024} KiB.`);
    checked[name] = text;
  }
  return checked;
}

/** The submitted files over the item's starter files: every file a job needs. */
export function mergeWithStarter(item: Pick<ItemView, "starter">, files: SourceFiles): SourceFiles {
  const merged: SourceFiles = { ...item.starter, ...files };
  return Object.fromEntries(Object.keys(merged).sort().map((name) => [name, merged[name] ?? ""]));
}

/** SHA-256 (hex) over the names and contents of `files`, independent of key order. */
export function sourceHash(files: SourceFiles): string {
  const entries = Object.keys(files)
    .sort()
    .map((name) => [name, files[name] ?? ""]);
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}
