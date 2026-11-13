/**
 * The static checks of `compass content check`. They need no runner and never run pack code.
 * The loader already reports the `manifest` and `files` rules; the rules here check what the files say.
 */
import {
  CATEGORY_ICON_FILE,
  ENVIRONMENT_KINDS,
  ICON_FILE,
  RUNNER_KINDS,
  SOURCE_LIMITS,
  isCircuitRunnerKind,
  isEnvironmentKind,
  isRunnerKind,
  isTestRunnerKind,
  type CourseManifest,
  type ItemManifest,
} from "@compass/schema";
import path from "node:path";
import { DiagnosticList, type Diagnostic } from "./diagnostics.ts";
import { packEntryKind } from "./files.ts";
import { checkIcon } from "./icons.ts";
import type { LoadedItem, LoadedPack } from "./loader.ts";
import { findLinks, isRelativeLink, linkPath, splitSections } from "./markdown.ts";
import { findCocotbTests } from "./python.ts";

type Context = { pack: LoadedPack; manifest: CourseManifest; list: DiagnosticList };

type StaticRule = (context: Context) => void | Promise<void>;

/** The rules, in the order their diagnostics are reported. */
export const STATIC_RULES: readonly { name: string; run: StaticRule }[] = [
  { name: "ids", run: checkIds },
  { name: "kinds", run: checkKinds },
  { name: "plan", run: checkPlan },
  { name: "design", run: checkDesigns },
  { name: "concepts", run: checkConcepts },
  { name: "prerequisites", run: checkPrerequisites },
  { name: "tasks", run: checkTasks },
  { name: "links", run: checkLinks },
  { name: "icons", run: checkIcons },
];

/** Every diagnostic of one pack: the loader's, then each rule's. */
export async function checkPack(pack: LoadedPack): Promise<Diagnostic[]> {
  const list = new DiagnosticList(pack.location.label);
  if (pack.manifest) {
    const context: Context = { pack, manifest: pack.manifest, list };
    for (const rule of STATIC_RULES) await rule.run(context);
  }
  return [...pack.diagnostics, ...list.items];
}

/**
 * Checks that span packs: each course id names one pack, and packs that name the same category agree on its title.
 */
export function checkAcrossPacks(packs: readonly LoadedPack[]): Diagnostic[] {
  const byId = new Map<string, LoadedPack[]>();
  for (const pack of packs) {
    if (!pack.manifest) continue;
    byId.set(pack.manifest.id, [...(byId.get(pack.manifest.id) ?? []), pack]);
  }
  const diagnostics: Diagnostic[] = [];
  for (const [id, group] of byId) {
    if (group.length < 2) continue;
    for (const pack of group) {
      const others = group.filter((other) => other !== pack).map((other) => other.location.label);
      const list = new DiagnosticList(pack.location.label);
      list.error("ids", `the course id ${id} is also used by ${others.join(", ")}`, { file: "course.toml" });
      diagnostics.push(...list.items);
    }
  }
  const byCategory = new Map<string, LoadedPack[]>();
  for (const pack of packs) {
    const category = pack.manifest?.category;
    if (category) byCategory.set(category.id, [...(byCategory.get(category.id) ?? []), pack]);
  }
  for (const [id, group] of byCategory) {
    for (const pack of group) {
      const title = pack.manifest?.category?.title;
      const disagreeing = group.filter((other) => other.manifest?.category?.title !== title);
      if (disagreeing.length === 0) continue;
      const list = new DiagnosticList(pack.location.label);
      const others = disagreeing.map((other) => `"${other.manifest?.category?.title}" in ${other.location.label}`);
      list.error("ids", `the category ${id} has the title "${title}" here but ${others.join(", ")}`, { file: "course.toml" });
      diagnostics.push(...list.items);
    }
  }
  return diagnostics;
}

function itemFile(item: LoadedItem, name: string): { item: string; file: string } {
  return { item: item.slug, file: `${item.path}/${name}` };
}

function withManifest(pack: LoadedPack): { item: LoadedItem; manifest: ItemManifest }[] {
  return pack.items.flatMap((item) => (item.manifest ? [{ item, manifest: item.manifest }] : []));
}

function duplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const repeated = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/** Item slugs and concept slugs are unique in course.toml; item ids are unique in the pack. */
function checkIds({ pack, manifest, list }: Context): void {
  for (const slug of duplicates(manifest.item.map((entry) => entry.slug)))
    list.error("ids", `the item ${slug} is listed more than once`, { file: "course.toml" });
  for (const slug of duplicates(manifest.concept.map((concept) => concept.slug)))
    list.error("ids", `the concept ${slug} is declared more than once`, { file: "course.toml" });
  const owners = new Map<string, string>();
  for (const { item, manifest: itemManifest } of withManifest(pack)) {
    const owner = owners.get(itemManifest.id);
    if (owner !== undefined)
      list.error("ids", `the item id ${itemManifest.id} is also the id of ${owner}`, itemFile(item, "item.toml"));
    else owners.set(itemManifest.id, item.slug);
  }
}

