/**
 * The dynamic checks: jobs submitted to the runner service through an injected RunnerClient.
 * The reference passes every test; every wrong solution fails a test; each stage passes the tests of its task
 * and of every earlier task.
 */
import {
  RunnerRequestError,
  RunnerUnavailableError,
  type RunnerClient,
} from "@compass/runner-client";
import {
  RUNNER_KINDS,
  TestJobRequest,
  isTerminal,
  isTestRunnerKind,
  type CourseManifest,
  type Job,
  type RunReport,
  type TestResult,
} from "@compass/schema";
import { DiagnosticList, issueText, type Diagnostic } from "./diagnostics.ts";
import { compareText } from "./files.ts";
import type { LoadedItem, LoadedPack } from "./loader.ts";
import { findCocotbTests } from "./python.ts";

export type Variant =
  | { kind: "reference"; name: string }
  | { kind: "wrong"; name: string }
  | { kind: "stage"; name: string; task: number };

export type PlannedRun = {
  pack: LoadedPack;
  item: LoadedItem;
  variant: Variant;
  /** The variant's source file, relative to the pack. */
  file: string;
  request: TestJobRequest;
};

export type RunOutcome =
  | { kind: "report"; report: RunReport }
  | { kind: "failed"; errorKind: string; message: string }
  | { kind: "cancelled" }
  /** The client could not get a result: a refused job, a wait that ran out, an expired job. */
  | { kind: "lost"; message: string };

export const DEFAULT_CONCURRENCY = 4;
export const DEFAULT_JOB_TIMEOUT_MS = 10 * 60_000;

const FOLDER: Record<Variant["kind"], string> = { reference: "reference", wrong: "wrong", stage: "stages" };

/**
 * The job that runs a variant of the item: the starter files with the solution file replaced by the variant.
 * Editable support files are replaced by reference/<name>, for the reference and also for wrong solutions and
 * stages, so that a run differs from the reference only in the solution file.
 */
export function buildTestJob(
  course: CourseManifest,
  item: LoadedItem,
  variant: Variant,
): { ok: true; request: TestJobRequest } | { ok: false; message: string } {
  const manifest = item.manifest;
  if (!manifest || !item.checks) return { ok: false, message: "the item has errors, so no job can be built" };
  if (course.runner === undefined) return { ok: false, message: "the course names no runner" };
  if (!isTestRunnerKind(course.runner)) return { ok: false, message: `${course.runner} is not a test runner` };
  const store = variant.kind === "reference" ? item.reference : variant.kind === "wrong" ? item.wrong : item.stages;
  const source = store.get(variant.name);
  if (source === undefined) return { ok: false, message: `${FOLDER[variant.kind]}/${variant.name} was not read` };
  const { design } = manifest;
  const files: [string, string][] = [];
  for (const name of [...new Set([design.solution, ...design.support])].sort(compareText)) {
    const content =
      name === design.solution
        ? source
        : design.editable.includes(name)
          ? item.reference.get(name)
          : item.starter.get(name);
    if (content === undefined) return { ok: false, message: `the file ${name} was not read` };
    files.push([name, content]);
  }
  const tasks = manifest.task ?? [];
  const request = {
    runner: course.runner,
    top: design.top,
    solution: design.solution,
    files: Object.fromEntries(files),
    checks: { name: item.checks.name, content: item.checks.content },
    itemKind: manifest.kind,
    ...(tasks.length > 0 ? { tasks: tasks.map((task) => ({ id: task.id, tests: [...task.tests] })) } : {}),
  };
  const parsed = TestJobRequest.safeParse(request);
  if (!parsed.success)
    return { ok: false, message: `the job is not valid: ${parsed.error.issues.map(issueText).join("; ")}` };
  return { ok: true, request: parsed.data };
}

/** The runs that check the item: its reference, each wrong solution, then each stage in task order. */
export function itemVariants(item: LoadedItem): Variant[] {
  const manifest = item.manifest;
  if (!manifest) return [];
  return [
    { kind: "reference", name: manifest.checks.reference },
    ...manifest.checks.wrong.map((name): Variant => ({ kind: "wrong", name })),
    ...(manifest.task ?? []).flatMap((task): Variant[] =>
      task.stage === undefined ? [] : [{ kind: "stage", name: task.stage, task: task.id }],
    ),
  ];
}

