/** Converts exercises of the old app into item folders, and generates course.toml. */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { parse, stringify } from "smol-toml";
import { CourseManifest, ItemManifest } from "@compass/schema";
import {
  isObject,
  obj,
  optObj,
  optStr,
  optStrList,
  readJson,
  readTrack,
  str,
  strList,
  type OldEntry,
  type OldTrack,
} from "./old.ts";
import { substitute, type SubstitutionCount } from "./substitutions.ts";

const RUNNER = "icarus-cocotb-v1";

export interface ConvertOptions {
  /** the old repository root */
  from: string;
  track: string;
  /** the pack directory to write */
  out: string;
  /** slugs to convert; "all" for every exercise of the learning path */
  slugs: string[] | "all";
}

export interface ExerciseResult {
  slug: string;
  status: "converted" | "refused" | "failed";
  message: string;
  tasks: number;
  wrong: number;
  stages: number;
  files: number;
  substitutions: SubstitutionCount[];
}

export interface ConvertResult {
  exercises: ExerciseResult[];
  items: string[];
  concepts: string[];
}

class Output {
  files = 0;
  subs: SubstitutionCount[] = [];
  private readonly root: string;
  constructor(root: string) {
    this.root = root;
  }

  private target(rel: string): string {
    const path = resolve(this.root, rel);
    if (path !== this.root && !path.startsWith(this.root + sep)) {
      throw new Error(`refusing to write outside the output directory: ${rel}`);
    }
    mkdirSync(dirname(path), { recursive: true });
    return path;
  }

  /** Copies a file byte for byte. */
  copy(source: string, rel: string): void {
    if (!existsSync(source)) throw new Error(`missing source file ${source}`);
    copyFileSync(source, this.target(rel));
    this.files++;
  }

  /** Copies a Markdown file, applying the substitution table. */
  copyMarkdown(source: string, rel: string): void {
    if (!existsSync(source)) throw new Error(`missing source file ${source}`);
    const { text, counts } = substitute(readFileSync(source, "utf8"));
    for (const c of counts) if (c.count > 0) this.subs.push({ ...c });
    writeFileSync(this.target(rel), text);
    this.files++;
  }

  text(rel: string, content: string): void {
    writeFileSync(this.target(rel), content);
    this.files++;
  }
}

function mergeSubs(all: SubstitutionCount[]): SubstitutionCount[] {
  const merged = new Map<string, SubstitutionCount>();
  for (const s of all) {
    const m = merged.get(s.from);
    if (m) m.count += s.count;
    else merged.set(s.from, { ...s });
  }
  return [...merged.values()];
}

function exerciseDir(trackDir: string, entry: OldEntry): string {
  return join(trackDir, "exercises", entry.kind, entry.slug);
}

/** Thrown for an exercise that is deliberately not converted. */
class Refusal extends Error {}

/** Replaces `[text](relative-target)` with `text`. Links to a URL or to an anchor on the same page are kept. */
export function unlinkOutsideDocuments(markdown: string): string {
  return markdown.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (link, text: string, target: string) =>
    /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target) ? link : text,
  );
}

