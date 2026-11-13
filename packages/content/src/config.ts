/** compass.config.toml and the environment variables that override it. See docs/ARCHITECTURE.md. */
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse, TomlError } from "smol-toml";
import {
  CompassConfig,
  DEFAULT_CONTENT_INDEX_PATH,
  DEFAULT_RUNNER_PORT,
  DEFAULT_RUNNER_URL,
  type ContentSource,
} from "@compass/schema";
import { issueText } from "./diagnostics.ts";
import { LIMITS } from "./files.ts";

export const CONFIG_FILE = "compass.config.toml";
export const DEFAULT_DATA_DIRECTORY = ".compass";

export type Environment = Readonly<Record<string, string | undefined>>;

/** The settings every command uses, after the environment overrides. Paths are absolute. */
export type Settings = {
  runnerUrl: string;
  /** The port the runner service listens on. */
  runnerPort: number;
  contentIndexPath: string;
  dataDirectory: string;
};

export type ResolvedConfig = Settings & {
  /** The repository root: the folder that holds compass.config.toml. */
  root: string;
  file: string;
  sources: ContentSource[];
};

export class ConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigError";
  }
}

/** The nearest folder at or above `start` that holds compass.config.toml. */
export function findRepositoryRoot(start: string): string | undefined {
  let current = path.resolve(start);
  for (;;) {
    const candidate = path.join(current, CONFIG_FILE);
    if (existsSync(candidate) && statSync(candidate).isFile()) return current;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/** Reads and validates compass.config.toml in `root`, then applies the environment. */
export async function readConfig(root: string, env: Environment): Promise<ResolvedConfig> {
  const file = path.join(root, CONFIG_FILE);
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    throw new ConfigError(`${CONFIG_FILE} could not be read: ${(error as Error).message}`, { cause: error });
  }
  if (Buffer.byteLength(text) > LIMITS.manifestBytes) throw new ConfigError(`${CONFIG_FILE} is too large.`);
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (error) {
    throw new ConfigError(`${CONFIG_FILE} is not valid TOML: ${tomlMessage(error)}`, { cause: error });
  }
  const parsed = CompassConfig.safeParse(raw);
  if (!parsed.success)
    throw new ConfigError(`${CONFIG_FILE} is not valid: ${parsed.error.issues.map(issueText).join("; ")}`);
  return { root, file, sources: parsed.data.content.source, ...settings(root, parsed.data.runner.url, env) };
}

/** Finds the repository from `cwd` and reads its configuration. */
export async function loadConfig(cwd: string, env: Environment): Promise<ResolvedConfig> {
  const root = findRepositoryRoot(cwd);
  if (!root) throw new ConfigError(`No ${CONFIG_FILE} was found in ${path.resolve(cwd)} or any folder above it.`);
  return readConfig(root, env);
}

/**
 * The settings from the configured runner URL and the environment.
 * COMPASS_RUNNER_URL replaces the URL. COMPASS_RUNNER_PORT sets the port the service listens on; when the URL is
 * not set in the environment, the client uses the configured URL with that port, so the two stay in agreement.
 * COMPASS_CONTENT_INDEX and COMPASS_DATA_DIR are resolved against the repository root when relative.
 */
export function settings(root: string, configuredUrl: string, env: Environment): Settings {
  const portText = nonEmpty(env.COMPASS_RUNNER_PORT);
  let port: number | undefined;
  if (portText !== undefined) {
    port = Number(portText);
    if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535)
      throw new ConfigError(`COMPASS_RUNNER_PORT must be a port number from 1 to 65535, not "${portText}".`);
  }
  const envUrl = nonEmpty(env.COMPASS_RUNNER_URL);
  let runnerUrl: string;
  if (envUrl !== undefined) runnerUrl = checkUrl(envUrl, "COMPASS_RUNNER_URL");
  else if (port !== undefined) {
    const url = new URL(configuredUrl);
    url.port = String(port);
    runnerUrl = stripSlash(url.toString());
  } else runnerUrl = stripSlash(configuredUrl);
  const runnerPort = port ?? urlPort(runnerUrl) ?? DEFAULT_RUNNER_PORT;
  const contentIndexPath = path.resolve(root, nonEmpty(env.COMPASS_CONTENT_INDEX) ?? DEFAULT_CONTENT_INDEX_PATH);
  const dataDirectory = path.resolve(root, nonEmpty(env.COMPASS_DATA_DIR) ?? DEFAULT_DATA_DIRECTORY);
  return { runnerUrl, runnerPort, contentIndexPath, dataDirectory };
}

/** The settings when there is no configuration file, for `compass content check --source` outside a repository. */
export function defaultSettings(cwd: string, env: Environment): Settings {
  return settings(path.resolve(cwd), DEFAULT_RUNNER_URL, env);
}

function checkUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigError(`${name} must be a URL such as ${DEFAULT_RUNNER_URL}, not "${value}".`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new ConfigError(`${name} must be an http or https URL, not "${value}".`);
  return stripSlash(value);
}

function urlPort(value: string): number | undefined {
  const url = new URL(value);
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function nonEmpty(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

export function tomlMessage(error: unknown): string {
  if (error instanceof TomlError) {
    const first = error.message.split("\n")[0]?.replace(/^Invalid TOML document:\s*/, "") ?? "invalid document";
    return `${first} (line ${error.line}, column ${error.column})`;
  }
  return error instanceof Error ? error.message : String(error);
}
