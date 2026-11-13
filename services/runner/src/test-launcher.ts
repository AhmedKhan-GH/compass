/** Runs a test job in its registered image. Ported from the legacy Verilog launcher. */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { RUNNER_KINDS, type TestJobRequest, type TestJobResult } from "@compass/schema";
import { JobFailure } from "./failure.ts";
import { legacyConfig, legacyRequest, toRunReport } from "./legacy.ts";
import { checkJobRequest } from "./requests.ts";
import {
  DEFAULT_TIMEOUT_MS,
  readBounded,
  readOptional,
  requireImage,
  runContainer,
  withScratch,
  type SandboxOptions,
  type SandboxProfile,
} from "./sandbox.ts";

export const TEST_PROFILE: SandboxProfile = {
  memory: "256m",
  fileSizeBytes: 1024 * 1024,
  tmpfs: "rw,nosuid,size=64m",
  outputBytes: 128 * 1024,
};

/** Debian's GHDL GCC backend executes the elaborated design from its temporary build directory. */
export const GHDL_TEST_PROFILE: SandboxProfile = {
  ...TEST_PROFILE,
  tmpfs: "rw,nosuid,exec,size=64m",
};

export const TEST_OUTPUT_LIMITS = { results: 256 * 1024, log: 32 * 1024, waveform: 512 * 1024 } as const;

export async function runTestJob(
  request: TestJobRequest,
  options: SandboxOptions & { signal: AbortSignal },
): Promise<TestJobResult> {
  const problem = checkJobRequest(request);
  if (problem) throw new JobFailure("execution", problem);
  const docker = options.docker ?? "docker";
  const started = Date.now();
  const imageId = await requireImage(
    RUNNER_KINDS[request.runner].image,
    docker,
    "The test runner is unavailable. Start Docker and run npm run runner:images.",
  );
  return withScratch("compass-run", docker, async ({ input, output, name }) => {
    for (const [file, content] of Object.entries(request.files)) await writeFile(path.join(input, file), content);
    await writeFile(path.join(input, request.checks.name), request.checks.content);
    await writeFile(path.join(input, ".meta", "config.json"), JSON.stringify(legacyConfig(request)));
    await writeFile(path.join(input, ".meta", "request.json"), JSON.stringify(legacyRequest(request)));
    await runContainer({
      name,
      imageId,
      input,
      output,
      profile: request.runner === "ghdl-cocotb@1" || request.runner === "ghdl-native@1"
        ? GHDL_TEST_PROFILE : TEST_PROFILE,
      command: [request.top, "/solution", "/output"],
      docker,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal: options.signal,
      messages: {
        timeout: "Simulation exceeded its time limit. Check for an infinite loop.",
        execution: "The simulation container stopped unexpectedly. Check the runner installation and resource limits.",
      },
    });
    let value: unknown;
    try {
      value = JSON.parse(await readBounded(path.join(output, "results.json"), TEST_OUTPUT_LIMITS.results));
    } catch {
      throw new JobFailure("invalid-result", "The simulator did not produce a readable test report.");
    }
    const report = toRunReport(value, request);
    // Diagnostics are optional; the test report is required. The waveform is absent when the design did not compile.
    const log = (await readOptional(path.join(output, "simulation.log"), TEST_OUTPUT_LIMITS.log)) ?? "";
    const waveform = await readOptional(path.join(output, "waveform.vcd"), TEST_OUTPUT_LIMITS.waveform);
    return {
      kind: "test",
      report,
      log,
      ...(waveform ? { waveform } : {}),
      imageId,
      durationMs: Date.now() - started,
    };
  });
}
