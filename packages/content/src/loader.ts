/**
 * The pack loader: reads course.toml, every item and the concept pages into a typed pack. Problems are
 * collected as diagnostics with their location; the loader never stops at the first one.
 */
import { parse } from "smol-toml";
import { CourseManifest, ItemManifest } from "@compass/schema";
import { tomlMessage } from "./config.ts";
import { DiagnosticList, issueText, type Diagnostic, type Place, type SchemaIssue } from "./diagnostics.ts";
import { LIMITS, formatBytes, listPackDirectory, readPackFile } from "./files.ts";
import { COURSE_FILE, type PackLocation } from "./sources.ts";

export type LoadedConcept = {
  slug: string;
  name: string;
  /** Whether concepts/<slug>/ exists. */
  hasDirectory: boolean;
  introduction?: string;
  about?: string;
};

export type CheckFile = { name: string; content: string };

export type LoadedItem = {
  slug: string;
  /** `items/<slug>`, relative to the pack. */
  path: string;
  /** The item's place in the course list, from 0. */
  position: number;
  /** From the item's entry in course.toml. */
  prerequisites: string[];
  /** Undefined when item.toml is missing or invalid. */
  manifest?: ItemManifest;
  intro?: string;
  instructions?: string;
  hints?: string;
  notes?: string;
  /** starter/: the solution file and every support file, by name. */
  starter: Map<string, string>;
  checks?: CheckFile;
  /** reference/: the reference solution and the reference of each editable support file, by name. */
  reference: Map<string, string>;
  wrong: Map<string, string>;
  stages: Map<string, string>;
};

export type MarkdownFile = { file: string; item?: string; content: string };

export type LoadedPack = {
  location: PackLocation;
  /** Undefined when course.toml is missing or invalid. */
  manifest?: CourseManifest;
  syllabus?: string;
  /** In the order course.toml declares them. */
  concepts: LoadedConcept[];
  /** The folder names under concepts/. */
  conceptDirectories: string[];
  /** In course order; an item listed twice is loaded once. */
  items: LoadedItem[];
  /** Every Markdown file read, for the link rule. */
  markdown: MarkdownFile[];
  diagnostics: Diagnostic[];
};

type Schema<T> = {
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: { issues: readonly SchemaIssue[] } };
};

/** The fixed entries of an item folder. */
const ITEM_ENTRIES = new Set([
  "item.toml",
  "intro.md",
  "instructions.md",
  "hints.md",
  "notes.md",
  "starter",
  "checks",
  "reference",
  "wrong",
  "stages",
]);

/** The name of a pack before its manifest is read: its folder. */
export function packName(pack: LoadedPack): string {
  return pack.manifest?.id ?? pack.location.label;
}

export async function loadPack(location: PackLocation): Promise<LoadedPack> {
  const reader = new PackReader(location);
  return reader.load();
}

export async function loadPacks(locations: readonly PackLocation[]): Promise<LoadedPack[]> {
  const packs: LoadedPack[] = [];
  for (const location of locations) packs.push(await loadPack(location));
  return packs;
}

class PackReader {
  private readonly list: DiagnosticList;
  private bytes = 0;
  private overBudget = false;
  private readonly markdown: MarkdownFile[] = [];

  constructor(private readonly location: PackLocation) {
    this.list = new DiagnosticList(location.label);
  }

  async load(): Promise<LoadedPack> {
    const pack: LoadedPack = {
      location: this.location,
      concepts: [],
      conceptDirectories: [],
      items: [],
      markdown: this.markdown,
      diagnostics: this.list.items,
    };
    const manifest = await this.readManifest(COURSE_FILE, CourseManifest, {});
    if (!manifest) return pack;
    pack.manifest = manifest;
    if (manifest.syllabus !== undefined)
      pack.syllabus = await this.readMarkdown(manifest.syllabus, {}, { namedBy: "syllabus", in: COURSE_FILE });
    await this.loadConcepts(pack, manifest);
    await this.loadItems(pack, manifest);
    return pack;
  }

