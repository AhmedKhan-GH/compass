"use client";
import type { IndexedTask, RunRecord, TestResult } from "@compass/schema";
import { Banner, KeyButton, Label, StatusGlyph, WordButton, type Status } from "@compass/ui";
import type { JobPhase } from "@/lib/job-poll";
import { formatDuration, formatWhen, runOutcome, runScope, testsByTask, type TaskGroup } from "@/lib/runs";

type Task = Pick<IndexedTask, "id" | "title" | "tests">;

type Props = {
  phase: JobPhase<RunRecord>;
  run: RunRecord | undefined;
  /** Whether `run` is the latest run of the item. */
  latest: boolean;
  /** The run was made from other files than the editor holds now. */
  earlierSource: boolean;
  revision: string;
  tasks: readonly Task[];
  currentTask: number | undefined;
  now: Date;
  /** Seconds since the run in progress started, while one is. */
  elapsed: string | undefined;
  nextItem: { title: string } | undefined;
  onRunTests: () => void;
  onRunTask: () => void;
  onRestore: (run: RunRecord) => void;
  onShowLatest: () => void;
  onNextItem: () => void;
};

/**
 * The results of the run in view. A banner at the top gives the state or the outcome in words; below it every task
 * of the item has a header row in its state's colour, and every test a row of its own.
 */
