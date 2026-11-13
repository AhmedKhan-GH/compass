/** The `compass` command. `bin/compass.mjs` calls `main` and exits with the code it returns. */
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { RunnerClient } from "@compass/runner-client";
import { checkAcrossPacks, checkPack } from "./checks.ts";
import { CompileError, compileContent, writeContent } from "./compile.ts";
import {
  ConfigError,
  defaultSettings,
  findRepositoryRoot,
  loadConfig,
  readConfig,
  type Environment,
  type Settings,
} from "./config.ts";
import { countBySeverity, hasErrors, locationText, type Diagnostic, type Rule } from "./diagnostics.ts";
import { planRuns, runDynamicChecks, type DynamicOptions, type PlannedRun } from "./dynamic.ts";
import { loadPacks, packName, type LoadedItem, type LoadedPack } from "./loader.ts";
import { COURSE_FILE, displayPath, packsUnder, resolveSources, type SourceResult } from "./sources.ts";

export type Output = { write(text: string): unknown; isTTY?: boolean };

export type CliOptions = {
  cwd?: string;
  env?: Environment;
  stdout?: Output;
  stderr?: Output;
  /** Creates the runner client; tests pass a fake. */
  createRunner?: (url: string) => RunnerClient | Promise<RunnerClient>;
  /** Overrides for the dynamic checks, for tests. */
  dynamic?: Pick<DynamicOptions, "concurrency" | "jobTimeoutMs" | "retryDelayMs">;
};

export const EXIT_OK = 0;
export const EXIT_ERRORS = 1;
export const EXIT_USAGE = 2;

const HELP = `Usage: compass <command> [options]

Commands:
  content build [--out <path>]
      Run the static checks on the configured packs, then write the content index.
      Nothing is written when there are errors.
  content check [--static] [--source <dir>] [<course-id>...]
      Run the static checks, then the runs on the runner service: the reference
      passes, each wrong solution fails, each stage passes its tasks.
  content list
      List the packs and their items.

Options:
  --out <path>      Where build writes the index. The default is COMPASS_CONTENT_INDEX,
                    or .compass/content-index.json under the repository root.
  --static          Run only the checks that need no runner.
  --item <slug>     Check only this item in the selected courses; repeat for a batch.
                    Prerequisites are still checked against the full course order.
  --source <dir>    Check the packs under <dir> instead of the configured sources.
                    <dir> may also be a single pack.
  -h, --help        Show this help.

Configuration:
  compass.config.toml in the repository root, found from the working directory.
  Environment overrides: COMPASS_RUNNER_URL, COMPASS_RUNNER_PORT,
  COMPASS_CONTENT_INDEX, COMPASS_DATA_DIR.

Exit status: 0 without errors, 1 with errors, 2 for a usage error.
`;

class Io {
  readonly cwd: string;
  readonly env: Environment;
  private readonly stdout: Output;
  private readonly stderr: Output;
  private readonly colour: boolean;

  constructor(options: CliOptions) {
    this.cwd = path.resolve(options.cwd ?? process.cwd());
    this.env = options.env ?? process.env;
    this.stdout = options.stdout ?? process.stdout;
    this.stderr = options.stderr ?? process.stderr;
    this.colour = this.stdout.isTTY === true && this.env.NO_COLOR === undefined && this.env.TERM !== "dumb";
  }

  out(line = ""): void {
    this.stdout.write(`${line}\n`);
  }

  err(line = ""): void {
    this.stderr.write(`${line}\n`);
  }

  paint(text: string, tone: "error" | "warning" | "ok" | "dim"): string {
    if (!this.colour) return text;
    const code = { error: 31, warning: 33, ok: 32, dim: 2 }[tone];
    return `\u001b[${code}m${text}\u001b[0m`;
  }
}

export async function main(argv: string[], options: CliOptions = {}): Promise<number> {
  const io = new Io(options);
  const [group, command, ...rest] = argv;
  if (group === undefined) {
    io.err(HELP.trimEnd());
    return EXIT_USAGE;
  }
  if (group === "--help" || group === "-h" || group === "help") {
    io.out(HELP.trimEnd());
    return EXIT_OK;
  }
  if (group !== "content") return usage(io, `unknown command ${group}`);
  if (command === undefined || command === "--help" || command === "-h" || command === "help") {
    if (command === undefined) {
      io.err(HELP.trimEnd());
      return EXIT_USAGE;
    }
    io.out(HELP.trimEnd());
    return EXIT_OK;
  }
  try {
    switch (command) {
      case "build":
        return await build(io, rest);
      case "check":
        return await check(io, rest, options);
      case "list":
        return await list(io, rest);
      default:
        return usage(io, `unknown command content ${command}`);
    }
  } catch (error) {
    if (isUsageError(error)) return usage(io, (error as Error).message);
    if (error instanceof ConfigError) {
      io.err(`compass: ${error.message}`);
      return EXIT_ERRORS;
    }
    throw error;
  }
}