/**
 * The environment, runner and circuit runner are kinds this installation knows, of the right purpose, and the
 * runners accept the course's language. A draft or published course needs an environment and a runner; a course in
 * development may leave them out, but a kind it names must still be known.
 */
function checkKinds({ manifest, list }: Context): void {
  const at = { file: "course.toml" };
  const planOnly = manifest.status === "in-development";
  const testKinds = Object.keys(RUNNER_KINDS).filter(isTestRunnerKind);
  const circuitKinds = Object.keys(RUNNER_KINDS).filter(isCircuitRunnerKind);
  if (manifest.environment === undefined) {
    if (!planOnly)
      list.error("kinds", `environment is required for a ${manifest.status} course; known: ${Object.keys(ENVIRONMENT_KINDS).join(", ")}`, at);
  } else if (!isEnvironmentKind(manifest.environment))
    list.error("kinds", `environment ${manifest.environment} is not known; known: ${Object.keys(ENVIRONMENT_KINDS).join(", ")}`, at);
  if (manifest.runner === undefined) {
    if (!planOnly) list.error("kinds", `runner is required for a ${manifest.status} course; known test runners: ${testKinds.join(", ")}`, at);
  } else checkRunner(manifest.runner, "runner", "test", testKinds, manifest.language, list);
  if (manifest.circuit !== undefined) checkRunner(manifest.circuit, "circuit", "circuit", circuitKinds, manifest.language, list);
}

function checkRunner(
  kind: string,
  field: "runner" | "circuit",
  purpose: "test" | "circuit",
  known: readonly string[],
  language: string,
  list: DiagnosticList,
): void {
  const at = { file: "course.toml" };
  if (!isRunnerKind(kind)) list.error("kinds", `${field} ${kind} is not known; known ${purpose} runners: ${known.join(", ")}`, at);
  else if (RUNNER_KINDS[kind].purpose !== purpose)
    list.error("kinds", `${field} ${kind} is a ${RUNNER_KINDS[kind].purpose} runner, not a ${purpose} runner`, at);
  else if (!(RUNNER_KINDS[kind].languages as readonly string[]).includes(language))
    list.error("kinds", `${field} ${kind} does not accept the language ${language}`, at);
}

/**
 * A draft or published course lists at least one item. A course in development has no [[item]] and no items/
 * folder. For any course, stage ids and planned slugs are unique, a planned stage is declared, and a planned slug
 * is not also an item.
 */
function checkPlan({ pack, manifest, list }: Context): void {
  const at = { file: "course.toml" };
  if (manifest.status === "in-development") {
    if (manifest.item.length > 0)
      list.error("plan", `a course in development has no [[item]]; this one lists ${manifest.item.length}`, at);
    if (pack.hasItemsDirectory)
      list.error("plan", "a course in development has no items/ folder", { file: "items" });
  } else if (manifest.item.length === 0)
    list.error("plan", `a ${manifest.status} course lists at least one [[item]]; only a course in development has none`, at);
  for (const id of duplicates(manifest.stage.map((stage) => stage.id)))
    list.error("plan", `the stage ${id} is declared more than once`, at);
  for (const slug of duplicates(manifest.planned.map((planned) => planned.slug)))
    list.error("plan", `the planned exercise ${slug} is listed more than once`, at);
  const stages = new Set(manifest.stage.map((stage) => stage.id));
  const items = new Set(manifest.item.map((item) => item.slug));
  for (const planned of manifest.planned) {
    if (planned.stage !== undefined && !stages.has(planned.stage))
      list.error("plan", `the planned exercise ${planned.slug} names the stage ${planned.stage}, which is not declared`, at);
    if (items.has(planned.slug))
      list.error("plan", `the planned exercise ${planned.slug} is also an item`, at);
  }
}

