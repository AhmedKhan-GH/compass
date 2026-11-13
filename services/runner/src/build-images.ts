/**
 * Builds the Docker image of every runner kind in the registry, or of the kinds named on the command line.
 * Usage: tsx src/build-images.ts [kind ...]
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { RUNNER_KINDS, isRunnerKind, type RunnerKind } from "@compass/schema";
import { IMAGES_DIRECTORY } from "./sandbox.ts";

function build(kind: RunnerKind): Promise<void> {
  const { image, imageDirectory } = RUNNER_KINDS[kind];
  const context = path.join(IMAGES_DIRECTORY, imageDirectory);
  console.log(`Building ${image} for ${kind} from ${context}`);
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["build", "--tag", image, context], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`docker build for ${kind} exited with ${code}.`)),
    );
  });
}

const requested = process.argv.slice(2);
for (const name of requested)
  if (!isRunnerKind(name)) {
    console.error(`Unknown runner kind: ${name}. Known kinds: ${Object.keys(RUNNER_KINDS).join(", ")}.`);
    process.exit(2);
  }
const kinds = (requested.length ? requested : Object.keys(RUNNER_KINDS)).filter(isRunnerKind);
try {
  for (const kind of kinds) await build(kind);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
