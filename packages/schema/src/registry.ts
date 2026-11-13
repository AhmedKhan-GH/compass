/**
 * The runner kinds and environment kinds this installation knows.
 * A course names them in course.toml. Upgrading a tool adds a new entry; an existing entry never changes.
 */

export type RunnerPurpose = "test" | "circuit";

export type RunnerKindInfo = {
  purpose: RunnerPurpose;
  /** The Docker image tag the runner service builds and runs. */
  image: string;
  /** The directory under services/runner/images/. */
  imageDirectory: string;
  /** The editor languages this runner accepts. */
  languages: readonly string[];
  tools: string;
};

export const RUNNER_KINDS = {
  "iverilog-cocotb@1": {
    purpose: "test",
    image: "compass/iverilog-cocotb:1",
    imageDirectory: "iverilog-cocotb-1",
    languages: ["verilog"],
    tools: "Python 3.12, Icarus Verilog 11.0, cocotb 2.0.0",
  },
  "yosys-digitaljs@1": {
    purpose: "circuit",
    image: "compass/yosys-digitaljs:1",
    imageDirectory: "yosys-digitaljs-1",
    languages: ["verilog"],
    tools: "Yosys 0.23, yosys2digitaljs 0.10.3",
  },
} as const satisfies Record<string, RunnerKindInfo>;

export type RunnerKind = keyof typeof RUNNER_KINDS;
export type TestRunnerKind = "iverilog-cocotb@1";
export type CircuitRunnerKind = "yosys-digitaljs@1";

export type PaneKind = "instructions" | "editor" | "results" | "waveform" | "circuit";

export type EnvironmentKindInfo = { panes: readonly PaneKind[] };

export const ENVIRONMENT_KINDS = {
  "code@1": { panes: ["instructions", "editor", "results", "waveform", "circuit"] },
} as const satisfies Record<string, EnvironmentKindInfo>;

export type EnvironmentKind = keyof typeof ENVIRONMENT_KINDS;

export function isRunnerKind(value: string): value is RunnerKind {
  return Object.hasOwn(RUNNER_KINDS, value);
}
export function isTestRunnerKind(value: string): value is TestRunnerKind {
  return isRunnerKind(value) && RUNNER_KINDS[value].purpose === "test";
}
export function isCircuitRunnerKind(value: string): value is CircuitRunnerKind {
  return isRunnerKind(value) && RUNNER_KINDS[value].purpose === "circuit";
}
export function isEnvironmentKind(value: string): value is EnvironmentKind {
  return Object.hasOwn(ENVIRONMENT_KINDS, value);
}