function buildItem(
  entry: OldEntry,
  track: OldTrack,
  trackDir: string,
  out: Output,
): { manifest: ItemManifest; tasks: number; wrong: number; stages: number } {
  const dir = exerciseDir(trackDir, entry);
  if (!existsSync(dir)) throw new Error(`no exercise directory ${dir}`);
  const where = `${entry.slug}/.meta/config.json`;
  const config = readJson(join(dir, ".meta", "config.json"));
  const files = obj(config, "files", where);
  const nebula = obj(obj(config, "custom", where), "nebula", `${where} custom`);
  const runner = optStr(nebula, "runner", where);
  if (runner !== RUNNER) {
    throw new Refusal(`runner "${runner ?? "none"}" is not ${RUNNER}`);
  }

  const solution = strList(files, "solution", where)[0];
  const testFile = strList(files, "test", where)[0];
  const refSource = (optStrList(files, "exemplar", where) ?? optStrList(files, "example", where))?.[0];
  if (solution === undefined) throw new Error(`${where}: files.solution is empty`);
  if (testFile === undefined) throw new Error(`${where}: files.test is empty`);
  if (refSource === undefined) throw new Error(`${where}: no files.exemplar or files.example`);
  const support = optStrList(files, "editor", where) ?? [];
  const editable = optStrList(nebula, "editable_files", where) ?? [];
  const incorrect = optStrList(nebula, "incorrect", where) ?? [];
  const exemplarFiles = optObj(nebula, "exemplar_files", where);
  const rawTasks = nebula["tasks"];

  const base = `items/${entry.slug}`;
  const into = (rel: string) => `${base}/${rel}`;
  const design: ItemManifest["design"] = {
    top: str(nebula, "top_module", where),
    solution,
    support,
    editable,
    schematic: true,
  };
  const schematic = nebula["schematic"] ?? config["schematic"];
  if (schematic !== undefined) {
    if (typeof schematic !== "boolean") throw new Error(`${where}: schematic must be a boolean`);
    design.schematic = schematic;
  }

  const taskList: NonNullable<ItemManifest["task"]> = [];
  if (rawTasks !== undefined) {
    if (!Array.isArray(rawTasks)) throw new Error(`${where}: tasks must be a list`);
    rawTasks.forEach((t, i) => {
      if (!isObject(t)) throw new Error(`${where}: tasks[${i}] must be an object`);
      const id = t["id"];
      if (typeof id !== "number") throw new Error(`${where}: tasks[${i}].id must be a number`);
      const task: NonNullable<ItemManifest["task"]>[number] = {
        id,
        tests: strList(t, "tests", `${where} tasks[${i}]`),
      };
      const stageName = `task_${id}.v`;
      if (existsSync(join(dir, ".meta", "stages", stageName))) task.stage = stageName;
      taskList.push(task);
    });
  }

  const manifest: ItemManifest = {
    id: entry.uuid,
    title: track.displayNames[entry.slug] ?? entry.name,
    topic: entry.name,
    blurb: str(config, "blurb", where),
    kind: entry.kind,
    concepts: entry.concepts,
    ...(entry.difficulty !== undefined ? { difficulty: entry.difficulty } : {}),
    status: entry.status as ItemManifest["status"],
    design,
    checks: {
      file: basename(testFile),
      reference: basename(refSource),
      wrong: incorrect.map((p) => basename(p)),
    },
    ...(rawTasks !== undefined ? { task: taskList } : {}),
  };

  // Key order follows docs/ARCHITECTURE.md.
  const doc: Record<string, unknown> = {
    id: manifest.id,
    title: manifest.title,
    topic: manifest.topic,
    blurb: manifest.blurb,
    kind: manifest.kind,
    concepts: manifest.concepts,
  };
  if (manifest.difficulty !== undefined) doc["difficulty"] = manifest.difficulty;
  doc["status"] = manifest.status;
  const d: Record<string, unknown> = { top: design.top, solution: design.solution };
  if (support.length > 0) d["support"] = support;
  if (editable.length > 0) d["editable"] = editable;
  if (schematic !== undefined) d["schematic"] = design.schematic;
  doc["design"] = d;
  doc["checks"] = {
    file: manifest.checks.file,
    reference: manifest.checks.reference,
    wrong: manifest.checks.wrong,
  };
  if (rawTasks !== undefined) {
    doc["task"] = taskList.map((t) => ({
      id: t.id,
      tests: t.tests,
      ...(t.stage !== undefined ? { stage: t.stage } : {}),
    }));
  }
  const toml = stringify(doc);
  ItemManifest.parse(parse(toml));

  // Everything validated: now write.
  out.text(into("item.toml"), toml);
  out.copy(join(dir, solution), into(`starter/${basename(solution)}`));
  for (const s of support) out.copy(join(dir, s), into(`starter/${basename(s)}`));
  out.copy(join(dir, testFile), into(`checks/${basename(testFile)}`));
  out.copy(join(dir, refSource), into(`reference/${basename(refSource)}`));
  if (exemplarFiles) {
    for (const [name, source] of Object.entries(exemplarFiles)) {
      if (typeof source !== "string") throw new Error(`${where}: exemplar_files.${name} must be a string`);
      out.copy(join(dir, source), into(`reference/${name}`));
    }
  }
  for (const w of incorrect) out.copy(join(dir, w), into(`wrong/${basename(w)}`));
  const stagesDir = join(dir, ".meta", "stages");
  let stages = 0;
  if (existsSync(stagesDir)) {
    for (const name of readdirSync(stagesDir).sort()) {
      out.copy(join(stagesDir, name), into(`stages/${name}`));
      stages++;
    }
  }
  const docs = join(dir, ".docs");
  const intro = join(docs, "introduction.md");
  if (existsSync(intro)) out.copyMarkdown(intro, into("intro.md"));
  out.copyMarkdown(join(docs, "instructions.md"), into("instructions.md"));
  const hints = join(docs, "hints.md");
  if (existsSync(hints) && readFileSync(hints, "utf8").trim() !== "") {
    out.copyMarkdown(hints, into("hints.md"));
  }
  const design_ = join(dir, ".meta", "design.md");
  if (existsSync(design_)) out.copyMarkdown(design_, into("notes.md"));
  return { manifest, tasks: taskList.length, wrong: incorrect.length, stages };
}

export function repoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "compass.config.toml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no compass.config.toml found above ${start}`);
    dir = parent;
  }
}