  private async loadConcepts(pack: LoadedPack, manifest: CourseManifest): Promise<void> {
    const listing = await listPackDirectory(this.location.directory, "concepts");
    if (!listing.ok) this.list.error("files", listing.message, { file: "concepts" });
    const directories = new Set<string>();
    for (const entry of (listing.ok && listing.entries) || []) {
      if (entry.kind === "symlink")
        this.list.error("files", `concepts/${entry.name} is a symbolic link; packs may not contain links`, {
          file: `concepts/${entry.name}`,
        });
      else if (entry.kind === "directory") directories.add(entry.name);
    }
    pack.conceptDirectories = [...directories];
    const seen = new Set<string>();
    for (const declared of manifest.concept) {
      if (seen.has(declared.slug)) continue;
      seen.add(declared.slug);
      const concept: LoadedConcept = { slug: declared.slug, name: declared.name, hasDirectory: directories.has(declared.slug) };
      if (concept.hasDirectory) {
        const introduction = await this.readMarkdown(`concepts/${declared.slug}/introduction.md`, {});
        const about = await this.readMarkdown(`concepts/${declared.slug}/about.md`, {});
        if (introduction !== undefined) concept.introduction = introduction;
        if (about !== undefined) concept.about = about;
      }
      pack.concepts.push(concept);
    }
  }

  private async loadItems(pack: LoadedPack, manifest: CourseManifest): Promise<void> {
    const listing = await listPackDirectory(this.location.directory, "items");
    if (!listing.ok) this.list.error("files", listing.message, { file: "items" });
    const listed = new Set(manifest.item.map((entry) => entry.slug));
    for (const entry of (listing.ok && listing.entries) || []) {
      const file = `items/${entry.name}`;
      if (entry.kind === "symlink")
        this.list.error("files", `${file} is a symbolic link; packs may not contain links`, { file });
      else if (entry.kind === "directory" && !listed.has(entry.name))
        this.list.warning("files", `${file} is not listed in course.toml, so it is not part of the course`, { file });
    }
    const loaded = new Set<string>();
    for (const [position, entry] of manifest.item.entries()) {
      if (loaded.has(entry.slug)) continue;
      loaded.add(entry.slug);
      pack.items.push(await this.loadItem(entry.slug, position, entry.prerequisites));
    }
  }

  private async loadItem(slug: string, position: number, prerequisites: string[]): Promise<LoadedItem> {
    const base = `items/${slug}`;
    const at: Place = { item: slug };
    const item: LoadedItem = {
      slug,
      path: base,
      position,
      prerequisites,
      starter: new Map(),
      reference: new Map(),
      wrong: new Map(),
      stages: new Map(),
    };
    const listing = await listPackDirectory(this.location.directory, base);
    if (!listing.ok) {
      this.list.error("files", listing.message, { ...at, file: base });
      return item;
    }
    if (!listing.entries) {
      this.list.error("files", `${base} does not exist; course.toml lists the item ${slug}`, { ...at, file: COURSE_FILE });
      return item;
    }
    for (const entry of listing.entries) {
      const file = `${base}/${entry.name}`;
      if (entry.kind === "symlink")
        this.list.error("files", `${file} is a symbolic link; packs may not contain links`, { ...at, file });
      else if (!ITEM_ENTRIES.has(entry.name))
        this.list.warning("files", `${file} is not part of the item format and is ignored`, { ...at, file });
    }

    const manifest = await this.readManifest(`${base}/item.toml`, ItemManifest, at);
    if (manifest) item.manifest = manifest;
    const intro = await this.readMarkdown(`${base}/intro.md`, at);
    const instructions = await this.readMarkdown(`${base}/instructions.md`, at, { required: true });
    const hints = await this.readMarkdown(`${base}/hints.md`, at);
    const notes = await this.readMarkdown(`${base}/notes.md`, at);
    if (intro !== undefined) item.intro = intro;
    if (instructions !== undefined) item.instructions = instructions;
    if (hints !== undefined) item.hints = hints;
    if (notes !== undefined) item.notes = notes;
    if (!manifest) return item;

    const named = (field: string) => ({ namedBy: field, in: `${base}/item.toml` });
    const { design, checks } = manifest;
    for (const [field, names] of [
      ["design.solution", [design.solution]],
      ["design.support", design.support],
    ] as const) {
      for (const name of names) {
        const content = await this.readText(`${base}/starter/${name}`, LIMITS.sourceBytes, at, named(field));
        if (content !== undefined) item.starter.set(name, content);
      }
    }
    const checksContent = await this.readText(`${base}/checks/${checks.file}`, LIMITS.checksBytes, at, named("checks.file"));
    if (checksContent !== undefined) item.checks = { name: checks.file, content: checksContent };
    for (const [field, name] of [
      ["checks.reference", checks.reference] as const,
      ...design.editable.map((name) => ["design.editable", name] as const),
    ]) {
      const content = await this.readText(`${base}/reference/${name}`, LIMITS.sourceBytes, at, named(field));
      if (content !== undefined) item.reference.set(name, content);
    }
    for (const name of checks.wrong) {
      const content = await this.readText(`${base}/wrong/${name}`, LIMITS.sourceBytes, at, named("checks.wrong"));
      if (content !== undefined) item.wrong.set(name, content);
    }
    for (const task of manifest.task ?? []) {
      if (task.stage === undefined) continue;
      const content = await this.readText(`${base}/stages/${task.stage}`, LIMITS.sourceBytes, at, named(`task ${task.id} stage`));
      if (content !== undefined) item.stages.set(task.stage, content);
    }

    await this.warnUnnamed(base, "starter", new Set([design.solution, ...design.support]), at);
    await this.warnUnnamed(base, "checks", new Set([checks.file]), at);
    await this.warnUnnamed(base, "reference", new Set([checks.reference, ...design.editable]), at);
    await this.warnUnnamed(base, "wrong", new Set(checks.wrong), at);
    await this.warnUnnamed(
      base,
      "stages",
      new Set((manifest.task ?? []).flatMap((task) => (task.stage === undefined ? [] : [task.stage]))),
      at,
    );
    return item;
  }

