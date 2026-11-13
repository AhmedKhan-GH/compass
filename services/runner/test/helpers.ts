/** Shared pieces of the unit tests: sample requests and results, and an executor the test settles by hand. */
import { setImmediate as tick } from "node:timers/promises";
import type { CircuitJobRequest, JobRequest, JobResult, TestJobRequest } from "@compass/schema";
import { JobQueue, type Executor, type QueueOptions } from "../src/queue.ts";
import { createRunnerServer, listen } from "../src/server.ts";

export const SOURCE = "module top_module(output wire out);\n    assign out = 1'b1;\nendmodule\n";

export function testRequest(overrides: Partial<TestJobRequest> = {}): TestJobRequest {
  return {
    runner: "iverilog-cocotb@1",
    top: "top_module",
    solution: "top_module.v",
    files: { "top_module.v": SOURCE },
    checks: { name: "test_output.py", content: "import cocotb\n" },
    itemKind: "concept",
    ...overrides,
  };
}

export function circuitRequest(overrides: Partial<CircuitJobRequest> = {}): CircuitJobRequest {
  return {
    runner: "yosys-digitaljs@1",
    top: "top_module",
    solution: "top_module.v",
    files: { "top_module.v": SOURCE },
    ...overrides,
  };
}

export const PASSING_RESULT: JobResult = {
  kind: "test",
  report: {
    status: "pass",
    tests: [{ name: "Output is high", status: "pass", test_code: "async def output_is_high(dut): ..." }],
  },
  log: "",
  imageId: "sha256:" + "0".repeat(64),
  durationMs: 5,
};

export type Call = {
  request: JobRequest;
  jobId: string;
  signal: AbortSignal;
  resolve: (result: JobResult) => void;
  reject: (error: unknown) => void;
};

/**
 * An executor whose runs stay pending until the test settles them. Like the Docker executor, a run rejects when
 * its signal aborts, unless `rejectOnAbort` is false.
 */
export class ManualExecutor {
  readonly calls: Call[] = [];
  constructor(private readonly rejectOnAbort = true) {}
  readonly executor: Executor = (request, { jobId, signal }) =>
    new Promise<JobResult>((resolve, reject) => {
      this.calls.push({ request, jobId, signal, resolve, reject });
      if (this.rejectOnAbort) signal.addEventListener("abort", () => reject(new Error("Aborted.")), { once: true });
    });

  call(index: number): Call {
    const call = this.calls[index];
    if (!call) throw new Error(`The executor has no call ${index}; it has ${this.calls.length}.`);
    return call;
  }
}

/** Lets settled promises run their continuations. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick();
}

export const IMAGE_ID = "sha256:" + "a".repeat(64);

/** Starts the HTTP API on an ephemeral port with a manual executor. Only the test image counts as built. */
export async function startServer(options: Omit<QueueOptions, "executor"> & { maxBodyBytes?: number } = {}) {
  const fake = new ManualExecutor();
  const { maxBodyBytes, ...queueOptions } = options;
  const queue = new JobQueue({ executor: fake.executor, ...queueOptions });
  const server = createRunnerServer({
    queue,
    inspectImage: async (image) => (image === "compass/iverilog-cocotb:1" ? IMAGE_ID : undefined),
    ...(maxBodyBytes ? { maxBodyBytes } : {}),
  });
  const address = await listen(server, 0);
  const url = `http://${address.address}:${address.port}`;
  return {
    fake,
    queue,
    server,
    address,
    url,
    async close() {
      await queue.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