/** The file roles of each item are distinct and fit in one runner job. */
function checkDesigns({ pack, list }: Context): void {
  for (const { item, manifest } of withManifest(pack)) {
    const at = itemFile(item, "item.toml");
    const { design, checks } = manifest;
    if (design.support.includes(design.solution))
      list.error("design", `design.support lists the solution file ${design.solution}`, at);
    for (const name of duplicates(design.support)) list.error("design", `design.support lists ${name} more than once`, at);
    for (const name of duplicates(design.editable)) list.error("design", `design.editable lists ${name} more than once`, at);
    for (const name of design.editable)
      if (!design.support.includes(name))
        list.error("design", `design.editable lists ${name}, which is not in design.support`, at);
    if (design.solution === checks.file || design.support.includes(checks.file))
      list.error("design", `the checks file ${checks.file} has the same name as a starter file`, at);
    if (checks.reference !== design.solution && design.editable.includes(checks.reference))
      list.error("design", `checks.reference ${checks.reference} has the name of an editable support file`, at);
    for (const name of duplicates(checks.wrong)) list.error("design", `checks.wrong lists ${name} more than once`, at);
    const files = 1 + new Set(design.support).size;
    if (files > SOURCE_LIMITS.files)
      list.error("design", `the item has ${files} starter files; a run carries at most ${SOURCE_LIMITS.files}`, at);
  }
}

/**
 * Every concept an item names is declared; every declared concept with a folder has both pages.
 * Undeclared concept folders and concepts that no concept item teaches are warnings.
 */
function checkConcepts({ pack, manifest, list }: Context): void {
  const declared = new Set(manifest.concept.map((concept) => concept.slug));
  for (const { item, manifest: itemManifest } of withManifest(pack))
    for (const concept of itemManifest.concepts)
      if (!declared.has(concept))
        list.error("concepts", `the concept ${concept} is not declared in course.toml`, itemFile(item, "item.toml"));
  for (const concept of pack.concepts) {
    if (!concept.hasDirectory) continue;
    for (const [page, content] of [
      ["introduction.md", concept.introduction],
      ["about.md", concept.about],
    ] as const)
      if (content === undefined)
        list.error("concepts", `the concept ${concept.slug} has a folder but no ${page}`, { file: `concepts/${concept.slug}` });
      else if (!content.trim())
        list.error("concepts", `concepts/${concept.slug}/${page} is empty`, { file: `concepts/${concept.slug}/${page}` });
  }
  for (const directory of pack.conceptDirectories)
    if (!declared.has(directory))
      list.warning("concepts", `concepts/${directory} is not a concept declared in course.toml`, { file: `concepts/${directory}` });
  const taught = new Set(
    withManifest(pack).flatMap(({ manifest: itemManifest }) => (itemManifest.kind === "concept" ? itemManifest.concepts : [])),
  );
  if (manifest.status === "in-development") return;
  for (const concept of manifest.concept)
    if (!taught.has(concept.slug) && pack.items.every((item) => item.manifest))
      list.warning("concepts", `the concept ${concept.slug} is declared but no concept item teaches it`, { file: "course.toml" });
}

/**
 * Every prerequisite is a declared concept, taught by a concept item earlier in the list. In a draft pack a
 * prerequisite not yet taught is a warning, so a course can be converted a few exercises at a time.
 */
function checkPrerequisites({ pack, manifest, list }: Context): void {
  const declared = new Set(manifest.concept.map((concept) => concept.slug));
  const taught = new Set<string>();
  const severity = manifest.status === "draft" ? "warning" : "error";
  for (const item of pack.items) {
    for (const prerequisite of item.prerequisites) {
      if (!declared.has(prerequisite))
        list.error("prerequisites", `the item ${item.slug} requires ${prerequisite}, which is not a declared concept`, {
          item: item.slug,
          file: "course.toml",
        });
      else if (!taught.has(prerequisite))
        list.add(
          severity,
          "prerequisites",
          `the item ${item.slug} requires ${prerequisite}, which no concept item before it teaches`,
          { item: item.slug, file: "course.toml" },
        );
    }
    if (item.manifest?.kind === "concept") for (const concept of item.manifest.concepts) taught.add(concept);
  }
}

/**
 * Task ids run from 1; the headings of instructions.md match them; hints.md headings name existing tasks once.
 * Every test in the checks file is mapped to exactly one task, and every mapped test exists.
 */
