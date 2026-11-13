"use client";
import { useEffect, useState } from "react";
import type { RunnerHealth } from "@compass/schema";
import { StatusMark } from "@compass/ui";
import { getRunnerHealth } from "@/lib/api";

export type RunnerState =
  { state: "checking" } | { state: "ready"; health: RunnerHealth } | { state: "unavailable"; message: string };

/** Asks the web app once whether the runner service answers. */
export function useRunnerState(refresh = 0): RunnerState {
  const [state, setState] = useState<RunnerState>({ state: "checking" });
  useEffect(() => {
    const controller = new AbortController();
    getRunnerHealth(controller.signal).then(
      (health) => setState({ state: "ready", health }),
      (error: unknown) => {
        if (!controller.signal.aborted)
          setState({ state: "unavailable", message: error instanceof Error ? error.message : String(error) });
      },
    );
    return () => controller.abort();
  }, [refresh]);
  return state;
}

/** The runner's state in the status bar: whether it answers, and whether every image is built. */
export function RunnerStatus({ state }: { state: RunnerState }) {
  if (state.state === "checking") return <span className="sb-faint">Runner</span>;
  if (state.state === "unavailable") return <StatusMark status="unavailable" label="Runner unavailable" />;
  const missing = state.health.runners.filter((runner) => !runner.available);
  if (missing.length)
    return (
      <StatusMark
        status="unavailable"
        label={`Runner images missing: ${missing.map((runner) => runner.kind).join(", ")}`}
      />
    );
  const { queued, running } = state.health.queue;
  return <span>{queued + running ? `Runner ready · ${running} running · ${queued} queued` : "Runner ready"}</span>;
}
