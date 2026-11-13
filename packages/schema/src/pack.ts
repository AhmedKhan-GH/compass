/** The manifests of a pack: course.toml and item.toml, as parsed from TOML. */
import { z } from "zod";
import { CourseId, FileName, Identifier, Kind, Semver, Slug, Uuid } from "./ids.ts";

export const CourseManifest = z.strictObject({
  id: CourseId,
  version: Semver,
  title: z.string().min(1).max(80),
  blurb: z.string().min(1).max(240),
  language: Slug,
  environment: Kind,
  runner: Kind,
  circuit: Kind.optional(),
  syllabus: FileName.optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  editor: z.strictObject({ indent: z.number().int().min(1).max(8) }).default({ indent: 4 }),
  concept: z.array(z.strictObject({ slug: Slug, name: z.string().min(1).max(80) })).default([]),
  item: z
    .array(z.strictObject({ slug: Slug, prerequisites: z.array(Slug).default([]) }))
    .min(1),
});
export type CourseManifest = z.infer<typeof CourseManifest>;

export const ItemKind = z.enum(["concept", "practice"]);
export type ItemKind = z.infer<typeof ItemKind>;
export const ItemStatus = z.enum(["active", "beta", "wip", "deprecated"]);
export type ItemStatus = z.infer<typeof ItemStatus>;

export const TaskManifest = z.strictObject({
  id: z.number().int().min(1),
  tests: z.array(Identifier).min(1),
  stage: FileName.optional(),
});
export type TaskManifest = z.infer<typeof TaskManifest>;

export const ItemManifest = z.strictObject({
  id: Uuid,
  title: z.string().min(1).max(80),
  topic: z.string().min(1).max(80).optional(),
  blurb: z.string().min(1).max(240),
  kind: ItemKind,
  concepts: z.array(Slug).min(1),
  difficulty: z.number().int().min(1).max(10).optional(),
  status: ItemStatus.default("active"),
  design: z.strictObject({
    top: Identifier,
    solution: FileName,
    support: z.array(FileName).default([]),
    editable: z.array(FileName).default([]),
    schematic: z.boolean().default(true),
  }),
  checks: z.strictObject({
    file: FileName,
    reference: FileName,
    wrong: z.array(FileName).default([]),
  }),
  task: z.array(TaskManifest).optional(),
});
export type ItemManifest = z.infer<typeof ItemManifest>;

/** compass.config.toml */
export const LocalSource = z.strictObject({ kind: z.literal("local"), path: z.string().min(1) });
export const ContentSource = z.discriminatedUnion("kind", [LocalSource]);
export type ContentSource = z.infer<typeof ContentSource>;

export const CompassConfig = z.strictObject({
  content: z.strictObject({ source: z.array(ContentSource).min(1) }),
  runner: z.strictObject({ url: z.url() }).default({ url: "http://127.0.0.1:3101" }),
});
export type CompassConfig = z.infer<typeof CompassConfig>;