function usage(io: Io, message: string): number {
  io.err(`compass: ${message}. Run compass --help for the commands.`);
  return EXIT_USAGE;
}

function isUsageError(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) return false;
  return typeof error.code === "string" && error.code.startsWith("ERR_PARSE_ARGS");
}

type Gathered = { packs: LoadedPack[]; sourceDiagnostics: Diagnostic[]; settings: Settings };

/** Finds and loads the packs: from the configured sources, or from `--source <dir>`. */
async function gather(io: Io, source: string | undefined): Promise<Gathered> {
  let settings: Settings;
  let found: SourceResult;
  if (source !== undefined) {
    const root = findRepositoryRoot(io.cwd);
    settings = defaultSettings(io.cwd, io.env);
    if (root) {
      try {
        settings = await readConfig(root, io.env);
      } catch (error) {
        if (!(error instanceof ConfigError)) throw error;
        io.err(`compass: ${error.message} Using the default runner address.`);
      }
    }
    const directory = path.resolve(io.cwd, source);
    const context = { root: io.cwd, cwd: io.cwd, cacheDirectory: path.join(settings.dataDirectory, "sources") };
    const label = displayPath(directory, io.cwd);
    if (existsSync(path.join(directory, COURSE_FILE)))
      found = { packs: [{ directory, label, source: `local:${label}` }], diagnostics: [] };
    else found = await packsUnder(directory, context, `local:${label}`);
  } else {
    const config = await loadConfig(io.cwd, io.env);
    settings = config;
    const context = { root: config.root, cwd: io.cwd, cacheDirectory: path.join(config.dataDirectory, "sources") };
    found = await resolveSources(config.sources, context);
  }
  return { packs: await loadPacks(found.packs), sourceDiagnostics: found.diagnostics, settings };
}

async function staticDiagnostics(packs: readonly LoadedPack[]): Promise<Map<LoadedPack, Diagnostic[]>> {
  const byPack = new Map<LoadedPack, Diagnostic[]>();
  for (const pack of packs) byPack.set(pack, await checkPack(pack));
  for (const diagnostic of checkAcrossPacks(packs)) {
    const pack = packs.find((candidate) => candidate.location.label === diagnostic.pack);
    if (pack) byPack.get(pack)?.push(diagnostic);
  }
  return byPack;
}

// ---- build

async function build(io: Io, args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    options: { out: { type: "string" }, help: { type: "boolean", short: "h" } },
    allowPositionals: true,
    strict: true,
  });
  if (values.help) {
    io.out(HELP.trimEnd());
    return EXIT_OK;
  }
  if (positionals.length > 0) return usage(io, `content build takes no arguments, not ${positionals.join(" ")}`);
  const { packs, sourceDiagnostics, settings } = await gather(io, undefined);
  const byPack = await staticDiagnostics(packs);
  const all = [...sourceDiagnostics, ...[...byPack.values()].flat()];
  printDiagnostics(io, all);
  const { errors, warnings } = countBySeverity(all);
  if (errors > 0) {
    io.out(`The index was not written: ${plural(errors, "error")}${warnings ? `, ${plural(warnings, "warning")}` : ""}.`);
    return EXIT_ERRORS;
  }
  if (packs.length === 0) io.out("No packs were found; the index will hold no courses.");
  let compiled;
  try {
    compiled = compileContent(packs);
  } catch (error) {
    if (!(error instanceof CompileError)) throw error;
    io.err(`compass: ${error.message}`);
    return EXIT_ERRORS;
  }
  const target = values.out !== undefined ? path.resolve(io.cwd, values.out) : settings.contentIndexPath;
  await writeContent(target, compiled);
  const { index, assets } = compiled;
  const items = index.courses.reduce((sum, course) => sum + course.items.length, 0);
  const parts = [plural(index.courses.length, "course"), plural(items, "item")];
  if (assets.size > 0) parts.push(plural(assets.size, "icon"));
  if (warnings) parts.push(plural(warnings, "warning"));
  io.out(`Wrote ${displayPath(target, io.cwd)}: ${parts.join(", ")}.`);
  return EXIT_OK;
}

// ---- check