export function ResultsPane(props: Props) {
  const { phase, run, tasks } = props;
  if (phase.phase === "starting" || phase.phase === "queued" || phase.phase === "running") {
    const record = phase.phase === "starting" ? undefined : phase.record;
    const scope = record ? runScope(record) : undefined;
    const covered = (task: Task) => record?.taskId === undefined || record.taskId === task.id;
    return (
      <div className="results">
        <Banner
          tone="running"
          status={phase.phase === "running" ? "running" : "queued"}
          title={phase.phase === "running" ? "Running" : phase.phase === "queued" ? "Queued" : "Starting"}
          facts={
            <>
              {phase.phase === "queued" && phase.position !== undefined && (
                <span>{phase.position === 0 ? "Next" : `${phase.position} ahead`}</span>
              )}
              {scope && <span>{scope}</span>}
              {props.elapsed && <span>{props.elapsed}</span>}
            </>
          }
          className="results-banner"
        />
        {tasks.length > 0 && (
          <div className="results-groups">
            {tasks.map((task) => (
              <GroupHead
                key={task.id}
                taskId={task.id}
                title={task.title}
                status={covered(task) ? (phase.phase === "running" ? "running" : "queued") : "untested"}
                count={covered(task) ? (phase.phase === "running" ? "Running" : "Waiting") : "Not run"}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="results">
      {phase.phase === "error" && (
        <Banner
          tone="warning"
          status="unavailable"
          title="Run not started"
          detail={phase.message}
          className="results-banner"
        />
      )}
      {run ? <RunView {...props} run={run} /> : phase.phase !== "error" && <Empty {...props} />}
    </div>
  );
}

function Empty({ tasks, currentTask, onRunTests, onRunTask }: Props) {
  return (
    <div className="results-empty">
      <KeyButton chord="Mod+Enter" onClick={onRunTests}>
        Run tests
      </KeyButton>
      {tasks.length > 0 && currentTask !== undefined && (
        <KeyButton chord="Alt+Enter" onClick={onRunTask}>
          Run task {currentTask}
        </KeyButton>
      )}
    </div>
  );
}

function RunView({
  run,
  latest,
  earlierSource,
  revision,
  tasks,
  now,
  nextItem,
  onRestore,
  onShowLatest,
  onNextItem,
}: Props & { run: RunRecord }) {
  const outcome = runOutcome(run, tasks);
  const completed = run.kind === "submission" && run.report?.status === "pass";
  return (
    <>
      <Banner
        tone={outcome.tone}
        status={outcome.status}
        title={completed ? "Exercise completed" : outcome.title}
        facts={
          <>
            {completed && <span>{outcome.title}</span>}
            <span>{runScope(run)}</span>
            {run.durationMs !== undefined && <span>{formatDuration(run.durationMs)}</span>}
            <span>{formatWhen(run.finishedAt ?? run.createdAt, now)}</span>
            {run.revision !== revision && <span className="results-flag">Earlier revision</span>}
            {earlierSource && <span className="results-flag">Earlier source</span>}
          </>
        }
        detail={outcome.detail}
        actions={
          <>
            {!latest && (
              <>
                <WordButton onClick={() => onRestore(run)}>Restore source</WordButton>
                <WordButton onClick={onShowLatest}>Latest run</WordButton>
              </>
            )}
            {completed && latest && nextItem && (
              <KeyButton chord="Alt+Shift+BracketRight" onClick={onNextItem}>
                Next exercise
              </KeyButton>
            )}
          </>
        }
        className="results-banner"
      />
      {run.error?.diagnostics && (
        <section className="results-block">
          <Label>Diagnostics</Label>
          <pre className="results-pre">{run.error.diagnostics}</pre>
        </section>
      )}
      {run.report?.status === "error" && (
        <section className="results-block">
          <Label>Message</Label>
          <pre className="results-pre">{run.report.message}</pre>
        </section>
      )}
      {run.report && run.report.status !== "error" && <TestGroups tests={run.report.tests} tasks={tasks} />}
      {run.log !== undefined && run.log.trim() !== "" && (
        <details className="results-log" open={run.report?.status === "error"}>
          <summary className="results-log-summary">
            <Label>Log</Label>
            <span className="results-fact">{run.log.split("\n").length} lines</span>
          </summary>
          <pre className="results-pre">{run.log}</pre>
        </details>
      )}
    </>
  );
}

function groupStatus(group: TaskGroup): Status {
  if (!group.tests.length) return "untested";
  return group.tests.every((test) => test.status === "pass") ? "passed" : "failed";
}

function TestGroups({ tests, tasks }: { tests: readonly TestResult[]; tasks: readonly Task[] }) {
  const groups = testsByTask(tests, tasks, { includeEmpty: true });
  return (
    <div className="results-groups">
      {groups.map((group) => {
        const passed = group.tests.filter((test) => test.status === "pass").length;
        const status = groupStatus(group);
        return (
          <section key={group.taskId ?? "other"} className="results-group" aria-label={group.title ?? "Tests"}>
            {(tasks.length > 0 || group.taskId !== undefined) && (
              <GroupHead
                taskId={group.taskId}
                title={group.title ?? "Other tests"}
                status={status}
                count={group.tests.length ? `${passed} of ${group.tests.length} passed` : "Not run"}
              />
            )}
            {group.tests.map((test, index) => (
              <TestRow key={`${test.name}-${index}`} test={test} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** A task's header row: its number, title, status glyph and count, on its state's tint. */
function GroupHead({
  taskId,
  title,
  status,
  count,
}: {
  taskId: number | undefined;
  title: string;
  status: Status;
  count: string;
}) {
  return (
    <h3 className="results-group-head" data-status={status}>
      <span className="results-task-number">{taskId ?? "·"}</span>
      <StatusGlyph status={status} />
      <span className="results-task-title">{title}</span>
      <span className="results-count">{count}</span>
    </h3>
  );
}

function TestRow({ test }: { test: TestResult }) {
  const status = test.status === "pass" ? "passed" : test.status === "fail" ? "failed" : "error";
  return (
    <details className="results-test" data-status={status}>
      <summary className="results-test-row">
        <StatusGlyph
          status={status}
          title={status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Error"}
        />
        <span className="results-test-name">{test.name}</span>
        {test.message && <span className="results-test-message">{test.message.split("\n")[0]}</span>}
      </summary>
      <div className="results-test-detail">
        {test.message && (
          <>
            <Label>{test.status === "error" ? "Error" : "Failure"}</Label>
            <pre className="results-pre">{test.message}</pre>
          </>
        )}
        <Label>Test code</Label>
        <pre className="results-pre">{test.test_code}</pre>
      </div>
    </details>
  );
}
