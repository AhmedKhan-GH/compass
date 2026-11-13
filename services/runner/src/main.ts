/**
 * Starts the runner service on 127.0.0.1.
 * COMPASS_RUNNER_PORT sets the port (default 3101); COMPASS_RUNNER_CONCURRENCY the number of workers (default 2).
 */
import { DEFAULT_RUNNER_PORT } from "@compass/schema";
import { createDockerExecutor } from "./executor.ts";
import { DEFAULT_CONCURRENCY, JobQueue } from "./queue.ts";
import { HOST, createRunnerServer, listen } from "./server.ts";

function integerSetting(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || value < min || value > max) {
    console.error(`${name} must be a whole number from ${min} to ${max}; it is ${JSON.stringify(raw)}.`);
    process.exit(2);
  }
  return value;
}

const port = integerSetting("COMPASS_RUNNER_PORT", DEFAULT_RUNNER_PORT, 1, 65535);
const concurrency = integerSetting("COMPASS_RUNNER_CONCURRENCY", DEFAULT_CONCURRENCY, 1, 64);

const queue = new JobQueue({ executor: createDockerExecutor(), concurrency });
const server = createRunnerServer({ queue });

try {
  await listen(server, port);
} catch (error) {
  console.error(`The runner service could not listen on ${HOST}:${port}: ${(error as Error).message}`);
  process.exit(1);
}
console.log(`Runner service listening on http://${HOST}:${port} with ${concurrency} workers.`);

let stopping = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (stopping) {
    console.error(`Received ${signal} again; exiting now.`);
    process.exit(1);
  }
  stopping = true;
  console.log(`Received ${signal}; stopping.`);
  const closed = new Promise<void>((resolve) => server.close(() => resolve()));
  server.closeIdleConnections();
  // Cancelling every job removes the running containers and answers the waiting reads.
  await queue.close();
  server.closeIdleConnections();
  setTimeout(() => server.closeAllConnections(), 2000).unref();
  await closed;
  console.log("Runner service stopped.");
  process.exit(0);
}

process.on("SIGINT", (signal) => void shutdown(signal));
process.on("SIGTERM", (signal) => void shutdown(signal));
