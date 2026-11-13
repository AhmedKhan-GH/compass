/** Shared helpers of the content tests: temporary copies of the fixture pack and a fake runner client. */
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "smol-toml";
import { RunnerRequestError, RunnerUnavailableError, type RunnerClient } from "@compass/runner-client";
import type { Job, JobError, JobRequest, RunReport, TestJobRequest, TestResult } from "@compass/schema";
import { checkPack } from "../src/checks.ts";
import { loadPack, type LoadedPack } from "../src/loader.ts";

export const FIXTURES = fileURLToPath(new URL("./fixtures", import.meta.url));
export const FIXTURE_PACK = path.join(FIXTURES, "verilog");

type TestContext = { after: (fn: () => Promise<void>) => void };

/** A temporary folder removed after the test. */
export async function temporaryDirectory(t: TestContext): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "compass-content-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

/** A copy of the fixture pack at `<temp>/packs/verilog`, with a compass.config.toml in `<temp>`. */
export async function temporaryRepository(t: TestContext): Promise<{ root: string; pack: string }> {
  const root = await temporaryDirectory(t);
  const pack = path.join(root, "packs", "verilog");
  await cp(FIXTURE_PACK, pack, { recursive: true });
  await writeFile(
    path.join(root, "compass.config.toml"),
    '[[content.source]]\nkind = "local"\npath = "packs"\n\n[runner]\nurl = "http://127.0.0.1:3999"\n',
  );
  return { root, pack };
}

/** A copy of the fixture pack in a temporary folder. */
export async function temporaryPack(t: TestContext): Promise<string> {
  return (await temporaryRepository(t)).pack;
}

export async function editToml(file: string, update: (value: Record<string, unknown>) => void): Promise<void> {
  const value = parse(await readFile(file, "utf8")) as Record<string, unknown>;
  update(value);
  await writeFile(file, stringify(value));
}

export async function load(directory: string): Promise<LoadedPack> {
  return loadPack({ directory, label: "verilog", source: "local:verilog" });
}

export async function check(directory: string) {
  return checkPack(await load(directory));
}

/** The diagnostics of one rule, as "severity: message" lines, for readable assertions. */
export function messages(diagnostics: readonly { severity: string; rule: string; message: string }[], rule?: string): string[] {
  return diagnostics
    .filter((diagnostic) => rule === undefined || diagnostic.rule === rule)
    .map((diagnostic) => `${diagnostic.severity}: ${diagnostic.message}`);
}

/**
 * A stand-in for the simulator: it judges the fixture's tests by looking at the sources.
 * drive-high: task 1 passes with `output wire out`, task 2 with `assign out = 1'b1`.
 * light-bank: passes when the solution instantiates two lamps and lamp.v drives 1.
 */
export function simulate(request: TestJobRequest): RunReport {
  const solution = request.files[request.solution] ?? "";
  if (solution.includes("COMPILE-ERROR")) return { status: "error", message: "top_module.v:3: syntax error" };
  const result = (name: string, pass: boolean, taskId?: number): TestResult => ({
    name,
    status: pass ? "pass" : "fail",
    test_code: `async def ${name}(dut): ...`,
    ...(pass ? {} : { message: `${name} failed` }),
    ...(taskId === undefined ? {} : { task_id: taskId }),
  });
  let tests: TestResult[];
  if (request.tasks) {
    tests = request.tasks.flatMap((task) =>
      task.tests.map((name) =>
        result(name, name === "output_port_is_one_bit" ? solution.includes("output wire out") : solution.includes("assign out = 1'b1"), task.id),
      ),
    );
  } else {
    const lamp = request.files["lamp.v"] ?? "";
    tests = [result("both_lights_on", solution.includes("lamp second") && lamp.includes("1'b1"))];
  }
  const status = tests.every((test) => test.status === "pass") ? "pass" : "fail";
  return { status, tests };
}

export type FakeBehaviour = (request: TestJobRequest) => RunReport | { error: JobError } | "cancel";

export type FakeRunner = RunnerClient & {
  requests: TestJobRequest[];
  maxInFlight: number;
};

/** A RunnerClient that answers from `behaviour` after a short delay and records what it was sent. */
export function fakeRunner(
  behaviour: FakeBehaviour = simulate,
  options: { available?: boolean; unreachable?: boolean; rejectFirst?: number } = {},
): FakeRunner {
  const jobs = new Map<string, Job>();
  let inFlight = 0;
  let rejections = options.rejectFirst ?? 0;
  const url = "http://127.0.0.1:3999";
  const fake: FakeRunner = {
    url,
    requests: [],
    maxInFlight: 0,
    async health() {
      if (options.unreachable) throw new RunnerUnavailableError(url);
      return {
        status: "ok",
        runners: [
          { kind: "iverilog-cocotb@1", purpose: "test", image: "compass/iverilog-cocotb:1", available: options.available ?? true },
          { kind: "yosys-digitaljs@1", purpose: "circuit", image: "compass/yosys-digitaljs:1", available: true },
        ],
        queue: { queued: 0, running: 0, concurrency: 2, capacity: 32 },
      };
    },
    async submit(request: JobRequest) {
      if (request.runner !== "iverilog-cocotb@1") throw new Error("the fake runs only test jobs");
      if (rejections > 0) {
        rejections--;
        throw new RunnerRequestError(429, "queue-full", "The queue is full.");
      }
      fake.requests.push(request);
      inFlight++;
      fake.maxInFlight = Math.max(fake.maxInFlight, inFlight);
      const id = `job-${fake.requests.length}`;
      const createdAt = "2026-01-01T00:00:00.000Z";
      await new Promise((resolve) => setTimeout(resolve, 5));
      const answer = behaviour(request);
      const job: Job =
        answer === "cancel"
          ? { id, runner: request.runner, state: "cancelled", createdAt }
          : "error" in answer
            ? { id, runner: request.runner, state: "failed", createdAt, error: answer.error }
            : {
                id,
                runner: request.runner,
                state: "succeeded",
                createdAt,
                result: { kind: "test", report: answer, log: "", imageId: "sha256:fake", durationMs: 1 },
              };
      jobs.set(id, job);
      return { id, runner: request.runner, state: "queued", createdAt, position: 0 };
    },
    async get(id) {
      return jobs.get(id);
    },
    async cancel(id) {
      return jobs.get(id);
    },
    async waitFor(id) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight--;
      const job = jobs.get(id);
      if (!job) throw new RunnerRequestError(404, "not-found", "The job is unknown or has expired.");
      return job;
    },
  };
  return fake;
}


/** Captures what a command writes. */
export function capture(isTTY = false): { write(text: string): boolean; isTTY: boolean; text(): string } {
  let buffer = "";
  return {
    isTTY,
    write(text: string) {
      buffer += text;
      return true;
    },
    text: () => buffer,
  };
}