/** Plans the runs of the given items of a pack. A job that cannot be built is reported as an error instead. */
export function planRuns(
  pack: LoadedPack,
  items: readonly LoadedItem[],
): { runs: PlannedRun[]; diagnostics: Diagnostic[] } {
  const list = new DiagnosticList(pack.location.label);
  const runs: PlannedRun[] = [];
  const course = pack.manifest;
  // A course in development has no items, so nothing to run.
  if (!course || course.status === "in-development") return { runs, diagnostics: list.items };
  for (const item of items) {
    for (const variant of itemVariants(item)) {
      const file = `${item.path}/${FOLDER[variant.kind]}/${variant.name}`;
      const built = buildTestJob(course, item, variant);
      if (built.ok) runs.push({ pack, item, variant, file, request: built.request });
      else list.error(ruleOf(variant), built.message, { item: item.slug, file });
    }
  }
  return { runs, diagnostics: list.items };
}

function ruleOf(variant: Variant): "reference" | "wrong" | "stage" {
  return variant.kind;
}

function describe(variant: Variant): string {
  if (variant.kind === "reference") return "the reference";
  if (variant.kind === "wrong") return `the wrong solution ${variant.name}`;
  return `the stage of task ${variant.task}`;
}

function firstLine(text: string, limit = 240): string {
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
}

function testSummary(tests: readonly TestResult[], limit = 3): string {
  const shown = tests
    .slice(0, limit)
    .map((test) => (test.message ? `${test.name} (${firstLine(test.message, 160)})` : test.name));
  const more = tests.length > limit ? `, and ${tests.length - limit} more` : "";
  return shown.join("; ") + more;
}

/** The verdict on one run: the diagnostics it gives, none when the run behaved as required. */
export function judgeRun(run: PlannedRun, outcome: RunOutcome): Diagnostic[] {
  const list = new DiagnosticList(run.pack.location.label);
  const at = { item: run.item.slug, file: run.file };
  const rule = ruleOf(run.variant);
  const what = describe(run.variant);
  if (outcome.kind === "failed") {
    list.error(rule, `${what} could not be run (${outcome.errorKind}): ${firstLine(outcome.message)}`, at);
    return list.items;
  }
  if (outcome.kind === "cancelled") {
    list.error(rule, `the run of ${what} was cancelled`, at);
    return list.items;
  }
  if (outcome.kind === "lost") {
    list.error(rule, `the run of ${what} gave no result: ${firstLine(outcome.message)}`, at);
    return list.items;
  }
  const report = outcome.report;
  if (report.status === "error") {
    const suffix = run.variant.kind === "wrong" ? "; a wrong solution must compile and fail a test" : "";
    list.error(rule, `${what} reached no test verdict${suffix}: ${firstLine(report.message)}`, at);
    return list.items;
  }
  const tasks = run.item.manifest?.task ?? [];
  if (run.variant.kind === "reference") {
    const failing = report.tests.filter((test) => test.status !== "pass");
    if (report.status !== "pass" || failing.length > 0)
      list.error(rule, `the reference fails ${failing.length} of ${report.tests.length} tests: ${testSummary(failing)}`, at);
    const expected = run.item.checks ? findCocotbTests(run.item.checks.content).tests.length : undefined;
    if (expected !== undefined && report.tests.length !== expected)
      list.warning(rule, `the runner reported ${report.tests.length} test results; the checks file defines ${expected} tests`, at);
    return list.items;
  }
  if (run.variant.kind === "wrong") {
    if (report.status === "pass")
      list.error(rule, `${what} passes every test; a wrong solution must fail a test`, at);
    const errored = report.tests.filter((test) => test.status === "error");
    if (report.status === "fail" && errored.length > 0)
      list.warning(rule, `${what} makes tests stop with an error rather than fail: ${testSummary(errored)}`, at);
    return list.items;
  }
  for (const task of tasks) {
    if (task.id > run.variant.task) continue;
    const results = report.tests.filter((test) => test.task_id === task.id);
    if (results.length === 0) {
      list.error(rule, `the runner reported no results for task ${task.id}`, at);
      continue;
    }
    const failing = results.filter((test) => test.status !== "pass");
    if (failing.length > 0) list.error(rule, `${what} fails task ${task.id}: ${testSummary(failing)}`, at);
  }
  return list.items;
}

export type DynamicOptions = {
  client: RunnerClient;
  /** Jobs in flight at once. */
  concurrency?: number;
  /** How long to wait for one job, its time in the queue included. */
  jobTimeoutMs?: number;
  /** The pause before resubmitting a job the service refused with 429 (queue full). */
  retryDelayMs?: number;
  /** Called as each run finishes. */
  onRun?: (run: PlannedRun, outcome: RunOutcome) => void;
};

export type DynamicResult = {
  diagnostics: Diagnostic[];
  outcomes: { run: PlannedRun; outcome: RunOutcome }[];
  /** Set when the service could not be reached; the checks are then incomplete. */
  unreachable?: string;
};

