"use client";
import { useEffect, useRef, useState } from "react";
import type { ItemView, TaskStatus } from "@compass/schema";
import { KeyButton, StatusGlyph, StatusMark, Thumbnail, statusWord, type Status } from "@compass/ui";
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

/** The story and the tasks. The current task is marked; its header runs its tests. */
export function InstructionsPane({
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
  // A task in a run that is in flight shows as running; otherwise its latest status.
  const statusOf = (taskId: number): Status =>
    runningTask === "all" || runningTask === taskId
      ? "running"
      : taskStatusMark(taskStatuses[String(taskId)] ?? "untested");
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
