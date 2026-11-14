"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ItemView, TaskStatus } from "@compass/schema";
import {
  KeyButton,
  KeyHint,
  StatusGlyph,
  StatusMark,
  Thumbnail,
  statusWord,
  useStoredValue,
  writeStorage,
  type Status,
} from "@compass/ui";
import { assetUrl } from "@/lib/routes";
import { taskStatusMark, type LessonState } from "@/lib/runs";
import { Markdown } from "../markdown";

/**
 * The lesson's header: its icon, its title and a line with its state, kind, concepts and task count, on its state's
 * tint like the task headers. It stays at the top of the instructions.
 */
export function LessonHeader({ item, concepts, lesson }: { item: ItemView; concepts: string[]; lesson: LessonState }) {
  return (
    <header className="lesson-head" data-tone={lesson.tone}>
      <Thumbnail size={64} src={assetUrl(item.icon)} />
      <div className="lesson-head-text">
        <h1 className="lesson-title">{item.title}</h1>
        <p className="lesson-meta">
          <StatusMark status={lesson.status} label={lesson.word} />
          <span>
            · {item.kind === "concept" ? "Concept" : "Practice"} · {concepts.join(", ")}
            {item.tasks.length ? ` · ${item.tasks.length} tasks` : ""}
          </span>
        </p>
      </div>
    </header>
  );
}

/** The chord that collapses and expands the sidebar. */
export const SIDEBAR_CHORD = "Alt+Digit1";

/** A task's mark: running while a run of it is in flight, otherwise its latest status. */
function taskMark(
  taskId: number,
  taskStatuses: Record<string, TaskStatus>,
  runningTask: number | "all" | undefined,
): Status {
  return runningTask === "all" || runningTask === taskId
    ? "running"
    : taskStatusMark(taskStatuses[String(taskId)] ?? "untested");
}

/** The square toggle at the sidebar's edge with its key: it collapses the sidebar to a rail and expands it again. */
export function SidebarToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <span className="sidebar-toggle-group">
      <KeyHint chord={SIDEBAR_CHORD} className="sb-pane-key" />
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Instructions"
        aria-expanded={expanded}
        title={expanded ? "Collapse" : "Expand"}
        onClick={onToggle}
      >
        <span aria-hidden="true">{expanded ? "\u2039" : "\u203a"}</span>
      </button>
    </span>
  );
}

/**
 * The collapsed sidebar: a rail with the toggle, the lesson's icon and state, and a chip for each task in its state's
 * colour. A chip selects its task and the sidebar stays collapsed.
 */
