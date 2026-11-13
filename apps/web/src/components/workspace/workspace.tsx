"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isTerminal,
  type CircuitRecord,
  type ItemProgress,
  type ItemView,
  type RunRecord,
  type RunSummary,
  type StartRunRequest,
} from "@compass/schema";
import {
  AppFrame,
  Banner,
  CommandBar,
  Dialog,
  KeyButton,
  Pane,
  PrimaryButton,
  Spacer,
  Split,
  StatusBar,
  StatusItem,
  StatusMark,
  ThemeSwitch,
  Thumbnail,
  Trail,
  useFocusedPane,
  useKeyBindings,
  useTheme,
  type Tab,
  type Tone,
} from "@compass/ui";
import { getCircuit, getProgress, getRun, listRuns, resetProgress, startCircuit, startRun } from "@/lib/api";
import { editableNames, sameFiles, shownNames, submittedFiles, type Files } from "@/lib/drafts";
import { isBusy, type JobPhase } from "@/lib/job-poll";
import { assetUrl, courseHref, itemHref } from "@/lib/routes";
import { formatWhen, ranFiles, runOutcome, runScope, runStatus, taskStatusesFromRun } from "@/lib/runs";
import { Brand } from "../brand";
import { RunnerStatus, useRunnerState } from "../runner-status";
import { Markdown } from "../markdown";
import { CircuitActions, CircuitPane, type SourcePosition } from "./circuit-pane";
import type { CursorPosition } from "./code-editor";
import { EditorPane, type EditorPaneHandle } from "./editor-pane";
import { HistoryPane } from "./history-pane";
import { InstructionsPane } from "./instructions-pane";
import { ResultsPane } from "./results-pane";
import { useDraft } from "./use-draft";
import { useElapsed } from "./use-elapsed";
import { useJob } from "./use-job";
import { WaveformPane } from "./waveform-pane";

/** What the workspace needs of the course: no item text but the open item's. */
export type WorkspaceCourse = {
  id: string;
  namespace: string;
  name: string;
  title: string;
  language: string;
  indent: number;
  /** The course names a circuit runner. */
  circuit: boolean;
  concepts: Record<string, string>;
  items: { slug: string; title: string }[];
};

type LeftTab = "instructions" | "introduction";
type DockTab = "results" | "waveform" | "circuit" | "history";
type PaneId = "instructions" | "editor" | "dock";
type RunMode = "all" | "task" | "submit";
const PANES: PaneId[] = ["instructions", "editor", "dock"];

/** The time now, for event handlers. */
function clock(): number {
  return Date.now();
}

function firstOpenTask(item: ItemView, progress: ItemProgress | undefined): number | undefined {
  return item.tasks.find((task) => progress?.tasks[String(task.id)] !== "passed")?.id ?? item.tasks[0]?.id;
}

