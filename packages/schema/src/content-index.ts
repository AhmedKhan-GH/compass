/** The compiled content index: the only form of content the web app reads. */
import { z } from "zod";
import { CourseId, FileName, Identifier, Kind, Semver, Slug, Uuid } from "./ids.ts";
import { CourseStatus, ItemKind, ItemStatus } from "./pack.ts";

export const CONTENT_INDEX_SCHEMA = 1;
export const DEFAULT_CONTENT_INDEX_PATH = ".compass/content-index.json";

/** The directory of static assets written beside the index file. */
export const CONTENT_ASSETS_DIRECTORY = "content-assets";
/** An asset in that directory, named by the SHA-256 of its bytes. */
export const ASSET_NAME_PATTERN = /^[0-9a-f]{64}\.svg$/;
export const AssetName = z.string().regex(ASSET_NAME_PATTERN);

export const IndexedTask = z.strictObject({
  id: z.number().int().min(1),
  title: z.string(),
  /** Markdown. */
  instructions: z.string(),
  /** Markdown. */
  hints: z.string().optional(),
  /** The test function names that check this task. */
  tests: z.array(Identifier),
});
export type IndexedTask = z.infer<typeof IndexedTask>;

export const ItemDesign = z.strictObject({
  top: Identifier,
  solution: FileName,
  support: z.array(FileName),
  editable: z.array(FileName),
  schematic: z.boolean(),
});
export type ItemDesign = z.infer<typeof ItemDesign>;

export const IndexedItem = z.strictObject({
  id: Uuid,
  slug: Slug,
  title: z.string(),
  topic: z.string().optional(),
  blurb: z.string(),
  kind: ItemKind,
  concepts: z.array(Slug),
  prerequisites: z.array(Slug),
  difficulty: z.number().int().optional(),
  status: ItemStatus,
  /** The item's icon: an asset name. Not part of the revision. */
  icon: AssetName.optional(),
  /** SHA-256 (hex) over everything in the item that affects a run or what the learner reads. */
  revision: z.string().regex(/^[0-9a-f]{64}$/),
  /** Markdown: the concept introduction shown with the exercise. */
  intro: z.string().optional(),
  /** Markdown: the text before the first task heading (the whole text when the item has no tasks). */
  instructions: z.string(),
  /** Markdown: general hints, before any task heading. */
  hints: z.string().optional(),
  /** Empty when the item is checked as a whole. */
  tasks: z.array(IndexedTask),
  design: ItemDesign,
  /** The starter files by name: the solution file and every support file. */
  starter: z.record(FileName, z.string()),
  /** The checks file. Server-only: it must never be sent to the browser. */
  checks: z.strictObject({ name: FileName, content: z.string() }),
});
export type IndexedItem = z.infer<typeof IndexedItem>;

export const IndexedConcept = z.strictObject({
  slug: Slug,
  name: z.string(),
  /** Markdown. */
  introduction: z.string().optional(),
  /** Markdown. */
  about: z.string().optional(),
});
export type IndexedConcept = z.infer<typeof IndexedConcept>;

export const IndexedCourse = z.strictObject({
  id: CourseId,
  namespace: Slug,
  name: Slug,
  version: Semver,
  title: z.string(),
  blurb: z.string(),
  language: Slug,
  /** Plain text. */
  description: z.string().optional(),
  /** Absent only when the course is in development. */
  environment: Kind.optional(),
  /** Absent only when the course is in development. */
  runner: Kind.optional(),
  circuit: Kind.optional(),
  status: CourseStatus,
  /** The course's icon: an asset name. */
  icon: AssetName.optional(),
  category: z.strictObject({ id: Slug, title: z.string(), icon: AssetName.optional() }).optional(),
  editor: z.strictObject({ indent: z.number().int() }),
  /** Markdown. */
  syllabus: z.string().optional(),
  /** Where the pack came from, for display and debugging: for example `local:content/verilog`. */
  source: z.string(),
  concepts: z.array(IndexedConcept),
  /** In course order. */
  items: z.array(IndexedItem),
  stages: z.array(z.strictObject({ id: Slug, name: z.string() })).default([]),
  /** Planned exercises, in order. They have no page and cannot be run. */
  planned: z
      .array(z.strictObject({ slug: Slug, title: z.string(), blurb: z.string(), kind: ItemKind, stage: Slug.optional() }))
      .default([]),
});
export type IndexedCourse = z.infer<typeof IndexedCourse>;

export const ContentIndex = z.strictObject({
  schema: z.literal(CONTENT_INDEX_SCHEMA),
  courses: z.array(IndexedCourse),
});
export type ContentIndex = z.infer<typeof ContentIndex>;

/** The learner's view of an item: everything in the index except the checks. */
export type ItemView = Omit<IndexedItem, "checks">;
/** The learner's view of a course. */
export type CourseView = Omit<IndexedCourse, "items"> & { items: ItemView[] };

export function toItemView(item: IndexedItem): ItemView {
  const { checks: _checks, ...view } = item;
  return view;
}
export function toCourseView(course: IndexedCourse): CourseView {
  return { ...course, items: course.items.map(toItemView) };
}
