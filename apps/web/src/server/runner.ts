/**
 * The one place the app gets its runner client. Tests replace it with `setRunnerClient`.
 *
 * The address is COMPASS_RUNNER_URL, else `[runner].url` in compass.config.toml, else the schema default.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseToml } from "smol-toml";
import { CompassConfig, DEFAULT_RUNNER_URL } from "@compass/schema";
import type { RunnerClient } from "@compass/runner-client";
import { repositoryRoot } from "./paths.ts";

export const CONFIG_FILENAME = "compass.config.toml";

/** The runner address from the environment value and the config file, in that order. */
export function resolveRunnerUrl(environment: string | undefined, configFile: string): string {
  if (environment) return environment;
  if (!existsSync(configFile)) return DEFAULT_RUNNER_URL;
  const parsed = CompassConfig.safeParse(parseToml(readFileSync(configFile, "utf8")));
  if (!parsed.success) throw new Error(`${configFile} is not a valid Compass configuration.`);
  return parsed.data.runner.url;
}

export function runnerUrl(): string {
  return resolveRunnerUrl(process.env.COMPASS_RUNNER_URL, path.join(repositoryRoot(), CONFIG_FILENAME));
}

const held = globalThis as typeof globalThis & {
  compassRunner?: { client: RunnerClient; injected: boolean };
};

/** The runner client for the configured address. */
export async function runnerClient(): Promise<RunnerClient> {
  const current = held.compassRunner;
  if (current?.injected) return current.client;
  const url = runnerUrl();
  if (current?.client.url === url) return current.client;
  // Loaded on first use, so code that runs against an injected client never loads the HTTP client.
  const { createRunnerClient } = await import("@compass/runner-client");
  const client = createRunnerClient({ url });
  held.compassRunner = { client, injected: false };
  return client;
}

/** Replaces the runner client, or restores the configured one when given undefined. For tests. */
export function setRunnerClient(client: RunnerClient | undefined): void {
  held.compassRunner = client && { client, injected: true };
}

/*
 * The client's errors are recognised by name rather than by class, so the check holds even when a bundler
 * loads the client package twice.
 */

/** The runner service could not be reached (RunnerUnavailableError). */
export function isRunnerUnavailable(error: unknown): error is Error {
  return error instanceof Error && error.name === "RunnerUnavailableError";
}

/** The runner service answered with an error status (RunnerRequestError). */
export function isRunnerRequestError(error: unknown): error is Error & { status: number; code: string } {
  return (
    error instanceof Error &&
    error.name === "RunnerRequestError" &&
    typeof (error as { status?: unknown }).status === "number"
  );
}