/** Item errors from these rules mean the item's jobs cannot be trusted to run, so its runs are skipped. */
const BLOCKING_RULES: ReadonlySet<Rule> = new Set(["manifest", "files", "design", "tasks"]);

async function check(io: Io, args: string[], options: CliOptions): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      static: { type: "boolean" },
      item: { type: "string", multiple: true },
      source: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
    strict: true,
  });
  if (values.help) {
    io.out(HELP.trimEnd());
    return EXIT_OK;
  }
  const gathered = await gather(io, values.source);
  let packs = gathered.packs;
  if (positionals.length > 0) {
    const wanted = new Set(positionals);
    const unknown = positionals.filter((id) => !packs.some((pack) => pack.manifest?.id === id));
    if (unknown.length > 0) {
      io.err(`compass: no pack has the course id ${unknown.join(", ")}.`);
      return EXIT_ERRORS;
    }
    packs = packs.filter((pack) => pack.manifest !== undefined && wanted.has(pack.manifest.id));
  }
  const wantedItems = values.item ? new Set(values.item) : undefined;
  if (wantedItems) {
    const unknown = [...wantedItems].filter((slug) => !packs.some((pack) => pack.items.some((item) => item.slug === slug)));
    if (unknown.length > 0) {
      io.err(`compass: no selected course has the item ${unknown.join(", ")}.`);
      return EXIT_ERRORS;
    }
  }
  // Static checks need the complete course for prerequisites; report and run only the selected items afterwards.
  let byPack = await staticDiagnostics(packs);
  if (wantedItems) {
    const selectedDiagnostics = new Map<LoadedPack, Diagnostic[]>();
    packs = packs.flatMap((pack) => {
      const items = pack.items.filter((item) => wantedItems.has(item.slug));
      if (items.length === 0) return [];
      const selected = { ...pack, items };
      selectedDiagnostics.set(selected, (byPack.get(pack) ?? []).filter((d) => !d.item || wantedItems.has(d.item)));
      return [selected];
    });
    byPack = selectedDiagnostics;
  }
  const runsByItem = new Map<LoadedItem, number>();
  const notRun = new Set<LoadedItem>();
  let unreachable: string | undefined;

  if (!values.static) {
    const planned: PlannedRun[] = [];
    for (const pack of packs) {
      const diagnostics = byPack.get(pack) ?? [];
      const packBlocked = !pack.manifest || diagnostics.some((d) => d.severity === "error" && d.rule === "kinds");
      const eligible = pack.items.filter((item) => {
        const blocked =
          packBlocked ||
          diagnostics.some((d) => d.severity === "error" && d.item === item.slug && BLOCKING_RULES.has(d.rule));
        if (blocked) notRun.add(item);
        return !blocked;
      });
      const plan = planRuns(pack, eligible);
      diagnostics.push(...plan.diagnostics);
      planned.push(...plan.runs);
    }
    if (planned.length > 0) {
      const client = await createClient(io, options, gathered.settings.runnerUrl);
      io.err(`Running ${plural(planned.length, "check")} on the runner service at ${client.url}.`);
      const result = await runDynamicChecks(planned, { client, ...options.dynamic });
      unreachable = result.unreachable;
      for (const { run } of result.outcomes) runsByItem.set(run.item, (runsByItem.get(run.item) ?? 0) + 1);
      for (const diagnostic of result.diagnostics) {
        const pack = packs.find((candidate) => candidate.location.label === diagnostic.pack);
        if (pack) byPack.get(pack)?.push(diagnostic);
      }
      if (unreachable !== undefined) for (const run of planned) if (!runsByItem.has(run.item)) notRun.add(run.item);
    }
  }

  printResults(io, packs, byPack, values.static ? undefined : { runsByItem, notRun });
  const all = [...gathered.sourceDiagnostics, ...[...byPack.values()].flat()];
  if (all.length > 0) io.out();
  printDiagnostics(io, all);
  const { errors, warnings } = countBySeverity(all);
  const items = packs.reduce((sum, pack) => sum + pack.items.length, 0);
  const tally = errors || warnings ? [errors ? plural(errors, "error") : "", warnings ? plural(warnings, "warning") : ""].filter(Boolean).join(", ") : "no errors";
  const scope = values.static ? " (static checks only)" : "";
  const missing = unreachable === undefined ? "" : "; the runs did not take place";
  io.out(`Checked ${plural(packs.length, "pack")} and ${plural(items, "item")}${scope}: ${tally}${missing}.`);
  if (unreachable !== undefined) {
    io.err(`compass: ${unreachable} Start it with npm run runner, or run compass content check --static.`);
    return EXIT_ERRORS;
  }
  return errors > 0 || hasErrors(gathered.sourceDiagnostics) ? EXIT_ERRORS : EXIT_OK;
}

