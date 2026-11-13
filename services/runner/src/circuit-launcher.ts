/** Builds a DigitalJS circuit in the yosys-digitaljs@1 image. Ported from the legacy circuit launcher. */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { CircuitJobResult, RUNNER_KINDS, type CircuitJobRequest } from "@compass/schema";
import { JobFailure } from "./failure.ts";
import { checkJobRequest } from "./requests.ts";
import {
  DEFAULT_TIMEOUT_MS,
  readBounded,
  requireImage,
  runContainer,
  withScratch,
  type SandboxOptions,
  type SandboxProfile,
} from "./sandbox.ts";

/** Yosys and Node need more memory than the simulator; the legacy launcher allowed 512 MB. */
export const CIRCUIT_PROFILE: SandboxProfile = {
  memory: "512m",
  fileSizeBytes: 4 * 1024 * 1024,
  tmpfs: "rw,nosuid,size=64m",
  outputBytes: 32 * 1024,
};

export const CIRCUIT_RESULT_BYTES = 2 * 1024 * 1024;

const INVALID_CIRCUIT = "The circuit runner returned an invalid result.";

/** Maps the image's `result.json` to a CircuitJobResult, or throws a `design` or `invalid-result` failure. */
export function toCircuitResult(value: unknown, imageId: string, durationMs: number): CircuitJobResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new JobFailure("invalid-result", INVALID_CIRCUIT);
  const result = value as Record<string, unknown>;
  if (typeof result.error === "string")
    throw new JobFailure(
      "design",
      result.error,
      typeof result.diagnostics === "string" ? result.diagnostics : undefined,
    );
  const circuit = result.circuit as Record<string, unknown> | null | undefined;
  if (
    result.version !== 1 ||
    !circuit ||
    typeof circuit !== "object" ||
    !circuit.devices ||
    typeof circuit.devices !== "object" ||
    !Array.isArray(circuit.connectors)
  )
    throw new JobFailure("invalid-result", INVALID_CIRCUIT);
  const parsed = CircuitJobResult.safeParse({
    kind: "circuit",
    circuit: result.circuit,
    ports: result.ports,
    warnings: result.warnings,
    imageId,
    durationMs,
  });
  if (!parsed.success) throw new JobFailure("invalid-result", INVALID_CIRCUIT);
  return parsed.data;
}

export async function runCircuitJob(
  request: CircuitJobRequest,
  options: SandboxOptions & { signal: AbortSignal },
): Promise<CircuitJobResult> {
  const problem = checkJobRequest(request);
  if (problem) throw new JobFailure("design", problem);
  const docker = options.docker ?? "docker";
  const started = Date.now();
  const imageId = await requireImage(
    RUNNER_KINDS[request.runner].image,
    docker,
    "The circuit runner is unavailable. Start Docker and run npm run runner:images.",
  );
  return withScratch("compass-circuit", docker, async ({ input, output, name }) => {
    for (const [file, content] of Object.entries(request.files)) await writeFile(path.join(input, file), content);
    await writeFile(
      path.join(input, ".meta", "config.json"),
      JSON.stringify({
        filename: request.solution,
        topModule: request.top,
        supportingFiles: Object.keys(request.files).filter((file) => file !== request.solution),
      }),
    );
    await runContainer({
      name,
      imageId,
      input,
      output,
      profile: CIRCUIT_PROFILE,
      command: [],
      docker,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal: options.signal,
      messages: {
        timeout: "Schematic generation exceeded its time limit.",
        execution: "Schematic generation stopped unexpectedly. Check Docker and the design's size.",
      },
    });
    let value: unknown;
    try {
      value = JSON.parse(await readBounded(path.join(output, "result.json"), CIRCUIT_RESULT_BYTES));
    } catch {
      throw new JobFailure("invalid-result", "The generated schematic is missing or too large.");
    }
    return toCircuitResult(value, imageId, Date.now() - started);
  });
}
