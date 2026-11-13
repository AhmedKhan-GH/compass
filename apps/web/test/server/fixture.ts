/** A small content index, a temporary data directory and a fake runner client for the server tests. */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after } from "node:test";
import {
  RunnerRequestError,
  RunnerUnavailableError,
  type RunnerClient,
} from "@compass/runner-client";
import type {
  ContentIndex,
  IndexedCourse,
  IndexedItem,
  Job,
  JobError,
  JobRequest,
  JobResult,
  RunReport,
  RunnerHealth,
  TestJobResult,
} from "@compass/schema";
import { closeDatabase } from "../../src/server/db.ts";
import { setRunnerClient } from "../../src/server/runner.ts";

/** Appears only in the checks file, so a response that contains it leaked the checks. */
export const CHECKS_MARKER = "CHECKS_MARKER_7f3a91";

export const COURSE_ID = "test/verilog";
export const BARE_COURSE_ID = "test/bare";

export const TASKS_ITEM: IndexedItem = {
  id: "0b7b2c3e-1d2f-4a5b-8c9d-0e1f2a3b4c5d",
  slug: "drive-high",
  title: "Drive high",
  blurb: "Drive the output high.",
  kind: "concept",
  concepts: ["constants"],
  prerequisites: [],
  status: "active",
  revision: "a".repeat(64),
  instructions: "Preamble.",
  tasks: [
    { id: 1, title: "One bit", instructions: "Declare the port.", tests: ["output_is_one_bit"] },
    { id: 2, title: "High", instructions: "Drive it.", tests: ["output_is_high", "output_stays_high"] },
  ],
  design: {
    top: "top_module",
    solution: "top_module.v",
    support: ["defs.vh", "helper.v"],
    editable: ["helper.v"],
    schematic: true,
  },
  starter: {
    "top_module.v": "module top_module(output out);\nendmodule\n",
    "defs.vh": "`define WIDTH 1\n",
    "helper.v": "module helper(output h);\nendmodule\n",
  },
  checks: { name: "test_output.py", content: `# ${CHECKS_MARKER}\nasync def output_is_high(dut): pass\n` },
};

export const PLAIN_ITEM: IndexedItem = {
  id: "1c8c3d4f-2e30-4b6c-9d0e-1f2a3b4c5d6e",
  slug: "connect-wire",
  title: "Connect a wire",
  blurb: "Connect input to output.",
  kind: "practice",
  concepts: ["constants"],
  prerequisites: [],
  status: "active",
  revision: "b".repeat(64),
  instructions: "Connect it.",
  tasks: [],
  design: { top: "top_module", solution: "top_module.v", support: [], editable: [], schematic: false },
  starter: { "top_module.v": "module top_module(input a, output b);\nendmodule\n" },
  checks: { name: "test_wire.py", content: `# ${CHECKS_MARKER}\nasync def wire(dut): pass\n` },
};

function course(id: string, items: IndexedItem[], circuit: string | undefined): IndexedCourse {
  const [namespace = "", name = ""] = id.split("/");
  return {
    id,
    namespace,
    name,
    version: "0.1.0",
    title: "Test course",
    blurb: "A course for tests.",
    language: "verilog",
    environment: "code@1",
    runner: "iverilog-cocotb@1",
    ...(circuit ? { circuit } : {}),
    status: "draft",
    editor: { indent: 4 },
    source: "local:test",
    concepts: [{ slug: "constants", name: "Constants" }],
    items,
  };
}

export function fixtureIndex(items: IndexedItem[] = [TASKS_ITEM, PLAIN_ITEM]): ContentIndex {
  return {
    schema: 1,
    courses: [course(COURSE_ID, items, "yosys-digitaljs@1"), course(BARE_COURSE_ID, [{ ...PLAIN_ITEM, design: { ...PLAIN_ITEM.design, schematic: true } }], undefined)],
  };
}

const root = mkdtempSync(path.join(tmpdir(), "compass-server-test-"));
let counter = 0;
after(() => {
  closeDatabase();
  setRunnerClient(undefined);
  rmSync(root, { recursive: true, force: true });
});