/** The exercise workspace of the `code@1` environment. */
export default function Workspace({ course, item }: { course: WorkspaceCourse; item: ItemView }) {
  const router = useRouter();
  const draft = useDraft(course.id, item);
  const editable = editableNames(item);
  const names = shownNames(item);
  const submitted = submittedFiles(draft.files, item);
  const [activeFile, setActiveFile] = useState(item.design.solution);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [taskId, setTaskId] = useState<number | undefined>(item.tasks[0]?.id);
  const taskTouched = useRef(false);
  const [taskScroll, setTaskScroll] = useState(0);
  const [leftTab, setLeftTab] = useState<LeftTab>("instructions");
  const [dockTab, setDockTab] = useState<DockTab>("results");
  const [focusedPane] = useFocusedPane("editor");
  const [progress, setProgress] = useState<ItemProgress>();
  const [runnerCheck, setRunnerCheck] = useState(0);
  const runner = useRunnerState(runnerCheck);
  const run = useJob<RunRecord>();
  const circuit = useJob<CircuitRecord>();
  const [shown, setShown] = useState<RunRecord>();
  const [latestId, setLatestId] = useState<string>();
  const [historyVersion, setHistoryVersion] = useState(0);
  const [circuitFiles, setCircuitFiles] = useState<Files>();
  const [circuitRecord, setCircuitRecord] = useState<CircuitRecord>();
  // The reset dialog: open, waiting on the server, or showing why the reset failed.
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string>();
  const [now, setNow] = useState(() => new Date());
  // The run in flight: which button started it and when; and the run that finished on this page.
  const [runMode, setRunMode] = useState<RunMode>();
  const [startedAt, setStartedAt] = useState<number>();
  const [finishedId, setFinishedId] = useState<string>();
  const editor = useRef<EditorPaneHandle>(null);
  const [theme] = useTheme();

  const hasCircuit = course.circuit && item.design.schematic;
  const busy = isBusy(run.phase);
  const elapsed = useElapsed(busy ? startedAt : undefined);
  const index = course.items.findIndex((candidate) => candidate.slug === item.slug);
  const previousItem = index > 0 ? course.items[index - 1] : undefined;
  const nextItem = index >= 0 ? course.items[index + 1] : undefined;
  const conceptNames = item.concepts.map((slug) => course.concepts[slug] ?? slug);

  const refreshProgress = useCallback(
    (signal?: AbortSignal) =>
      getProgress(course.id, signal).then(
        (all) => {
          const mine = all.items[item.slug];
          setProgress(mine);
          if (!taskTouched.current) setTaskId(firstOpenTask(item, mine));
        },
        () => undefined,
      ),
    [course.id, item],
  );

  const afterRun = useCallback(
    (final: JobPhase<RunRecord> | undefined) => {
      if (!final) return;
      setNow(new Date());
      setRunMode(undefined);
      setStartedAt(undefined);
      if (final.phase === "finished") {
        setShown(final.record);
        setLatestId(final.record.id);
        setFinishedId(final.record.id);
        setHistoryVersion((version) => version + 1);
        void refreshProgress();
        if (final.record.error?.kind === "unavailable") setRunnerCheck((check) => check + 1);
      } else if (final.phase === "error") setRunnerCheck((check) => check + 1);
    },
    [refreshProgress],
  );

  // On opening: the progress, and the latest run with its results and waveform. A run still going is followed.
  // Only runs since the exercise was last started over count: after a reset it opens without results.
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getProgress(course.id, controller.signal),
      listRuns(course.id, item.slug, undefined, controller.signal),
    ])
      .then(async ([all, page]) => {
        const mine = all.items[item.slug];
        setProgress(mine);
        if (!taskTouched.current) setTaskId(firstOpenTask(item, mine));
        const first = page.runs[0];
        if (!first || !mine || mine.runs === 0) return;
        const record = await getRun(first.id, undefined, controller.signal);
        setShown(record);
        setLatestId(record.id);
        if (!isTerminal(record.state)) setStartedAt(Date.parse(record.createdAt));
        if (!isTerminal(record.state))
          afterRun(
            await run.follow(
              () => Promise.resolve(record),
              (id, wait, signal, last) => getRun(id, wait, signal, last),
            ),
          );
      })
      .catch(() => undefined);
    return () => controller.abort();
    // Only on opening the item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, item.slug]);

  // Keyboard first: the editor has focus when the workspace opens.
  useEffect(() => {
    const frame = requestAnimationFrame(() => editor.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [item.slug]);

  const focusPane = useCallback((pane: PaneId) => {
    requestAnimationFrame(() => {
      if (pane === "editor") editor.current?.focus();
      else document.querySelector<HTMLElement>(`[data-pane="${pane}"] > .sb-pane-body`)?.focus();
    });
  }, []);

  async function runTests(mode: RunMode, task = taskId) {
    if (busy) return;
    setRunMode(mode);
    setStartedAt(clock());
    setDockTab("results");
    const body: StartRunRequest =
      mode === "submit"
        ? { files: submitted, submit: true }
        : mode === "task" && task !== undefined
          ? { files: submitted, taskId: task }
          : { files: submitted };
    afterRun(
      await run.follow(
        (signal) => startRun(course.id, item.slug, body, signal),
        (id, wait, signal, last) => getRun(id, wait, signal, last),
      ),
    );
  }

  async function buildCircuit() {
    if (!hasCircuit || isBusy(circuit.phase)) return;
    const files = submitted;
    setDockTab("circuit");
    const final = await circuit.follow(
      (signal) => startCircuit(course.id, item.slug, { files }, signal),
      (id, wait, signal, last) => getCircuit(id, wait, signal, last),
    );
    // The drawing in view stays until the new circuit arrives, so the frame is not torn down during a build.
    if (final?.phase === "finished") {
      setCircuitRecord(final.record);
      setCircuitFiles(files);
    }
  }

  function showDockTab(tab: DockTab) {
    setDockTab(tab);
    // Opening the circuit draws the current source when there is no drawing of it yet.
    if (
      tab === "circuit" &&
      hasCircuit &&
      !isBusy(circuit.phase) &&
      (!circuitFiles || !sameFiles(circuitFiles, submitted))
    )
      void buildCircuit();
  }

  function showTab(tab: LeftTab | DockTab | "editor") {
    if (tab === "editor") return focusPane("editor");
    if (tab === "instructions" || tab === "introduction") {
      setLeftTab(tab);
      return focusPane("instructions");
    }
    showDockTab(tab);
    focusPane("dock");
  }

  function stepTask(direction: 1 | -1) {
    if (!item.tasks.length) return;
    const position = item.tasks.findIndex((task) => task.id === taskId);
    const next = item.tasks[Math.max(0, Math.min(item.tasks.length - 1, position + direction))];
    if (!next) return;
    taskTouched.current = true;
    setTaskId(next.id);
    setTaskScroll((count) => count + 1);
    setLeftTab("instructions");
  }

  function selectTask(id: number) {
    taskTouched.current = true;
    setTaskId(id);
  }

  function openItem(slug: string | undefined) {
    if (slug) router.push(itemHref(course, slug));
  }

  async function openRun(summary: RunSummary) {
    try {
      const record = await getRun(summary.id);
      setShown(record);
      setNow(new Date());
      setDockTab("results");
    } catch {
      // The history pane shows the run's summary either way.
    }
  }

  function restore(record: RunRecord) {
    const files = { ...draft.files };
    for (const name of editable) if (typeof record.files[name] === "string") files[name] = record.files[name];
    draft.replace(files);
  }

  function askReset() {
    setResetError(undefined);
    setResetOpen(true);
  }

  // Starts the exercise over: the server's progress first, then the starter code and a neutral workspace. A run
  // still in flight is dropped; the server does not count it either. Past runs stay in History.
  async function resetExercise() {
    if (resetBusy) return;
    setResetBusy(true);
    setResetError(undefined);
    try {
      const next = await resetProgress(course.id, item.slug);
      run.clear();
      setRunMode(undefined);
      setStartedAt(undefined);
      draft.reset();
      setProgress(next);
      setShown(undefined);
      setFinishedId(undefined);
      setHistoryVersion((version) => version + 1);
      taskTouched.current = false;
      setTaskId(firstOpenTask(item, next));
      setResetOpen(false);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : String(error));
    } finally {
      setResetBusy(false);
    }
  }

  function selectSource(positions: SourcePosition[]) {
    const position = positions.find((candidate) => names.includes(candidate.name.split("/").pop() ?? ""));
    if (!position) return;
    editor.current?.select(position.name.split("/").pop() ?? activeFile, position.from, position.to);
  }

  useKeyBindings([
    { chord: "Mod+Enter", run: () => void runTests("all") },
    { chord: "Alt+Enter", run: () => void runTests("task"), enabled: item.tasks.length > 0 },
    { chord: "Mod+Shift+Enter", run: () => void runTests("submit") },
    { chord: "Alt+Shift+Enter", run: () => void buildCircuit(), enabled: hasCircuit },
    { chord: "Alt+Digit1", run: () => showTab("instructions") },
    { chord: "Alt+Digit2", run: () => showTab("introduction"), enabled: Boolean(item.intro) },
    { chord: "Alt+Digit3", run: () => showTab("editor") },
    { chord: "Alt+Digit4", run: () => showTab("results") },
    { chord: "Alt+Digit5", run: () => showTab("waveform") },
    { chord: "Alt+Digit6", run: () => showTab("circuit"), enabled: hasCircuit },
    { chord: "Alt+Digit7", run: () => showTab("history") },
    { chord: "F6", run: () => focusPane(PANES[(PANES.indexOf(focusedPane as PaneId) + 1) % PANES.length] ?? "editor") },
    {
      chord: "Shift+F6",
      run: () => focusPane(PANES[(PANES.indexOf(focusedPane as PaneId) + PANES.length - 1) % PANES.length] ?? "editor"),
    },
    { chord: "Alt+BracketRight", run: () => stepTask(1) },
    { chord: "Alt+BracketLeft", run: () => stepTask(-1) },
    { chord: "Alt+Shift+BracketRight", run: () => openItem(nextItem?.slug), enabled: Boolean(nextItem) },
    { chord: "Alt+Shift+BracketLeft", run: () => openItem(previousItem?.slug), enabled: Boolean(previousItem) },
    { chord: "Alt+Shift+KeyR", run: askReset },
  ]);

  const leftTabs: Tab[] = [
    { id: "instructions", label: "Instructions", chord: "Alt+Digit1" },
    { id: "introduction", label: "Introduction", chord: "Alt+Digit2", hidden: !item.intro },
  ];
  const dockTabs: Tab[] = [
    { id: "results", label: "Results", chord: "Alt+Digit4" },
    { id: "waveform", label: "Waveform", chord: "Alt+Digit5" },
    { id: "circuit", label: "Circuit", chord: "Alt+Digit6", hidden: !hasCircuit },
    { id: "history", label: "History", chord: "Alt+Digit7" },
  ];
  const earlierSource = shown !== undefined && !ranFiles(shown, submitted);
  const circuitEarlier = circuitFiles !== undefined && !sameFiles(circuitFiles, submitted);
  const completed = progress?.status === "completed";
  const outcome = shown ? runOutcome(shown, item.tasks) : undefined;
  // The status bar is filled with the run's colour while it is in flight, and with its outcome until the next edit
  // or the next run.
  const statusTone: Tone | undefined = busy
    ? "running"
    : run.phase.phase === "error"
      ? "warning"
      : shown && shown.id === finishedId && !earlierSource
        ? outcome?.tone
        : undefined;

  return (
    <AppFrame
      className="workspace"
      commandBar={
        <CommandBar>
          <Brand />
          <Trail>
            {[
              <Link key="courses" href="/">
                Courses
              </Link>,
              <Link key="course" href={courseHref(course)}>
                {course.title}
              </Link>,
              <span key="item" className="workspace-trail-item">
                {item.icon && <Thumbnail size={18} src={assetUrl(item.icon)} />}
                {item.title}
              </span>,
            ]}
          </Trail>
          <span className="workspace-item-nav">
            <KeyButton
              chord="Alt+Shift+BracketLeft"
              aria-label={previousItem ? `Previous exercise, ${previousItem.title}` : "Previous exercise"}
              disabled={!previousItem}
              onClick={() => openItem(previousItem?.slug)}
            />
            <span className="workspace-item-count">
              {index + 1} of {course.items.length}
            </span>
            <KeyButton
              chord="Alt+Shift+BracketRight"
              aria-label={nextItem ? `Next exercise, ${nextItem.title}` : "Next exercise"}
              disabled={!nextItem}
              onClick={() => openItem(nextItem?.slug)}
            />
          </span>
          {completed && <StatusMark status="completed" />}
          <Spacer />
          {item.tasks.length > 0 && taskId !== undefined && (
            <KeyButton
              chord="Alt+Enter"
              disabled={busy}
              running={busy && runMode === "task"}
              onClick={() => void runTests("task")}
            >
              Run task {taskId}
            </KeyButton>
          )}
          <KeyButton
            chord="Mod+Enter"
            disabled={busy}
            running={busy && runMode === "all"}
            onClick={() => void runTests("all")}
          >
            Run tests
          </KeyButton>
          <PrimaryButton
            chord="Mod+Shift+Enter"
            disabled={busy}
            running={busy && runMode === "submit"}
            onClick={() => void runTests("submit")}
          >
            Submit
          </PrimaryButton>
        </CommandBar>
      }
      statusBar={
        <StatusBar tone={statusTone}>
          <StatusItem>
            <LiveStatus
              phase={run.phase}
              shown={shown}
              finished={shown !== undefined && shown.id === finishedId && !earlierSource}
              elapsed={elapsed}
              tasks={item.tasks}
            />
          </StatusItem>
          <StatusItem>
            <RunnerStatus state={runner} />
          </StatusItem>
          <Spacer />
          <StatusItem className="sb-mono">{activeFile}</StatusItem>
          <StatusItem className="sb-mono">
            {cursor.line}:{cursor.column}
          </StatusItem>
          <StatusItem>
            {draft.state === "starter" ? "Starter" : draft.state === "saved" ? "Draft saved" : "Draft not saved"}
          </StatusItem>
          <StatusItem className="sb-mono">{item.revision.slice(0, 7)}</StatusItem>
          <StatusItem>
            <ThemeSwitch />
          </StatusItem>
        </StatusBar>
      }
    >
      <Split
        id="workspace"
        direction="row"
        shares={[0.3, 0.7]}
        minimums={[300, 520]}
        labels={["Instructions", "Editor"]}
      >
        <Pane
          id="instructions"
          title="Instructions"
          tabs={leftTabs}
          activeTab={leftTab}
          onTab={(tab) => setLeftTab(tab as LeftTab)}
          focused={focusedPane === "instructions"}
          className="instructions-pane"
        >
          {leftTab === "introduction" && item.intro ? (
            <div className="instructions">
              <Markdown>{item.intro}</Markdown>
            </div>
          ) : (
            <InstructionsPane
              item={item}
              concepts={conceptNames}
              progress={progress}
              currentTask={taskId}
              scrollToTask={taskScroll}
              busy={busy}
              runningTask={busy ? (runMode === "task" ? taskId : "all") : undefined}
              taskStates={
                shown && shown.id === latestId && shown.revision === item.revision
                  ? taskStatusesFromRun(shown, item.tasks)
                  : {}
              }
              onSelectTask={selectTask}
              onRunTask={(id) => {
                selectTask(id);
                void runTests("task", id);
              }}
              onStepTask={stepTask}
            />
          )}
        </Pane>
        <Split
          id="workspace-right"
          direction="column"
          shares={[0.55, 0.45]}
          minimums={[200, 150]}
          labels={["Editor", "Results"]}
        >
          <EditorPane
            ref={editor}
            files={draft.files}
            names={names}
            editable={editable}
            active={activeFile}
            onActive={setActiveFile}
            onChange={draft.update}
            onCursor={setCursor}
            language={course.language}
            indent={course.indent}
            focused={focusedPane === "editor"}
            onAskReset={askReset}
            readOnlyContent={(name) => item.starter[name] ?? ""}
          />
          <Pane
            id="dock"
            title="Results"
            tabs={dockTabs}
            activeTab={dockTab}
            onTab={(tab) => showDockTab(tab as DockTab)}
            focused={focusedPane === "dock"}
            className="dock-pane"
            subtitle={dockSubtitle(dockTab, shown, latestId, now)}
            actions={
              dockTab === "circuit" && hasCircuit ? (
                <CircuitActions
                  phase={circuit.phase}
                  earlierSource={circuitEarlier}
                  onBuild={() => void buildCircuit()}
                />
              ) : undefined
            }
            bodyClassName={dockTab === "circuit" ? "dock-body-fill" : undefined}
          >
            {dockTab === "results" && (
              <ResultsPane
                phase={run.phase}
                run={shown}
                latest={shown === undefined || shown.id === latestId}
                earlierSource={earlierSource}
                revision={item.revision}
                tasks={item.tasks}
                currentTask={taskId}
                now={now}
                elapsed={elapsed}
                nextItem={nextItem}
                onNextItem={() => openItem(nextItem?.slug)}
                onRunTests={() => void runTests("all")}
                onRunTask={() => void runTests("task")}
                onRestore={restore}
                onShowLatest={() => {
                  if (latestId) void openRun({ id: latestId } as RunSummary);
                }}
              />
            )}
            {dockTab === "waveform" && <WaveformPane run={shown} earlierSource={earlierSource} />}
            {hasCircuit && (
              <div className="dock-circuit" hidden={dockTab !== "circuit"}>
                <CircuitPane
                  phase={circuit.phase}
                  record={circuitRecord}
                  theme={theme}
                  earlierSource={circuitEarlier}
                  active={dockTab === "circuit"}
                  onBuild={() => void buildCircuit()}
                  onSelectSource={selectSource}
                />
              </div>
            )}
            {dockTab === "history" && (
              <HistoryPane
                courseId={course.id}
                itemSlug={item.slug}
                version={historyVersion}
                revision={item.revision}
                shownId={shown?.id}
                now={now}
                onOpen={(summary) => void openRun(summary)}
              />
            )}
          </Pane>
        </Split>
      </Split>
      <Dialog
        open={resetOpen}
        title="Reset exercise"
        onCancel={() => setResetOpen(false)}
        actions={
          <>
            <KeyButton chord="Escape" onClick={() => setResetOpen(false)}>
              Cancel
            </KeyButton>
            <PrimaryButton chord="Enter" data-dialog-default disabled={resetBusy} onClick={() => void resetExercise()}>
              Reset exercise
            </PrimaryButton>
          </>
        }
      >
        <p>
          {completed
            ? "Your code goes back to the starter, every task starts over and the completion is cleared; past runs stay in History."
            : "Your code goes back to the starter and every task starts over; past runs stay in History."}
        </p>
        {resetError && <Banner tone="failed" status="failed" title="Reset failed" detail={resetError} />}
      </Dialog>
    </AppFrame>
  );
}

