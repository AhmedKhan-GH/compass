/**
 * The source layer: a source kind turns a source entry of compass.config.toml into pack directories on disk.
 * Only `local` exists. Later kinds (`git`, `url`, `atlas`) fetch into `cacheDirectory` and then yield pack
 * directories the same way; nothing after this layer knows where a pack came from.
 */
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import type { ContentSource } from "@compass/schema";
import { DiagnosticList, type Diagnostic } from "./diagnostics.ts";
import { compareText, errorCode } from "./files.ts";

export const COURSE_FILE = "course.toml";

export type PackLocation = {
  /** The absolute path of the pack directory. */
  directory: string;
  /** The directory as shown to the user: relative to the working directory when inside it. */
  label: string;
  /** Where the pack came from, as the index records it: for example `local:content/verilog`. */
  source: string;
};

export type SourceContext = {
  /** The repository root; relative source paths are resolved against it. */
  root: string;
  /** The working directory, for labels. */
  cwd: string;
  /** Where fetching kinds keep their copies. */
  cacheDirectory: string;
};

export type SourceResult = { packs: PackLocation[]; diagnostics: Diagnostic[] };

export type SourceKind<S extends ContentSource> = (source: S, context: SourceContext) => Promise<SourceResult>;

type SourceKinds = { [K in ContentSource["kind"]]: SourceKind<Extract<ContentSource, { kind: K }>> };

/** Every source kind this installation knows. Adding a kind to `ContentSource` in the schema requires an entry. */
export const SOURCE_KINDS: SourceKinds = {
  local: (source, context) => {
    const directory = path.resolve(context.root, source.path);
    return packsUnder(directory, context, `local:${toPosix(path.relative(context.root, directory)) || "."}`);
  },
};

/** The packs of every configured source, in configuration order. */
export async function resolveSources(sources: readonly ContentSource[], context: SourceContext): Promise<SourceResult> {
  const packs: PackLocation[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const source of sources) {
    const result = await SOURCE_KINDS[source.kind](source, context);
    packs.push(...result.packs);
    diagnostics.push(...result.diagnostics);
  }
  return { packs, diagnostics };
}

/**
 * Every direct child of `directory` that holds a course.toml is a pack. Children are taken in name order;
 * links are not followed.
 */
export async function packsUnder(directory: string, context: SourceContext, sourcePrefix: string): Promise<SourceResult> {
  const label = displayPath(directory, context.cwd);
  const diagnostics = new DiagnosticList(label);
  let entries;
  try {
    const info = await lstat(directory);
    if (!info.isDirectory()) {
      diagnostics.error("source", `${label} is not a folder`);
      return { packs: [], diagnostics: diagnostics.items };
    }
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    diagnostics.error(
      "source",
      errorCode(error) === "ENOENT" ? `${label} does not exist` : `${label} could not be read (${errorCode(error) ?? "error"})`,
    );
    return { packs: [], diagnostics: diagnostics.items };
  }
  const packs: PackLocation[] = [];
  for (const entry of entries.sort((a, b) => compareText(a.name, b.name))) {
    if (entry.name.startsWith(".")) continue;
    const child = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      diagnostics.warning("source", `${entry.name} is a symbolic link and is skipped; a pack must be a real folder`);
      continue;
    }
    if (!entry.isDirectory()) continue;
    try {
      const course = await lstat(path.join(child, COURSE_FILE));
      if (!course.isFile() && !course.isSymbolicLink()) continue;
    } catch {
      continue;
    }
    packs.push({ directory: child, label: displayPath(child, context.cwd), source: `${sourcePrefix}/${entry.name}` });
  }
  return { packs, diagnostics: diagnostics.items };
}

/** A path relative to `cwd` when it lies inside it, otherwise absolute; always with forward slashes. */
export function displayPath(target: string, cwd: string): string {
  const relative = path.relative(cwd, target);
  if (relative === "") return ".";
  if (relative.startsWith("..") || path.isAbsolute(relative)) return toPosix(target);
  return toPosix(relative);
}

export function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}
