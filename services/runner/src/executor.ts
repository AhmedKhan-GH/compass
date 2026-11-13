/** The executor that runs jobs in the Docker sandbox, dispatching on the runner kind. */
import type { Executor } from "./queue.ts";
import { runCircuitJob } from "./circuit-launcher.ts";
import { runTestJob } from "./test-launcher.ts";
import type { SandboxOptions } from "./sandbox.ts";

export function createDockerExecutor(options: SandboxOptions = {}): Executor {
  return (request, { signal }) =>
    request.runner === "iverilog-cocotb@1"
      ? runTestJob(request, { ...options, signal })
      : runCircuitJob(request, { ...options, signal });
}
