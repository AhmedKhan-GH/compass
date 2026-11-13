"use client";
import { useEffect, useState } from "react";
import type { RunHistoryPage, RunSummary } from "@compass/schema";
import { StatusMark, WordButton } from "@compass/ui";
import { listRuns } from "@/lib/api";
import { formatDuration, formatWhen, runResult, runScope, runStatus } from "@/lib/runs";
import { RowNavigation } from "../row-navigation";

type Loaded = { key: string; page: RunHistoryPage; more: RunSummary[]; cursor: string | null };

/** Every run of the item, newest first. Opening one shows it in Results and Waveform. */
export function HistoryPane({
  courseId,
  itemSlug,
  version,
  revision,
  shownId,
  now,
  onOpen,
}: {
  courseId: string;
  itemSlug: string;
  /** Changes when a run finishes, to read the list again. */
  version: number;
  revision: string;
  shownId: string | undefined;
  now: Date;
  onOpen: (run: RunSummary) => void;
}) {
  const key = `${courseId}/${itemSlug}/${version}`;
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState<{ key: string; message: string }>();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listRuns(courseId, itemSlug, undefined, controller.signal).then(
      (page) => setLoaded({ key, page, more: [], cursor: page.nextCursor }),
      (reason: unknown) => {
        if (!controller.signal.aborted)
          setError({ key, message: reason instanceof Error ? reason.message : String(reason) });
      },
    );
    return () => controller.abort();
  }, [courseId, itemSlug, key]);

  async function loadMore() {
    if (!loaded?.cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listRuns(courseId, itemSlug, loaded.cursor);
      setLoaded({ ...loaded, more: [...loaded.more, ...page.runs], cursor: page.nextCursor });
    } catch (reason) {
      setError({ key, message: reason instanceof Error ? reason.message : String(reason) });
    } finally {
      setLoadingMore(false);
    }
  }

  if (error?.key === key)
    return (
      <div className="history">
        <div className="results-summary">
          <StatusMark status="unavailable" label="History unavailable" />
          <span className="results-message">{error.message}</span>
        </div>
      </div>
    );
  if (!loaded || loaded.key !== key) return <div className="history" aria-busy="true" />;
  const runs = [...loaded.page.runs, ...loaded.more];
  if (!runs.length)
    return (
      <div className="history waveform-empty">
        <span className="sb-faint">No runs</span>
      </div>
    );
  return (
    <div className="history">
      <RowNavigation className="history-table">
        <div className="history-head" aria-hidden="true">
          <span className="sb-label numeric">No.</span>
          <span className="sb-label">Run</span>
          <span className="sb-label">Result</span>
          <span className="sb-label numeric">Time</span>
          <span className="sb-label">Finished</span>
          <span className="sb-label">Revision</span>
        </div>
        <ol className="sb-list" aria-label="Runs">
          {runs.map((run, index) => (
            <li key={run.id}>
              <button
                type="button"
                className="history-row sb-row"
                data-row
                aria-current={run.id === shownId || undefined}
                data-selected={run.id === shownId || undefined}
                onClick={() => onOpen(run)}
              >
                <span className="numeric sb-mono">{loaded.page.total - index}</span>
                <span className="sb-row-name">{runScope(run)}</span>
                <StatusMark status={runStatus(run)} label={runResult(run)} />
                <span className="numeric sb-mono">{formatDuration(run.durationMs)}</span>
                <span className="sb-mono">{formatWhen(run.finishedAt ?? run.createdAt, now)}</span>
                <span className="sb-mono">{run.revision === revision ? "Current" : run.revision.slice(0, 7)}</span>
              </button>
            </li>
          ))}
        </ol>
      </RowNavigation>
      <div className="history-footer">
        <span className="sb-muted">
          {runs.length} of {loaded.page.total}
        </span>
        {loaded.cursor && (
          <WordButton onClick={loadMore} disabled={loadingMore}>
            Older runs
          </WordButton>
        )}
      </div>
    </div>
  );
}
