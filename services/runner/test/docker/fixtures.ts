/** Loads the exercise fixtures in test/fixtures and turns them into job requests. */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CircuitJobRequest, ItemKind, TaskMap, TestJobRequest } from "@compass/schema";

const FIXTURES = path.resolve(import.meta.dirname, "../fixtures");

type Manifest = {
  top: string;
  solution: string;
  itemKind: ItemKind;
  checks: string;
  reference: string;
  wrong: string[];
  tasks: TaskMap;
  stages: string[];
};

export type Fixture = Manifest & {
  starterSource: string;
  referenceSource: string;
  wrongSources: Record<string, string>;
  stageSources: Record<string, string>;
  checksContent: string;
  /** A test job with `source` as the solution. */
  test(source: string, overrides?: Partial<TestJobRequest>): TestJobRequest;
  circuit(source: string): CircuitJobRequest;
};

export async function loadFixture(slug: string): Promise<Fixture> {
  const directory = path.join(FIXTURES, slug);
  const read = (...parts: string[]) => readFile(path.join(directory, ...parts), "utf8");
  const manifest = JSON.parse(await read("fixture.json")) as Manifest;
  const sources = async (folder: string, names: string[]) =>
    Object.fromEntries(await Promise.all(names.map(async (name) => [name, await read(folder, name)] as const)));
  const checksContent = await read("checks", manifest.checks);
  return {
    ...manifest,
    starterSource: await read("starter", manifest.solution),
    referenceSource: await read("reference", manifest.reference),
    wrongSources: await sources("wrong", manifest.wrong),
    stageSources: await sources("stages", manifest.stages),
    checksContent,
    test: (source, overrides = {}) => ({
      runner: "iverilog-cocotb@1",
      top: manifest.top,
      solution: manifest.solution,
      files: { [manifest.solution]: source },
      checks: { name: manifest.checks, content: checksContent },
      itemKind: manifest.itemKind,
      tasks: manifest.tasks,
      ...overrides,
    }),
    circuit: (source) => ({
      runner: "yosys-digitaljs@1",
      top: manifest.top,
      solution: manifest.solution,
      files: { [manifest.solution]: source },
    }),
  };
}

/** The ids of the containers, running or stopped, whose names start with `prefix`. */
export function containers(prefix: string): string[] {
  return execFileSync("docker", ["ps", "-aq", "--filter", `name=${prefix}`], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
}