function checkTasks({ pack, list }: Context): void {
  for (const { item, manifest } of withManifest(pack)) {
    const at = itemFile(item, "item.toml");
    const tasks = manifest.task ?? [];
    tasks.forEach((task, index) => {
      if (task.id !== index + 1)
        list.error("tasks", `task ids must run 1, 2, 3 in order; task ${index + 1} has the id ${task.id}`, at);
    });
    const ids = tasks.map((task) => task.id);

    if (item.instructions !== undefined) {
      const file = itemFile(item, "instructions.md");
      const { sections } = splitSections(item.instructions);
      if (tasks.length === 0 && sections.length > 0)
        list.error("tasks", `instructions.md has task headings (## ${sections[0]?.id}. …) but item.toml has no [[task]]`, file);
      else if (tasks.length > 0) {
        const headings = sections.map((section) => section.id);
        if (headings.join(",") !== ids.join(","))
          list.error(
            "tasks",
            `the task headings are ${headings.length ? headings.map((id) => `## ${id}.`).join(", ") : "missing"}; item.toml declares tasks ${ids.join(", ")}`,
            file,
          );
        for (const section of sections)
          if (!section.text) list.error("tasks", `task ${section.id} (line ${section.line}) has a heading but no text`, file);
      }
      if (!item.instructions.trim()) list.error("tasks", "instructions.md is empty", file);
    }

    if (item.hints !== undefined && tasks.length > 0) {
      const file = itemFile(item, "hints.md");
      const seen = new Set<number>();
      for (const section of splitSections(item.hints).sections) {
        if (!ids.includes(section.id))
          list.error("tasks", `the hint heading ## ${section.id}. (line ${section.line}) names no task`, file);
        else if (seen.has(section.id))
          list.error("tasks", `the hints for task ${section.id} appear more than once (line ${section.line})`, file);
        seen.add(section.id);
      }
    }

    if (!item.checks) continue;
    const file = itemFile(item, `checks/${item.checks.name}`);
    const scan = findCocotbTests(item.checks.content);
    for (const problem of scan.problems) list.error("tasks", problem.message, file);
    const defined = new Map<string, number>();
    for (const test of scan.tests) {
      if (defined.has(test.name))
        list.error("tasks", `the test ${test.name} is defined twice (lines ${defined.get(test.name)} and ${test.line})`, file);
      else defined.set(test.name, test.line);
    }
    if (scan.tests.length === 0) {
      list.error("tasks", "the checks file defines no test (an async def under @cocotb.test())", file);
      continue;
    }
    if (tasks.length === 0) continue;
    const mappedBy = new Map<string, number[]>();
    for (const task of tasks)
      for (const test of task.tests) mappedBy.set(test, [...(mappedBy.get(test) ?? []), task.id]);
    for (const [test, owners] of mappedBy) {
      if (owners.length > 1)
        list.error("tasks", `the test ${test} is mapped more than once (tasks ${owners.join(", ")})`, at);
      if (!defined.has(test))
        list.error("tasks", `task ${owners[0]} names the test ${test}, which ${item.checks.name} does not define`, at);
    }
    for (const [test, line] of defined)
      if (!mappedBy.has(test)) list.error("tasks", `the test ${test} (line ${line}) is not mapped to a task`, file);
  }
}

/** Relative links in the Markdown files resolve to a file or folder inside the pack. */
async function checkLinks({ pack, list }: Context): Promise<void> {
  for (const markdown of pack.markdown) {
    const at = { ...(markdown.item ? { item: markdown.item } : {}), file: markdown.file };
    for (const link of findLinks(markdown.content)) {
      if (!isRelativeLink(link.target)) continue;
      const target = linkPath(link.target);
      if (target === "") continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(markdown.file), target));
      if (resolved === ".." || resolved.startsWith("../")) {
        list.error("links", `the link ${link.target} (line ${link.line}) leaves the pack`, at);
        continue;
      }
      const relative = resolved.replace(/\/+$/, "");
      const kind = relative === "." || relative === "" ? "directory" : await packEntryKind(pack.location.directory, relative);
      if (kind === "missing" || kind === "invalid")
        list.error(
          "links",
          relative === target
            ? `the link ${link.target} (line ${link.line}) names a file the pack does not have`
            : `the link ${link.target} (line ${link.line}) points to ${relative}, which the pack does not have`,
          at,
        );
      else if (kind === "symlink")
        list.error("links", `the link ${link.target} (line ${link.line}) passes through a symbolic link`, at);
    }
  }
}

/**
 * Each icon is an SVG with a square viewBox and nothing active or external in it. See "Icons" in
 * docs/ARCHITECTURE.md and src/icons.ts.
 */
function checkIcons({ pack, list }: Context): void {
  const icons: { content: string; file: string; item?: string }[] = [];
  if (pack.icon !== undefined) icons.push({ content: pack.icon, file: ICON_FILE });
  if (pack.categoryIcon !== undefined) icons.push({ content: pack.categoryIcon, file: CATEGORY_ICON_FILE });
  for (const item of pack.items)
    if (item.icon !== undefined) icons.push({ content: item.icon, file: `${item.path}/${ICON_FILE}`, item: item.slug });
  for (const icon of icons)
    for (const problem of checkIcon(icon.content)) {
      const message = problem.line === undefined ? problem.message : `${problem.message} (line ${problem.line})`;
      list.add(problem.warning ? "warning" : "error", "icons", message, {
        ...(icon.item === undefined ? {} : { item: icon.item }),
        file: icon.file,
      });
    }
}