export function InstructionsRail({
  item,
  lesson,
  currentTask,
  taskStatuses,
  runningTask,
  focused,
  onSelectTask,
  onExpand,
}: {
  item: ItemView;
  lesson: LessonState;
  currentTask: number | undefined;
  taskStatuses: Record<string, TaskStatus>;
  runningTask: number | "all" | undefined;
  focused: boolean;
  onSelectTask: (taskId: number) => void;
  onExpand: () => void;
}) {
  return (
    <aside
      className="sidebar-rail"
      data-pane="instructions"
      data-focused={focused || undefined}
      aria-label="Instructions"
    >
      <div className="sidebar-rail-head">
        <SidebarToggle expanded={false} onToggle={onExpand} />
      </div>
      <div className="sidebar-rail-body">
        <span className="sidebar-rail-lesson" title={item.title}>
          <Thumbnail size={32} src={assetUrl(item.icon)} />
          <span className="sb-visually-hidden">{item.title}</span>
        </span>
        <span className="sidebar-rail-state" data-tone={lesson.tone}>
          <StatusGlyph status={lesson.status} title={lesson.word} />
        </span>
        {item.tasks.length > 0 && (
          <div className="sidebar-rail-tasks" role="group" aria-label="Tasks">
            {item.tasks.map((task) => {
              const status = taskMark(task.id, taskStatuses, runningTask);
              return (
                <button
                  key={task.id}
                  type="button"
                  className="task-chip"
                  data-status={status}
                  aria-pressed={task.id === currentTask}
                  aria-label={`Task ${task.id}, ${statusWord(status)}`}
                  title={task.title}
                  onClick={() => onSelectTask(task.id)}
                >
                  <span className="task-chip-number">{task.id}</span>
                  <StatusGlyph status={status} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

/** Where a lesson's Concept section remembers whether it is open: by course id and item id, like the drafts. */
export function conceptKey(courseId: string, itemId: string): string {
  return `compass:concept:${courseId}:${itemId}`;
}

/** The story, the concept text and the tasks. The current task is marked; its header runs its tests. */
export function InstructionsPane({
  courseId,
  item,
  concepts,
  lesson,
  currentTask,
  scrollToTask,
  busy,
  taskStatuses,
  runningTask,
  onSelectTask,
  onRunTask,
  onStepTask,
}: {
  courseId: string;
  item: ItemView;
  concepts: string[];
  lesson: LessonState;
  currentTask: number | undefined;
  /** Changes when the learner moves to a task with the keys; the pane then brings that task into view. */
  scrollToTask: number;
  busy: boolean;
  /** Each task's status: from the latest run of this revision, over the stored progress. */
  taskStatuses: Record<string, TaskStatus>;
  /** The task whose run is in flight, or "all" for a run of every task. */
  runningTask: number | "all" | undefined;
  onSelectTask: (taskId: number) => void;
  onRunTask: (taskId: number) => void;
  onStepTask: (direction: 1 | -1) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const current = useRef(currentTask);
  useEffect(() => {
    current.current = currentTask;
  });
  useEffect(() => {
    if (!scrollToTask || current.current === undefined) return;
    container.current?.querySelector(`[data-task="${current.current}"]`)?.scrollIntoView({ block: "start" });
  }, [scrollToTask]);

  const position = item.tasks.findIndex((task) => task.id === currentTask);
  const statusOf = (taskId: number): Status => taskMark(taskId, taskStatuses, runningTask);
  return (
    <>
      <div className="lesson-top">
        <LessonHeader item={item} concepts={concepts} lesson={lesson} />
        {item.tasks.length > 0 && (
          <div className="task-strip">
            <span className="sb-label">Tasks</span>
            {item.tasks.map((task) => {
              const status = statusOf(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  className="task-chip"
                  data-status={status}
                  aria-pressed={task.id === currentTask}
                  aria-label={`Task ${task.id}, ${statusWord(status)}`}
                  onClick={() => onSelectTask(task.id)}
                >
                  <span className="task-chip-number">{task.id}</span>
                  <StatusGlyph status={status} />
                </button>
              );
            })}
            <span className="sb-spacer" />
            <KeyButton
              chord="Alt+BracketLeft"
              aria-label="Previous task"
              disabled={position <= 0}
              onClick={() => onStepTask(-1)}
            />
            <KeyButton
              chord="Alt+BracketRight"
              aria-label="Next task"
              disabled={position < 0 || position >= item.tasks.length - 1}
              onClick={() => onStepTask(1)}
            />
          </div>
        )}
      </div>
      <div className="instructions" ref={container}>
        <Markdown>{item.instructions}</Markdown>
        {item.hints && <Hints text={item.hints} label="Hints" />}
        {item.intro && (
          <ConceptSection
            key={conceptKey(courseId, item.id)}
            text={item.intro}
            concepts={concepts}
            storageKey={conceptKey(courseId, item.id)}
          />
        )}
        {item.tasks.map((task) => {
          const status = statusOf(task.id);
          const current = task.id === currentTask;
          return (
            <section
              key={task.id}
              className="task"
              data-task={task.id}
              data-current={current || undefined}
              data-status={status}
              aria-labelledby={`task-${task.id}-title`}
            >
              <div className="task-head" onClick={() => onSelectTask(task.id)}>
                <span className="task-number" aria-hidden="true">
                  {task.id}
                </span>
                <StatusGlyph status={status} title={statusWord(status)} />
                <h2 className="task-title" id={`task-${task.id}-title`}>
                  <span className="sb-visually-hidden">Task {task.id}: </span>
                  {task.title}
                </h2>
                <KeyButton
                  chord={current ? "Alt+Enter" : undefined}
                  disabled={busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRunTask(task.id);
                  }}
                >
                  Run task
                </KeyButton>
              </div>
              <Markdown className="task-text">{task.instructions}</Markdown>
              {task.hints && <Hints text={task.hints} label="Hints" />}
            </section>
          );
        })}
      </div>
    </>
  );
}

/**
 * The concept text of a lesson, between the story and the tasks, in the language of the task sections. Open the
 * first time a learner opens the lesson; its open or closed state is then kept per lesson in local storage.
 */
function ConceptSection({ text, concepts, storageKey }: { text: string; concepts: string[]; storageKey: string }) {
  const stored = useStoredValue(storageKey);
  // Storage can be unavailable; the section then keeps its state for this page only.
  const [local, setLocal] = useState<boolean>();
  const open = local ?? stored !== "closed";
  const id = useId();
  function toggle() {
    setLocal(!open);
    writeStorage(storageKey, open ? "closed" : "open");
  }
  return (
    <section className="concept" data-open={open || undefined} aria-labelledby={`${id}-head`}>
      <h2 className="concept-heading">
        <button
          type="button"
          className="concept-head"
          id={`${id}-head`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={toggle}
        >
          <span className="concept-sign" aria-hidden="true">
            {open ? "−" : "+"}
          </span>
          <span className="concept-title">Concept</span>
          {concepts.length > 0 && <span className="concept-names">{concepts.join(", ")}</span>}
        </button>
      </h2>
      <div className="concept-body" id={`${id}-body`} hidden={!open}>
        <Markdown>{text}</Markdown>
      </div>
    </section>
  );
}

function Hints({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hints" data-open={open || undefined}>
      <button type="button" className="hints-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="hints-sign" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
        {label}
      </button>
      {open && <Markdown className="hints-text">{text}</Markdown>}
    </div>
  );
}