class Unreachable extends Error {}

/** Submits the planned runs, at most `concurrency` at a time, and judges each. */
export async function runDynamicChecks(runs: readonly PlannedRun[], options: DynamicOptions): Promise<DynamicResult> {
  const { client } = options;
  const diagnostics: Diagnostic[] = [];
  const outcomes: { run: PlannedRun; outcome: RunOutcome }[] = [];
  if (runs.length === 0) return { diagnostics, outcomes };
  let health;
  try {
    health = await client.health();
  } catch (error) {
    return { diagnostics, outcomes, unreachable: unreachableMessage(client, error) };
  }

  const runnable: PlannedRun[] = [];
  const reported = new Set<string>();
  for (const run of runs) {
    const kind = run.request.runner;
    const entry = health.runners.find((runner) => runner.kind === kind);
    if (entry?.available) {
      runnable.push(run);
      continue;
    }
    const key = `${run.pack.location.label}\0${kind}`;
    if (reported.has(key)) continue;
    reported.add(key);
    const list = new DiagnosticList(run.pack.location.label);
    list.error(
      "runner",
      entry
        ? `the runner ${kind} is not available at ${client.url}: the image ${RUNNER_KINDS[kind].image} is not built or Docker is not running`
        : `the runner service at ${client.url} does not know the runner ${kind}`,
      { file: "course.toml" },
    );
    diagnostics.push(...list.items);
  }

  const results = new Array<RunOutcome | undefined>(runnable.length);
  let unreachable: string | undefined;
  let next = 0;
  const worker = async () => {
    while (unreachable === undefined && next < runnable.length) {
      const index = next++;
      const run = runnable[index];
      if (!run) break;
      try {
        const outcome = await execute(run, options);
        results[index] = outcome;
        options.onRun?.(run, outcome);
      } catch (error) {
        if (error instanceof Unreachable) unreachable ??= error.message;
        else throw error;
      }
    }
  };
  const width = Math.max(1, Math.min(options.concurrency ?? DEFAULT_CONCURRENCY, runnable.length));
  await Promise.all(Array.from({ length: width }, worker));

  runnable.forEach((run, index) => {
    const outcome = results[index];
    if (!outcome) return;
    outcomes.push({ run, outcome });
    diagnostics.push(...judgeRun(run, outcome));
  });
  return unreachable === undefined ? { diagnostics, outcomes } : { diagnostics, outcomes, unreachable };
}

function unreachableMessage(client: RunnerClient, error: unknown): string {
  if (error instanceof RunnerUnavailableError) return `The runner service at ${error.url} could not be reached.`;
  const detail = error instanceof Error ? error.message : String(error);
  return `The runner service at ${client.url} could not be reached: ${detail}`;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function execute(run: PlannedRun, options: DynamicOptions): Promise<RunOutcome> {
  const { client } = options;
  const timeoutMs = options.jobTimeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;
  let job: Job | undefined;
  for (let attempt = 0; !job; attempt++) {
    try {
      job = await client.submit(run.request);
    } catch (error) {
      if (error instanceof RunnerUnavailableError) throw new Unreachable(unreachableMessage(client, error));
      if (error instanceof RunnerRequestError && error.status === 429 && attempt < 60) {
        await delay((options.retryDelayMs ?? 1000) * Math.min(attempt + 1, 5));
        continue;
      }
      return { kind: "lost", message: `the runner service refused the job: ${(error as Error).message}` };
    }
  }
  if (!isTerminal(job.state)) {
    try {
      job = await client.waitFor(job.id, { timeoutMs });
    } catch (error) {
      if (error instanceof RunnerUnavailableError) throw new Unreachable(unreachableMessage(client, error));
      if (error instanceof RunnerRequestError && error.code === "wait-timeout") {
        await client.cancel(job.id).catch(() => undefined);
        return { kind: "lost", message: `no result after ${Math.round(timeoutMs / 1000)} s; the job was cancelled` };
      }
      return { kind: "lost", message: (error as Error).message };
    }
  }
  return outcomeOf(job);
}

export function outcomeOf(job: Job): RunOutcome {
  if (job.state === "succeeded") {
    if (job.result?.kind === "test") return { kind: "report", report: job.result.report };
    return { kind: "lost", message: "the job succeeded without a test result" };
  }
  if (job.state === "failed")
    return { kind: "failed", errorKind: job.error?.kind ?? "execution", message: job.error?.message ?? "no message" };
  if (job.state === "cancelled") return { kind: "cancelled" };
  return { kind: "lost", message: `the job is still ${job.state}` };
}
