"use client";
import { StatusItem } from "@compass/ui";
import { RunnerStatus, useRunnerState } from "./runner-status";

export function CatalogStatus() {
  const runner = useRunnerState();
  return (
    <StatusItem>
      <RunnerStatus state={runner} />
    </StatusItem>
  );
}