const COURSE = {
  id: "sternbild/verilog",
  version: "0.1.0",
  title: "RTL design with Verilog",
  blurb: "Short exercises in synthesizable Verilog, from a constant output to handshakes and queues.",
  language: "verilog",
  environment: "code@1",
  runner: "iverilog-cocotb@1",
  circuit: "yosys-digitaljs@1",
  syllabus: "syllabus.md",
  status: "draft",
} as const;

function writeCourse(trackDir: string, repo: string, track: OldTrack, outRoot: string, out: Output): ConvertResult {
  const itemsDir = join(outRoot, "items");
  const present = new Set(
    existsSync(itemsDir)
      ? readdirSync(itemsDir).filter((n) => existsSync(join(itemsDir, n, "item.toml")))
      : [],
  );
  const slugs = track.learningPath.filter((s) => present.has(s));
  const stray = [...present].filter((s) => !track.learningPath.includes(s));
  if (stray.length > 0) throw new Error(`items not in the learning path: ${stray.join(", ")}`);
  const used = new Set<string>();
  const items = slugs.map((slug) => {
    const e = track.entries.get(slug);
    if (!e) throw new Error(`learning path names unknown exercise "${slug}"`);
    for (const c of [...e.concepts, ...e.prerequisites]) used.add(c);
    return { slug, prerequisites: e.prerequisites };
  });
  const concepts = track.concepts.filter((c) => used.has(c.slug));
  for (const c of used) {
    if (!track.concepts.some((k) => k.slug === c)) throw new Error(`concept "${c}" is not in config.json`);
  }
  const doc = {
    ...COURSE,
    editor: { indent: 4 },
    concept: concepts.map((c) => ({ slug: c.slug, name: c.name })),
    item: items,
  };
  const toml = stringify(doc);
  CourseManifest.parse(parse(toml));
  out.text("course.toml", toml);
  for (const c of concepts) {
    const src = join(trackDir, "concepts", c.slug);
    for (const f of ["introduction.md", "about.md"]) {
      out.copyMarkdown(join(src, f), `concepts/${c.slug}/${f}`);
    }
  }
  const syllabus = join(repo, "VERILOG_SYLLABUS.md");
  // The old syllabus links to planning documents at the root of the old repository. A pack is self-contained, so
  // a relative link to a document outside it keeps its text and loses its target.
  out.text("syllabus.md", unlinkOutsideDocuments(readFileSync(syllabus, "utf8")));
  return { exercises: [], items: slugs, concepts: concepts.map((c) => c.slug) };
}

export function convert(opts: ConvertOptions): ConvertResult & { substitutions: SubstitutionCount[] } {
  const repo = resolve(opts.from);
  const trackDir = join(repo, "tracks", opts.track);
  const outRoot = resolve(opts.out);
  if (outRoot === repo || outRoot.startsWith(repo + sep)) {
    throw new Error("the output directory must not be inside the old repository");
  }
  const track = readTrack(join(trackDir, "config.json"));
  const slugs = opts.slugs === "all" ? track.learningPath : opts.slugs;
  const exercises: ExerciseResult[] = [];
  const allSubs: SubstitutionCount[] = [];

  for (const slug of slugs) {
    const result: ExerciseResult = {
      slug, status: "failed", message: "", tasks: 0, wrong: 0, stages: 0, files: 0, substitutions: [],
    };
    exercises.push(result);
    const entry = track.entries.get(slug);
    if (!entry) {
      result.message = "not an exercise of this track";
      continue;
    }
    const itemDir = join(outRoot, "items", slug);
    const out = new Output(outRoot);
    try {
      // Dry run to validate and detect refusals before deleting anything.
      const staging = new Output(join(outRoot, ".staging"));
      let built;
      try {
        built = buildItem(entry, track, trackDir, staging);
      } finally {
        rmSync(join(outRoot, ".staging"), { recursive: true, force: true });
      }
      rmSync(itemDir, { recursive: true, force: true });
      built = buildItem(entry, track, trackDir, out);
      result.status = "converted";
      result.tasks = built.tasks;
      result.wrong = built.wrong;
      result.stages = built.stages;
      result.files = out.files;
      result.substitutions = mergeSubs(out.subs);
      allSubs.push(...out.subs);
      result.message = `${built.manifest.kind}, ${built.tasks} tasks, ${built.wrong} wrong, ${built.stages} stages`;
    } catch (error) {
      result.status = error instanceof Refusal ? "refused" : "failed";
      result.message = error instanceof Error ? error.message : String(error);
    }
  }

  const courseOut = new Output(outRoot);
  const course = existsSync(join(outRoot, "items"))
    ? writeCourse(trackDir, repo, track, outRoot, courseOut)
    : { exercises: [], items: [], concepts: [] };
  allSubs.push(...courseOut.subs);
  return { exercises, items: course.items, concepts: course.concepts, substitutions: mergeSubs(allSubs) };
}