/** Writes `index` to a new file and points COMPASS_CONTENT_INDEX at it. */
export function writeIndex(index: ContentIndex = fixtureIndex()): string {
  const file = path.join(root, `index-${++counter}.json`);
  writeFileSync(file, JSON.stringify(index));
  process.env.COMPASS_CONTENT_INDEX = file;
  return file;
}

/** A fresh data directory, a fresh fixture index and a fresh fake runner. */
export function freshEnvironment(): { runner: FakeRunner; dataDirectory: string } {
  closeDatabase();
  const dataDirectory = path.join(root, `data-${++counter}`);
  process.env.COMPASS_DATA_DIR = dataDirectory;
  writeIndex();
  const runner = new FakeRunner();
  setRunnerClient(runner);
  return { runner, dataDirectory };
}

export const IMAGE_ID = "sha256:" + "c".repeat(64);

export function passReport(taskIds: number[] = [1, 2, 2]): RunReport {
  return {
    status: "pass",
    tests: taskIds.map((task_id, index) => ({ name: `Test ${index}`, status: "pass", test_code: "assert True", task_id })),
  };
}

export function testResult(report: RunReport, extra: Partial<TestJobResult> = {}): JobResult {
  return { kind: "test", report, log: "simulation log\n", waveform: "$timescale 1ns $end\n", imageId: IMAGE_ID, durationMs: 42, ...extra };
}

/** An in-memory runner. Tests move its jobs through their states. */
export class FakeRunner implements RunnerClient {
  readonly url = "http://127.0.0.1:1";
  readonly jobs = new Map<string, Job>();
  readonly requests: JobRequest[] = [];
  readonly waits: (number | undefined)[] = [];
  unreachable = false;
  busy = false;
  /** Delays every get, to let concurrent reads overlap. */
  getDelayMs = 0;
  private next = 0;

  async health(): Promise<RunnerHealth> {
    if (this.unreachable) throw new RunnerUnavailableError(this.url);
    return {
      status: "ok",
      runners: [{ kind: "iverilog-cocotb@1", purpose: "test", image: "compass/iverilog-cocotb:1", available: true }],
      queue: { queued: 0, running: 0, concurrency: 2, capacity: 32 },
    };
  }

  async submit(request: JobRequest): Promise<Job> {
    if (this.unreachable) throw new RunnerUnavailableError(this.url);
    if (this.busy) throw new RunnerRequestError(429, "queue-full", "The queue is full.");
    const job: Job = {
      id: `job-${++this.next}`,
      runner: request.runner,
      state: "queued",
      createdAt: new Date().toISOString(),
      position: this.jobs.size,
    };
    this.jobs.set(job.id, job);
    this.requests.push(structuredClone(request));
    return structuredClone(job);
  }

  async get(id: string, options: { waitMs?: number } = {}): Promise<Job | undefined> {
    this.waits.push(options.waitMs);
    if (this.unreachable) throw new RunnerUnavailableError(this.url);
    // The answer reflects the job when the request arrived, however long the response takes.
    const job = this.jobs.get(id);
    const answer = job && structuredClone(job);
    if (this.getDelayMs) await new Promise((resolve) => setTimeout(resolve, this.getDelayMs));
    return answer;
  }

  async cancel(id: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (job) this.set(id, { state: "cancelled", finishedAt: new Date().toISOString() });
    return job && structuredClone(this.jobs.get(id));
  }

  async waitFor(id: string): Promise<Job> {
    const job = this.jobs.get(id);
    if (!job) throw new RunnerRequestError(404, "not-found", "Unknown job.");
    return structuredClone(job);
  }

  get lastJobId(): string {
    return `job-${this.next}`;
  }

  set(id: string, change: Partial<Job>): void {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`No job ${id}`);
    const { position: _position, ...rest } = job;
    this.jobs.set(id, { ...rest, ...change });
  }

  run(id = this.lastJobId): void {
    this.set(id, { state: "running", startedAt: new Date().toISOString() });
  }

  succeed(result: JobResult, id = this.lastJobId): void {
    this.set(id, { state: "succeeded", finishedAt: new Date().toISOString(), result });
  }

  fail(error: JobError, id = this.lastJobId): void {
    this.set(id, { state: "failed", finishedAt: new Date().toISOString(), error });
  }

  forget(id = this.lastJobId): void {
    this.jobs.delete(id);
  }
}
