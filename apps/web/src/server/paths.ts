import { existsSync } from "node:fs";
import path from "node:path";

let root: string | undefined;

/** The repository root: the nearest ancestor of the working directory that holds compass.config.toml. */
export function repositoryRoot(): string {
  if (root) return root;
  let directory = process.cwd();
  for (;;) {
    if (existsSync(path.join(directory, "compass.config.toml"))) return (root = directory);
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error("compass.config.toml was not found above " + process.cwd());
    directory = parent;
  }
}

/** The directory for local data such as the SQLite store. */
export function dataDirectory(): string {
  return path.resolve(repositoryRoot(), process.env.COMPASS_DATA_DIR ?? ".compass");
}