  /** Warns about files in an item folder that item.toml does not name; links are errors. */
  private async warnUnnamed(base: string, folder: string, names: ReadonlySet<string>, at: Place): Promise<void> {
    const relative = `${base}/${folder}`;
    const listing = await listPackDirectory(this.location.directory, relative);
    if (!listing.ok) {
      this.list.error("files", listing.message, { ...at, file: relative });
      return;
    }
    for (const entry of listing.entries ?? []) {
      const file = `${relative}/${entry.name}`;
      if (entry.kind === "symlink")
        this.list.error("files", `${file} is a symbolic link; packs may not contain links`, { ...at, file });
      else if (!names.has(entry.name) && entry.name !== ".gitkeep" && entry.name !== ".DS_Store")
        this.list.warning("files", `${file} is not named in item.toml and is not used`, { ...at, file });
    }
  }

  private async readManifest<T>(
    file: string,
    schema: Schema<T>,
    at: Place,
  ): Promise<T | undefined> {
    const text = await this.readText(file, LIMITS.manifestBytes, at, { required: true });
    if (text === undefined) return undefined;
    let raw: unknown;
    try {
      raw = parse(text);
    } catch (error) {
      this.list.error("manifest", `not valid TOML: ${tomlMessage(error)}`, { ...at, file });
      return undefined;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) this.list.error("manifest", issueText(issue), { ...at, file });
      return undefined;
    }
    return parsed.data;
  }

  private async readMarkdown(
    file: string,
    at: Place,
    options: { required?: boolean; namedBy?: string; in?: string } = {},
  ): Promise<string | undefined> {
    const content = await this.readText(file, LIMITS.markdownBytes, at, options);
    if (content !== undefined) this.markdown.push({ file, ...(at.item ? { item: at.item } : {}), content });
    return content;
  }

  /**
   * Reads a text file of the pack. A missing file is an error only when it is required or a manifest names it;
   * the error then points at the manifest.
   */
  private async readText(
    file: string,
    maxBytes: number,
    at: Place,
    options: { required?: boolean; namedBy?: string; in?: string } = {},
  ): Promise<string | undefined> {
    const result = await readPackFile(this.location.directory, file, maxBytes);
    if (result.ok) {
      this.bytes += result.bytes;
      if (this.bytes > LIMITS.packBytes && !this.overBudget) {
        this.overBudget = true;
        this.list.error("files", `the pack holds more than ${formatBytes(LIMITS.packBytes)} of files`, {});
      }
      return result.content;
    }
    if (result.failure === "missing") {
      const prefix = at.item === undefined ? "" : `items/${at.item}/`;
      const shown = file.startsWith(prefix) ? file.slice(prefix.length) : file;
      if (options.namedBy !== undefined)
        this.list.error("files", `${options.namedBy} names ${shown}, which does not exist`, { ...at, file: options.in ?? file });
      else if (options.required) this.list.error("files", `${file} is required and does not exist`, { ...at, file });
      return undefined;
    }
    this.list.error("files", result.message, { ...at, file });
    return undefined;
  }
}
