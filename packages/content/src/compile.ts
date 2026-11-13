/**
 * The index compiler: turns checked packs into the ContentIndex the web app reads. The output is deterministic:
 * the same packs give the same bytes. It holds no reference solutions, wrong solutions, stages or notes.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CONTENT_INDEX_SCHEMA,
  ContentIndex,
  splitCourseId,
  type CourseManifest,
  type IndexedConcept,
  type IndexedCourse,
  type IndexedItem,
  type IndexedTask,
} from "@compass/schema";
import { issueText } from "./diagnostics.ts";
import { compareText } from "./files.ts";
import type { LoadedItem, LoadedPack } from "./loader.ts";
import { splitItemText } from "./markdown.ts";

export class CompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompileError";
  }
}

/** Version of the revision recipe below; changing the recipe changes every revision. */
const REVISION_FORMAT = 1;

/**
 * The item's revision: SHA-256 over everything in the item that affects a run or what the learner reads.
 * That is the item's text and manifest fields shown to the learner, its design and task map, its starter files,
 * its checks file and the course's test runner. The slug (progress is keyed by the id), status, difficulty,
 * prerequisites, reference, wrong solutions, stages and notes do not enter it.
 */
export function itemRevision(course: Pick<CourseManifest, "runner">, item: LoadedItem): string {
  const manifest = item.manifest;
  if (!manifest || !item.checks || item.instructions === undefined)
    throw new CompileError(`${item.path}: the item is incomplete and has no revision`);
  const material = {
    format: REVISION_FORMAT,
    runner: course.runner,
    item: {
      id: manifest.id,
      title: manifest.title,
      topic: manifest.topic ?? null,
      blurb: manifest.blurb,
      kind: manifest.kind,
      concepts: manifest.concepts,
      design: manifest.design,
      tasks: (manifest.task ?? []).map((task) => ({ id: task.id, tests: task.tests })),
    },
    text: { intro: item.intro ?? null, instructions: item.instructions, hints: item.hints ?? null },
    starter: sortedEntries(item.starter),
    checks: [item.checks.name, item.checks.content],
  };
  return createHash("sha256").update(canonicalJson(material)).digest("hex");
}

/** JSON with object keys in code-point order at every level. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => compareText(a, b))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  return value;
}

function sortedEntries(map: ReadonlyMap<string, string>): [string, string][] {
  return [...map.entries()].sort(([a], [b]) => compareText(a, b));
}

function optionalText(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  return trimmed ? trimmed : undefined;
}

/** Copies the defined fields only, so absent optional fields leave no key behind. */
function defined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export function compileItem(course: CourseManifest, item: LoadedItem): IndexedItem {
  const manifest = item.manifest;
  if (!manifest || !item.checks || item.instructions === undefined)
    throw new CompileError(`${item.path}: the item has errors and cannot be compiled`);
  const tasks = manifest.task ?? [];
  const text = splitItemText(item.instructions, item.hints, tasks.map((task) => task.id));
  const indexedTasks: IndexedTask[] = tasks.map((task, index) => {
    const split = text.tasks[index];
    return defined({
      id: task.id,
      title: split?.title ?? `Task ${task.id}`,
      instructions: split?.instructions ?? "",
      hints: split?.hints,
      tests: [...task.tests],
    });
  });
  const starterNames = [manifest.design.solution, ...manifest.design.support];
  const starter: [string, string][] = [];
  for (const name of [...new Set(starterNames)].sort(compareText)) {
    const content = item.starter.get(name);
    if (content === undefined) throw new CompileError(`${item.path}: starter/${name} was not read`);
    starter.push([name, content]);
  }
  return defined({
    id: manifest.id,
    slug: item.slug,
    title: manifest.title,
    topic: manifest.topic,
    blurb: manifest.blurb,
    kind: manifest.kind,
    concepts: [...manifest.concepts],
    prerequisites: [...item.prerequisites],
    difficulty: manifest.difficulty,
    status: manifest.status,
    revision: itemRevision(course, item),
    intro: optionalText(item.intro),
    instructions: text.instructions,
    hints: text.hints,
    tasks: indexedTasks,
    design: {
      top: manifest.design.top,
      solution: manifest.design.solution,
      support: [...manifest.design.support],
      editable: [...manifest.design.editable],
      schematic: manifest.design.schematic,
    },
    starter: Object.fromEntries(starter),
    checks: { name: item.checks.name, content: item.checks.content },
  });
}

export function compileCourse(pack: LoadedPack): IndexedCourse {
  const manifest = pack.manifest;
  if (!manifest) throw new CompileError(`${pack.location.label}: course.toml has errors and cannot be compiled`);
  const { namespace, name } = splitCourseId(manifest.id);
  const concepts: IndexedConcept[] = pack.concepts.map((concept) =>
    defined({
      slug: concept.slug,
      name: concept.name,
      introduction: optionalText(concept.introduction),
      about: optionalText(concept.about),
    }),
  );
  return defined({
    id: manifest.id,
    namespace,
    name,
    version: manifest.version,
    title: manifest.title,
    blurb: manifest.blurb,
    language: manifest.language,
    environment: manifest.environment,
    runner: manifest.runner,
    circuit: manifest.circuit,
    status: manifest.status,
    editor: { indent: manifest.editor.indent },
    syllabus: optionalText(pack.syllabus),
    source: pack.location.source,
    concepts,
    items: pack.items.map((item) => compileItem(manifest, item)),
  });
}

/** The content index of the packs, courses in id order, validated against the schema. */
export function compileIndex(packs: readonly LoadedPack[]): ContentIndex {
  const courses = packs.map(compileCourse).sort((a, b) => compareText(a.id, b.id));
  const index: ContentIndex = { schema: CONTENT_INDEX_SCHEMA, courses };
  const checked = ContentIndex.safeParse(index);
  if (!checked.success)
    throw new CompileError(`the compiled index does not match the schema: ${checked.error.issues.map(issueText).join("; ")}`);
  return index;
}

/** The index as written to disk: two-space JSON with a final newline. */
export function serializeIndex(index: ContentIndex): string {
  return `${JSON.stringify(index, null, 2)}\n`;
}

/** Writes the file through a temporary file in the same folder and a rename, so readers never see half a file. */
export async function writeFileAtomic(target: string, content: string): Promise<void> {
  const directory = path.dirname(target);
  await mkdir(directory, { recursive: true });
  const temporary = path.join(directory, `.${path.basename(target)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function writeIndex(target: string, index: ContentIndex): Promise<void> {
  await writeFileAtomic(target, serializeIndex(index));
}
