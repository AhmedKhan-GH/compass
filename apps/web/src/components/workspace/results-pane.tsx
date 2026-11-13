"use client";
import type { IndexedTask, RunRecord, TestResult } from "@compass/schema";
import { KeyButton, Label, StatusGlyph, StatusMark, WordButton } from "@compass/ui";
import type { JobPhase } from "@/lib/job-poll";
import {
  failureTitle,
  firstLine,
  formatDuration,
  formatWhen,
  runResult,
  runScope,
  runStatus,
  testCounts,
  testsByTask,
} from "@/lib/runs";

type Props = {
  phase: JobPhase<RunRecord>;
  run: RunRecord | undefined;
  /** Whether `run` is the latest run of the item. */
  latest: boolean;
  /** The run was made from other files than the editor holds now. */
  earlierSource: boolean;
  revision: string;
  tasks: readonly Pick<IndexedTask, "id" | "title" | "tests">[];
  currentTask: number | undefined;
  now: Date;
  onRunTests: () => void;
  onRunTask: () => void;
  onRestore: (run: RunRecord) => void;
  onShowLatest: () => void;
};

/** The results of the run in view: each test with its task, status, message and code; or the error and the log. */
export function ResultsPane(props: Props) {
  const { phase, run } = props;
  if (phase.phase === "starting" || phase.phase === "queued" || phase.phase === "running")
    return (
      <div className="results">
        <LiveSummary phase={phase} />
      </div>
    );
  return (
    <div className="results">
      {phase.phase === "error" && (
        <div className="results-summary">
          <StatusMark status="unavailable" label="Run not started" />
          <span className="results-message">{phase.message}</span>
        </div>
      )}
      {run ? <RunView {...props} run={run} /> : phase.phase !== "error" && <Empty {...props} />}
    </div>
  );
}

function LiveSummary({ phase }: { phase: JobPhase<RunRecord> }) {
  if (phase.phase === "starting")
    return (
      <div className="results-summary">
        <StatusMark status="queued" label="Starting" />
      </div>
    );
  if (phase.phase === "queued")
    return (
      <div className="results-summary">
        <StatusMark status="queued" label="Queued" />
        {phase.position !== undefined && (
          <span className="results-fact">{phase.position === 0 ? "Next" : `${phase.position} ahead`}</span>
        )}
        <span className="results-fact">{runScope(phase.record)}</span>
      </div>
    );
  if (phase.phase === "running")
    return (
      <div className="results-summary">
        <StatusMark status="running" label="Running" />
        <span className="results-fact">{runScope(phase.record)}</span>
      </div>
    );
  return null;
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
  onRestore,
  onShowLatest,
}: Props & { run: RunRecord }) {
  const status = runStatus(run);
  const counts = testCounts(run);
  return (
    <>
      <div className="results-summary">
        <StatusMark
          status={status}
          label={run.state === "succeeded" && run.report?.status === "error" ? "Error" : runResult(run)}
        />
        <span className="results-fact">{runScope(run)}</span>
        {counts && counts.errors > 0 && <span className="results-fact">{counts.errors} with errors</span>}
        {run.durationMs !== undefined && <span className="results-fact">{formatDuration(run.durationMs)}</span>}
        <span className="results-fact">{formatWhen(run.finishedAt ?? run.createdAt, now)}</span>
        {run.revision !== revision && <span className="results-flag">Earlier revision</span>}
        {earlierSource && <span className="results-flag">Earlier source</span>}
        {run.kind === "submission" && run.report?.status === "pass" && (
          <span className="results-flag">Exercise completed</span>
        )}
        <span className="sb-spacer" />
        {!latest && (
          <>
            <WordButton onClick={() => onRestore(run)}>Restore source</WordButton>
            <WordButton onClick={onShowLatest}>Latest run</WordButton>
          </>
        )}
      </div>
      {run.state === "failed" && (
        <section className="results-block">
          <Label>{failureTitle(run.error?.kind)}</Label>
          <p className="results-text">{run.error?.message}</p>
          {run.error?.diagnostics && <pre className="results-pre">{run.error.diagnostics}</pre>}
        </section>
      )}
      {run.state === "cancelled" && (
        <section className="results-block">
          <Label>Cancelled</Label>
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

function TestGroups({ tests, tasks }: { tests: readonly TestResult[]; tasks: Props["tasks"] }) {
  const groups = testsByTask(tests, tasks);
  return (
    <div className="results-groups">
      {groups.map((group) => {
        const passed = group.tests.filter((test) => test.status === "pass").length;
        return (
          <section key={group.taskId ?? "other"} className="results-group" aria-label={group.title ?? "Tests"}>
            {(tasks.length > 0 || group.taskId !== undefined) && (
              <h3 className="results-group-head">
                <span className="results-task-number">{group.taskId ?? "·"}</span>
                <span className="results-task-title">{group.title ?? "Other tests"}</span>
                <span className="results-fact">
                  {passed} of {group.tests.length} passed
                </span>
              </h3>
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
        {test.message && <span className="results-test-message">{firstLine(test.message)}</span>}
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