/** Names the run in view when it is not the latest: "Earlier run · 09:34". */
function dockSubtitle(tab: DockTab, shown: RunRecord | undefined, latestId: string | undefined, now: Date) {
  if ((tab !== "results" && tab !== "waveform") || !shown || shown.id === latestId) return undefined;
  return `Earlier run · ${formatWhen(shown.finishedAt ?? shown.createdAt, now)}`;
}

/** The run in the status bar: in flight with its scope and time, then its outcome; otherwise the latest result. */
function LiveStatus({
  phase,
  shown,
  finished,
  elapsed,
  tasks,
}: {
  phase: JobPhase<RunRecord>;
  shown: RunRecord | undefined;
  finished: boolean;
  elapsed: string | undefined;
  tasks: ItemView["tasks"];
}) {
  const time = elapsed ? ` · ${elapsed}` : "";
  if (phase.phase === "starting") return <StatusMark status="running" label={`Starting${time}`} />;
  if (phase.phase === "queued")
    return (
      <StatusMark
        status="queued"
        label={`Queued${phase.position ? ` · ${phase.position} ahead` : ""} · ${runScope(phase.record)}${time}`}
      />
    );
  if (phase.phase === "running")
    return <StatusMark status="running" label={`Running · ${runScope(phase.record)}${time}`} />;
  if (phase.phase === "error") return <StatusMark status="unavailable" label={`Run not started · ${phase.message}`} />;
  if (!shown) return <span className="sb-faint">No runs</span>;
  const outcome = runOutcome(shown, tasks);
  const title = shown.kind === "submission" && shown.report?.status === "pass" ? "Exercise completed" : outcome.title;
  return <StatusMark status={finished ? outcome.status : runStatus(shown)} label={`${title} · ${runScope(shown)}`} />;
}
