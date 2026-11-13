/** Reading the old app's track configuration, with explicit validation. */
import { readFileSync } from "node:fs";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readJson(path: string): JsonObject {
  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isObject(value)) throw new Error(`${path}: expected a JSON object`);
  return value;
}

export function str(obj: JsonObject, key: string, where: string): string {
  const v = obj[key];
  if (typeof v !== "string") throw new Error(`${where}: "${key}" must be a string`);
  return v;
}

export function optStr(obj: JsonObject, key: string, where: string): string | undefined {
  return obj[key] === undefined ? undefined : str(obj, key, where);
}

export function strList(obj: JsonObject, key: string, where: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
    throw new Error(`${where}: "${key}" must be a list of strings`);
  }
  return v as string[];
}

export function optStrList(obj: JsonObject, key: string, where: string): string[] | undefined {
  return obj[key] === undefined ? undefined : strList(obj, key, where);
}

export function obj(parent: JsonObject, key: string, where: string): JsonObject {
  const v = parent[key];
  if (!isObject(v)) throw new Error(`${where}: "${key}" must be an object`);
  return v;
}

export function optObj(parent: JsonObject, key: string, where: string): JsonObject | undefined {
  return parent[key] === undefined ? undefined : obj(parent, key, where);
}

export interface OldEntry {
  slug: string;
  uuid: string;
  name: string;
  kind: "concept" | "practice";
  concepts: string[];
  prerequisites: string[];
  difficulty?: number;
  status: string;
}

export interface OldConcept {
  slug: string;
  name: string;
}

export interface OldTrack {
  language: "verilog" | "vhdl";
  entries: Map<string, OldEntry>;
  concepts: OldConcept[];
  learningPath: string[];
  displayNames: Record<string, string>;
}

function entries(list: Json | undefined, kind: "concept" | "practice"): OldEntry[] {
  if (!Array.isArray(list)) throw new Error(`config.json: exercises.${kind} must be a list`);
  return list.map((raw, i) => {
    const where = `config.json exercises.${kind}[${i}]`;
    if (!isObject(raw)) throw new Error(`${where}: expected an object`);
    const e: OldEntry = {
      slug: str(raw, "slug", where),
      uuid: str(raw, "uuid", where),
      name: str(raw, "name", where),
      kind,
      concepts: strList(raw, kind === "concept" ? "concepts" : "practices", where),
      prerequisites: strList(raw, "prerequisites", where),
      status: optStr(raw, "status", where) ?? "active",
    };
    const d = raw["difficulty"];
    if (d !== undefined) {
      if (typeof d !== "number") throw new Error(`${where}: "difficulty" must be a number`);
      e.difficulty = d;
    }
    return e;
  });
}

export function readTrack(path: string): OldTrack {
  const config = readJson(path);
  const language = (optStr(config, "language", "config.json") ?? "Verilog").toLowerCase();
  if (language !== "verilog" && language !== "vhdl") throw new Error(`unsupported track language: ${language}`);
  const ex = obj(config, "exercises", "config.json");
  const map = new Map<string, OldEntry>();
  for (const e of [...entries(ex["concept"], "concept"), ...entries(ex["practice"], "practice")]) {
    if (map.has(e.slug)) throw new Error(`config.json: duplicate exercise slug "${e.slug}"`);
    map.set(e.slug, e);
  }
  const rawConcepts = config["concepts"];
  if (!Array.isArray(rawConcepts)) throw new Error("config.json: concepts must be a list");
  const concepts = rawConcepts.map((c, i) => {
    if (!isObject(c)) throw new Error(`config.json concepts[${i}]: expected an object`);
    return { slug: str(c, "slug", `concepts[${i}]`), name: str(c, "name", `concepts[${i}]`) };
  });
  const nebula = obj(obj(config, "custom", "config.json"), "nebula", "config.json custom");
  const names = obj(nebula, "display_names", "custom.nebula");
  const displayNames: Record<string, string> = {};
  for (const [k, v] of Object.entries(names)) {
    if (typeof v !== "string") throw new Error(`display_names.${k} must be a string`);
    displayNames[k] = v;
  }
  return {
    language,
    entries: map,
    concepts,
    learningPath: strList(nebula, "learning_path", "custom.nebula"),
    displayNames,
  };
}
