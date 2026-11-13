import type { ReactNode } from "react";
import { join } from "./classes.ts";

/**
 * Status marks. Each status has its own glyph shape, and the word beside it says the same, so nothing depends on
 * colour. Only the glyphs of `passed` and `failed`/`error` are drawn in the data colours.
 */
export type Status =
  | "untested"
  | "passed"
  | "failed"
  | "error"
  | "queued"
  | "running"
  | "cancelled"
  | "unavailable"
  | "not-started"
  | "in-progress"
  | "completed";

const WORDS: Record<Status, string> = {
  untested: "Not run",
  passed: "Passed",
  failed: "Failed",
  error: "Error",
  queued: "Queued",
  running: "Running",
  cancelled: "Cancelled",
  unavailable: "Unavailable",
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

export function statusWord(status: Status): string {
  return WORDS[status];
}

/** The glyph alone, 12 × 12, for places where the word stands beside it already (a task number, a row label). */
export function StatusGlyph({ status, title }: { status: Status; title?: string }) {
  return (
    <svg
      className="sb-status-glyph"
      data-status={status}
      viewBox="0 0 12 12"
      width="12"
      height="12"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {glyph(status)}
    </svg>
  );
}

/** The glyph and its word: "✓ Passed". `label` replaces the word, for example "2 of 3 passed". */
export function StatusMark({ status, label, className }: { status: Status; label?: string; className?: string }) {
  return (
    <span className={join("sb-status", className)} data-status={status}>
      <StatusGlyph status={status} />
      <span className="sb-status-word">{label ?? WORDS[status]}</span>
    </span>
  );
}

function glyph(status: Status) {
  switch (status) {
    case "passed":
    case "completed":
      return <path d="M2.5 6.2 5 8.7 9.6 3.4" fill="none" strokeWidth="1.5" strokeLinecap="square" />;
    case "failed":
      return <path d="M3 3 9 9M9 3 3 9" fill="none" strokeWidth="1.5" strokeLinecap="square" />;
    case "error":
      return (
        <>
          <rect x="5.25" y="1.5" width="1.5" height="6" />
          <rect x="5.25" y="9" width="1.5" height="1.5" />
        </>
      );
    case "queued":
      return <path d="M6 1.8 10.2 6 6 10.2 1.8 6Z" fill="none" strokeWidth="1" />;
    case "running":
      return <path d="M6 1.8 10.2 6 6 10.2 1.8 6Z" strokeWidth="1" />;
    case "in-progress":
      return (
        <>
          <rect x="2.5" y="2.5" width="7" height="7" fill="none" strokeWidth="1" />
          <rect x="2.5" y="2.5" width="3.5" height="7" />
        </>
      );
    case "unavailable":
      return (
        <>
          <rect x="2.5" y="2.5" width="7" height="7" fill="none" strokeWidth="1" />
          <path d="M2.5 9.5 9.5 2.5" fill="none" strokeWidth="1" />
        </>
      );
    case "cancelled":
      return <path d="M2.5 6h7" fill="none" strokeWidth="1.5" />;
    case "untested":
    case "not-started":
      return <rect x="2.5" y="2.5" width="7" height="7" fill="none" strokeWidth="1" />;
  }
}

export type Tone = "running" | "passed" | "failed" | "warning" | "information" | "neutral";

/**
 * The outcome of an action, in words, on its state's tint: a glyph and a title, facts after the title, actions on
 * the right, and a detail line below.
 */
export function Banner({
  tone,
  status,
  title,
  facts,
  detail,
  actions,
  className,
}: {
  tone: Tone;
  status: Status;
  title: string;
  facts?: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={join("sb-banner", className)} data-tone={tone} role="status" aria-live="polite">
      <div className="sb-banner-head">
        <StatusGlyph status={status} />
        <span className="sb-banner-title">{title}</span>
        {facts && <span className="sb-banner-facts">{facts}</span>}
        <span className="sb-spacer" />
        {actions}
      </div>
      {detail && <div className="sb-banner-detail">{detail}</div>}
    </section>
  );
}
