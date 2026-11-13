/**
 * The Docker sandbox shared by the launchers: image lookup, the container flags, the wall-clock limit,
 * removal of the container, and size-bounded reads of what the container wrote.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants, chmod, lstat, mkdir, mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { JobFailure } from "./failure.ts";

export const IMAGES_DIRECTORY = path.resolve(import.meta.dirname, "../images");

/** The default wall-clock limit of one container, as in the legacy launchers. */
export const DEFAULT_TIMEOUT_MS = 20_000;

/** The limits that differ between the runner kinds. */
export type SandboxProfile = {
  /** Memory and memory plus swap, so there is no swap. */
  memory: string;
  /** The largest file the container may write, in bytes. */
  fileSizeBytes: number;
  /** The options of the tmpfs at /tmp. */
  tmpfs: string;
  /** The bound on what the container may print. */
  outputBytes: number;
};

export type SandboxOptions = {
  /** The Docker command. */
  docker?: string;
  /** The wall-clock limit of one container. */
  timeoutMs?: number;
};

type ExecResult = { stdout: string; stderr: string };
type ExecFailure = Error & { code?: string | number | null; killed?: boolean; stderr?: string };

function exec(
  command: string,
  args: readonly string[],
  options: { timeout?: number; maxBuffer: number; signal?: AbortSignal },
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) reject(Object.assign(error, { stderr }));
      else resolve({ stdout, stderr });
    });
  });
}

/** The image id of a tag, or undefined when Docker is unreachable or the image is missing. */
export async function inspectImage(image: string, docker = "docker"): Promise<string | undefined> {
  try {
    const { stdout } = await exec(docker, ["image", "inspect", "--format", "{{.Id}}", image], {
      timeout: 5000,
      maxBuffer: 32768,
    });
    const id = stdout.trim();
    return /^sha256:[a-f0-9]{64}$/.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export async function requireImage(image: string, docker: string, message: string): Promise<string> {
  const id = await inspectImage(image, docker);
  if (!id) throw new JobFailure("unavailable", message);
  return id;
}

export type Scratch = { input: string; output: string; name: string };

/**
 * Runs `use` with a fresh input directory (mounted read-only), a writable output directory and a unique container
 * name, then removes the container and the directories.
 */
export async function withScratch<T>(
  prefix: string,
  docker: string,
  use: (scratch: Scratch) => Promise<T>,
): Promise<T> {
  const root = await mkdtemp(path.join(tmpdir(), `${prefix}-`));
  const scratch = {
    input: path.join(root, "input"),
    output: path.join(root, "output"),
    name: `${prefix}-${randomUUID()}`,
  };
  try {
    await mkdir(path.join(scratch.input, ".meta"), { recursive: true });
    await mkdir(scratch.output);
    // The container runs as 65534:65534 and writes only here.
    await chmod(scratch.output, 0o777);
    return await use(scratch);
  } finally {
    // The Docker CLI stopping does not guarantee its container has stopped.
    await removeContainer(scratch.name, docker);
    await rm(root, { recursive: true, force: true }).catch(() => {});
  }
}

export async function removeContainer(name: string, docker = "docker"): Promise<void> {
  await exec(docker, ["rm", "-f", name], { timeout: 5000, maxBuffer: 32768 }).catch(() => {});
}

/** The `docker run` arguments of a sandboxed container. */
export function sandboxArguments(run: {
  name: string;
  imageId: string;
  input: string;
  output: string;
  profile: SandboxProfile;
  command: readonly string[];
}): string[] {
  const { fileSizeBytes } = run.profile;
  return [
    "run",
    "--rm",
    "--pull",
    "never",
    "--name",
    run.name,
    "--init",
    "--network",
    "none",
    "--cpus",
    "1",
    "--memory",
    run.profile.memory,
    "--memory-swap",
    run.profile.memory,
    "--pids-limit",
    "64",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "65534:65534",
    "--ulimit",
    `fsize=${fileSizeBytes}:${fileSizeBytes}`,
    "--tmpfs",
    `/tmp:${run.profile.tmpfs}`,
    "--mount",
    `type=bind,source=${run.input},target=/solution,readonly`,
    "--mount",
    `type=bind,source=${run.output},target=/output`,
    run.imageId,
    ...run.command,
  ];
}

/** Thrown when the job's signal aborted the run. The queue has already marked the job cancelled. */
export class RunCancelled extends Error {
  constructor() {
    super("The job was cancelled.");
    this.name = "RunCancelled";
  }
}

/**
 * Runs a sandboxed container to completion. Rejects with JobFailure `timeout` when the wall-clock limit passes,
 * `execution` when the container fails, and RunCancelled when `signal` aborts; the container is removed in every case.
 */
export async function runContainer(
  run: Parameters<typeof sandboxArguments>[0] & {
    docker: string;
    timeoutMs: number;
    signal: AbortSignal;
    messages: { timeout: string; execution: string };
  },
): Promise<void> {
  if (run.signal.aborted) throw new RunCancelled();
  const stop = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    stop.abort();
  }, run.timeoutMs);
  const cancel = () => stop.abort();
  run.signal.addEventListener("abort", cancel, { once: true });
  try {
    await exec(run.docker, sandboxArguments(run), { maxBuffer: run.profile.outputBytes, signal: stop.signal });
  } catch (error) {
    // Stop the container before anything reads its output.
    await removeContainer(run.name, run.docker);
    if (run.signal.aborted) throw new RunCancelled();
    if (timedOut) throw new JobFailure("timeout", run.messages.timeout);
    if ((error as ExecFailure).code === "ENOENT")
      throw new JobFailure("unavailable", "The Docker command was not found.");
    throw new JobFailure("execution", run.messages.execution);
  } finally {
    clearTimeout(timer);
    run.signal.removeEventListener("abort", cancel);
  }
  if (run.signal.aborted) throw new RunCancelled();
}

/**
 * Reads a regular file the container wrote, refusing symlinks, special files and files over `maxBytes`.
 * Throws when the file is missing or unsafe.
 */
export async function readBounded(file: string, maxBytes: number): Promise<string> {
  const unsafe = () => new Error(`${path.basename(file)} is missing, unsafe or too large.`);
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maxBytes) throw unsafe();
  // O_NOFOLLOW refuses a symlink swapped in after lstat; O_NONBLOCK keeps a FIFO from blocking the open.
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size > maxBytes) throw unsafe();
    const buffer = Buffer.alloc(maxBytes + 1);
    let length = 0;
    for (;;) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
      if (length > maxBytes) throw unsafe();
    }
    return buffer.toString("utf8", 0, length);
  } finally {
    await handle.close();
  }
}

/** Like readBounded, but resolves to undefined when the file is missing or unsafe. */
export async function readOptional(file: string, maxBytes: number): Promise<string | undefined> {
  try {
    return await readBounded(file, maxBytes);
  } catch {
    return undefined;
  }
}