async function createClient(io: Io, options: CliOptions, url: string): Promise<RunnerClient> {
  if (options.createRunner) return options.createRunner(url);
  const { createRunnerClient } = await import("@compass/runner-client");
  return createRunnerClient({ url });
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function tallyText(io: Io, diagnostics: readonly Diagnostic[]): string {
  const { errors, warnings } = countBySeverity(diagnostics);
  if (errors === 0 && warnings === 0) return io.paint("ok", "ok");
  const parts: string[] = [];
  if (errors) parts.push(io.paint(plural(errors, "error"), "error"));
  if (warnings) parts.push(io.paint(plural(warnings, "warning"), "warning"));
  return parts.join(", ");
}

function printResults(
  io: Io,
  packs: readonly LoadedPack[],
  byPack: ReadonlyMap<LoadedPack, Diagnostic[]>,
  dynamic: { runsByItem: ReadonlyMap<LoadedItem, number>; notRun: ReadonlySet<LoadedItem> } | undefined,
): void {
  for (const pack of packs) {
    const diagnostics = byPack.get(pack) ?? [];
    const name = packName(pack);
    const where = name === pack.location.label ? "" : `  ${io.paint(pack.location.label, "dim")}`;
    const plan =
      pack.manifest?.status === "in-development"
        ? `  ${io.paint(`(in development, ${pack.manifest.planned.length} planned)`, "dim")}`
        : "";
    io.out(`${name}${where}  ${tallyText(io, diagnostics)}${plan}`);
    const width = Math.max(0, ...pack.items.map((item) => item.slug.length));
    for (const item of pack.items) {
      let line = `  ${item.slug.padEnd(width)}  ${tallyText(io, diagnostics.filter((d) => d.item === item.slug))}`;
      if (dynamic) {
        const runs = dynamic.runsByItem.get(item);
        if (dynamic.notRun.has(item)) line += `  ${io.paint("(not run)", "dim")}`;
        else if (runs !== undefined) line += `  ${io.paint(`(${plural(runs, "run")})`, "dim")}`;
      }
      io.out(line);
    }
  }
}

function printDiagnostics(io: Io, diagnostics: readonly Diagnostic[]): void {
  const ordered = [
    ...diagnostics.filter((d) => d.severity === "error"),
    ...diagnostics.filter((d) => d.severity === "warning"),
  ];
  for (const diagnostic of ordered)
    io.out(`${locationText(diagnostic)}: ${io.paint(diagnostic.severity, diagnostic.severity)}: ${diagnostic.message}`);
}

// ---- list

async function list(io: Io, args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    options: { help: { type: "boolean", short: "h" } },
    allowPositionals: true,
    strict: true,
  });
  if (values.help) {
    io.out(HELP.trimEnd());
    return EXIT_OK;
  }
  if (positionals.length > 0) return usage(io, `content list takes no arguments, not ${positionals.join(" ")}`);
  const { packs, sourceDiagnostics } = await gather(io, undefined);
  printDiagnostics(io, sourceDiagnostics);
  if (packs.length === 0) io.out("No packs were found.");
  for (const pack of packs) {
    const manifest = pack.manifest;
    if (!manifest) {
      io.out(`${pack.location.label}  (course.toml has errors; run compass content check)`);
      continue;
    }
    const counts = [plural(pack.items.length, "item")];
    if (manifest.planned.length > 0 || manifest.status === "in-development") counts.push(`${manifest.planned.length} planned`);
    io.out(
      `${manifest.id}  ${manifest.title}  ${io.paint(`(${manifest.version}, ${manifest.status}, ${counts.join(", ")}, ${pack.location.label})`, "dim")}`,
    );
    const width = Math.max(0, ...pack.items.map((item) => item.slug.length));
    const number = String(pack.items.length).length;
    pack.items.forEach((item, index) => {
      const position = String(index + 1).padStart(number);
      const detail = item.manifest
        ? `${item.manifest.kind.padEnd(8)}  ${item.manifest.title}${item.manifest.status === "active" ? "" : `  (${item.manifest.status})`}`
        : "(item.toml has errors)";
      io.out(`  ${position}  ${item.slug.padEnd(width)}  ${detail}`);
    });
  }
  return hasErrors(sourceDiagnostics) ? EXIT_ERRORS : EXIT_OK;
}
