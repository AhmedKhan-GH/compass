"use client";
import { useEffect, useRef, useState } from "react";
import type { CircuitRecord } from "@compass/schema";
import { KeyButton, Label, StatusMark, WordButton, type Theme } from "@compass/ui";
import type { JobPhase } from "@/lib/job-poll";
import { failureTitle } from "@/lib/runs";

/** A place in a source file, as yosys2digitaljs records it on a cell. */
export type SourcePosition = {
  name: string;
  from: { line: number; column: number };
  to: { line: number; column: number };
};

const MESSAGE = "compass-circuit";

function isPositions(value: unknown): value is SourcePosition[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as SourcePosition).name === "string" &&
        typeof (item as SourcePosition).from?.line === "number" &&
        typeof (item as SourcePosition).to?.line === "number",
    )
  );
}

type ForwardedKey = {
  code: string;
  key: string;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
};

function isKey(value: unknown): value is ForwardedKey {
  if (!value || typeof value !== "object") return false;
  const key = value as Record<string, unknown>;
  return (
    typeof key.code === "string" &&
    typeof key.key === "string" &&
    ["altKey", "metaKey", "ctrlKey", "shiftKey"].every((name) => typeof key[name] === "boolean")
  );
}

/**
 * The circuit of the current source, drawn by DigitalJS in a sandboxed frame (public/circuit/viewer.html). The pane
 * asks for a circuit, follows the job, and hands the finished circuit to the frame. A click on a cell in the frame
 * selects its source in the editor.
 */
export function CircuitPane({
  phase,
  record,
  theme,
  earlierSource,
  active,
  onBuild,
  onSelectSource,
}: {
  phase: JobPhase<CircuitRecord>;
  /** The latest finished circuit job, kept while a new one is built. */
  record: CircuitRecord | undefined;
  /** The page's theme, handed to the frame. */
  theme: Theme;
  earlierSource: boolean;
  /** The circuit tab is visible; the simulation runs only then. */
  active: boolean;
  onBuild: () => void;
  onSelectSource: (positions: SourcePosition[]) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // The frame starts in the theme of the moment it loads; later changes are sent to it.
  const [initialTheme] = useState(theme);
  const [frameError, setFrameError] = useState("");
  const [showWarnings, setShowWarnings] = useState(false);
  const circuit = record?.state === "succeeded" ? record.circuit : undefined;
  const busy = phase.phase === "starting" || phase.phase === "queued" || phase.phase === "running";
  const state = useRef({ circuit, active, earlierSource, onSelectSource, theme });
  useEffect(() => {
    state.current = { circuit, active, earlierSource, onSelectSource, theme };
  });

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (event.source !== frame.current?.contentWindow || !data || typeof data !== "object") return;
      const message = data as { type?: unknown; loaded?: unknown; error?: unknown; selection?: unknown; key?: unknown };
      if (message.type !== MESSAGE) return;
      // A key pressed in the frame: replayed on this window for the workspace's key bindings.
      if (isKey(message.key)) window.dispatchEvent(new KeyboardEvent("keydown", { ...message.key, cancelable: true }));
      if (message.loaded && state.current.circuit)
        frame.current?.contentWindow?.postMessage(
          { type: MESSAGE, circuit: state.current.circuit, active: state.current.active, theme: state.current.theme },
          "*",
        );
      if (typeof message.error === "string") setFrameError(message.error);
      if (!state.current.earlierSource && isPositions(message.selection))
        state.current.onSelectSource(message.selection);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (!circuit) return;
    frame.current?.contentWindow?.postMessage({ type: MESSAGE, circuit }, "*");
  }, [circuit]);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: MESSAGE, active }, "*");
  }, [active]);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: MESSAGE, theme }, "*");
  }, [theme]);

  return (
    <div className="circuit">
      {record?.warnings && (
        <div className="circuit-toolbar">
          <WordButton aria-expanded={showWarnings} onClick={() => setShowWarnings(!showWarnings)}>
            Warnings
          </WordButton>
        </div>
      )}
      {showWarnings && record?.warnings && <pre className="results-pre circuit-warnings">{record.warnings}</pre>}
      {record && record.state !== "succeeded" && (
        <section className="results-block">
          <Label>{record.state === "cancelled" ? "Cancelled" : failureTitle(record.error?.kind)}</Label>
          {record.error?.message && <p className="results-text">{record.error.message}</p>}
          {record.error?.diagnostics && <pre className="results-pre">{record.error.diagnostics}</pre>}
        </section>
      )}
      {frameError && (
        <section className="results-block">
          <Label>Drawing error</Label>
          <p className="results-text">{frameError}</p>
        </section>
      )}
      {circuit ? (
        <iframe
          ref={frame}
          title="Circuit"
          src={`/circuit/viewer.html?theme=${initialTheme}`}
          sandbox="allow-scripts"
          className="circuit-frame"
          onLoad={() => setFrameError("")}
        />
      ) : (
        !busy &&
        phase.phase !== "error" &&
        !record && (
          <div className="circuit-empty">
            <KeyButton chord="Alt+Shift+Enter" onClick={onBuild}>
              Build circuit
            </KeyButton>
          </div>
        )
      )}
    </div>
  );
}

/** The circuit's controls in the pane header: the build, its state, and whether the source changed since. */
export function CircuitActions({
  phase,
  earlierSource,
  onBuild,
}: {
  phase: JobPhase<CircuitRecord>;
  earlierSource: boolean;
  onBuild: () => void;
}) {
  const busy = phase.phase === "starting" || phase.phase === "queued" || phase.phase === "running";
  const built = phase.phase === "finished" && phase.record.state === "succeeded";
  return (
    <>
      <CircuitState phase={phase} />
      {built && earlierSource && <span className="results-flag">Earlier source</span>}
      <KeyButton chord="Alt+Shift+Enter" onClick={onBuild} disabled={busy}>
        Build
      </KeyButton>
    </>
  );
}

function CircuitState({ phase }: { phase: JobPhase<CircuitRecord> }) {
  switch (phase.phase) {
    case "idle":
      return null;
    case "starting":
      return <StatusMark status="queued" label="Starting" />;
    case "queued":
      return <StatusMark status="queued" label={phase.position ? `Queued · ${phase.position} ahead` : "Queued"} />;
    case "running":
      return <StatusMark status="running" label="Building" />;
    case "error":
      return <StatusMark status="unavailable" label={phase.message} />;
    case "finished": {
      const record = phase.record;
      if (record.state === "succeeded") return <span className="results-fact">Built</span>;
      if (record.state === "cancelled") return <StatusMark status="cancelled" />;
      return (
        <StatusMark
          status={record.error?.kind === "unavailable" ? "unavailable" : "error"}
          label={failureTitle(record.error?.kind)}
        />
      );
    }
  }
}
