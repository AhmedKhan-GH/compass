"use client";
import { useEffect, useRef, useState } from "react";
import type { ItemProgress, ItemView } from "@compass/schema";
import { KeyButton, StatusGlyph, statusWord } from "@compass/ui";
import { taskStatus, taskStatusMark } from "@/lib/runs";
import { Markdown } from "../markdown";

/** The story and the tasks. The current task is marked; its header runs its tests. */
export function InstructionsPane({
  item,
  concepts,
  progress,
  currentTask,
  scrollToTask,
  busy,
  onSelectTask,
  onRunTask,
  onStepTask,
}: {
  item: ItemView;
  concepts: string[];
  progress: ItemProgress | undefined;
  currentTask: number | undefined;
  /** Changes when the learner moves to a task with the keys; the pane then brings that task into view. */
  scrollToTask: number;
  busy: boolean;
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
  return (
    <>
      {item.tasks.length > 0 && (
        <div className="task-strip">
          <span className="sb-label">Tasks</span>
          {item.tasks.map((task) => {
            const status = taskStatusMark(taskStatus(task.id, progress));
            return (
              <button
                key={task.id}
                type="button"
                className="task-chip"
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
      <div className="instructions" ref={container}>
        <header className="instructions-head">
          <h1 className="sb-page-title">{item.title}</h1>
          <p className="instructions-meta">
            {item.kind === "concept" ? "Concept" : "Practice"} · {concepts.join(", ")}
            {item.tasks.length ? ` · ${item.tasks.length} tasks` : ""}
          </p>
        </header>
        <Markdown>{item.instructions}</Markdown>
        {item.hints && <Hints text={item.hints} label="Hints" />}
        {item.tasks.map((task) => {
          const status = taskStatusMark(taskStatus(task.id, progress));
          const current = task.id === currentTask;
          return (
            <section
              key={task.id}
              className="task"
              data-task={task.id}
              data-current={current || undefined}
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
