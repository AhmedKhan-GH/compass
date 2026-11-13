"use client";
import { Children, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { join } from "./classes.ts";
import { KeyHint, TabStrip, type Tab } from "./controls.tsx";
import { useStoredValue, writeStorage } from "./hooks.ts";
import { gridTracks, moveRule, normalizeShares, parseStoredShares, resolveSizes } from "./layout.ts";

/**
 * A docked pane: a 24 px header strip on the surface, then the body. The focused pane's title, key and closing rule
 * turn bronze. The header carries either a title or a strip of tabs; a click on its free space focuses the pane.
 */
export function Pane({
  id,
  title,
  tabs,
  activeTab,
  onTab,
  subtitle,
  chord,
  actions,
  focused,
  children,
  className,
  bodyClassName,
  onFocusRequest,
}: {
  id: string;
  title?: string;
  tabs?: readonly Tab[];
  activeTab?: string;
  onTab?: (id: string) => void;
  subtitle?: ReactNode;
  chord?: string;
  actions?: ReactNode;
  focused: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Called when the header's free space is clicked. */
  onFocusRequest?: () => void;
}) {
  const body = useRef<HTMLDivElement>(null);
  const hasTabs = tabs && activeTab !== undefined && onTab;
  return (
    <section
      className={join("sb-pane", className)}
      data-pane={id}
      data-focused={focused || undefined}
      aria-labelledby={hasTabs ? undefined : `${id}-title`}
      aria-label={hasTabs ? title : undefined}
    >
      <header
        className="sb-pane-header"
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          if (onFocusRequest) onFocusRequest();
          else body.current?.focus();
        }}
      >
        {hasTabs ? (
          <TabStrip tabs={tabs} active={activeTab} onSelect={onTab} idPrefix={id} label={title ?? id} />
        ) : (
          <h2 className="sb-pane-title" id={`${id}-title`}>
            {title}
          </h2>
        )}
        {subtitle && <span className="sb-pane-subtitle">{subtitle}</span>}
        <span className="sb-spacer" />
        {actions && <span className="sb-pane-actions">{actions}</span>}
        {chord && <KeyHint chord={chord} className="sb-pane-key" />}
      </header>
      <div
        ref={body}
        className={join("sb-pane-body", bodyClassName)}
        tabIndex={-1}
        role={hasTabs ? "tabpanel" : undefined}
        id={hasTabs ? `${id}-panel-${activeTab}` : undefined}
        aria-labelledby={hasTabs ? `${id}-tab-${activeTab}` : undefined}
      >
        {children}
      </div>
    </section>
  );
}

const STEP = 16;
const LARGE_STEP = 64;

/**
 * Panes side by side (`row`) or stacked (`column`), as shares of the space with a minimum each and 1 px rules
 * between them. A rule can be dragged, or focused and moved with the arrow keys; a double click restores the
 * default shares. The shares are kept in local storage under `compass:split:<id>`.
 */
export function Split({
  id,
  direction,
  shares,
  minimums,
  labels,
  children,
  className,
}: {
  id: string;
  direction: "row" | "column";
  /** The default shares, one per child. */
  shares: readonly number[];
  /** Minimum sizes in pixels, one per child. */
  minimums: readonly number[];
  /** The panes' names, for the rules' accessible names. */
  labels: readonly string[];
  children: ReactNode;
  className?: string;
}) {
  const panes = Children.toArray(children);
  const key = `compass:split:${id}`;
  const stored = parseStoredShares(useStoredValue(key), panes.length);
  const [local, setLocal] = useState<number[] | null>(null);
  const current = local ?? stored ?? normalizeShares(shares);
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; start: number; shares: number[]; index: number } | null>(null);
  const horizontal = direction === "row";

  function total(): number {
    const box = container.current?.getBoundingClientRect();
    return box ? (horizontal ? box.width : box.height) : 0;
  }
  function commit(next: number[]) {
    setLocal(next);
    writeStorage(key, JSON.stringify(next.map((share) => Math.round(share * 10000) / 10000)));
  }
  function onPointerDown(index: number, event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      start: horizontal ? event.clientX : event.clientY,
      shares: current,
      index,
    };
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointer !== event.pointerId) return;
    const delta = (horizontal ? event.clientX : event.clientY) - state.start;
    setLocal(moveRule(total(), state.shares, minimums, state.index, delta));
  }
  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    commit(local ?? current);
  }
  function onKeyDown(index: number, event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? LARGE_STEP : STEP;
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    let delta: number | undefined;
    if (event.key === back) delta = -step;
    else if (event.key === forward) delta = step;
    else if (event.key === "Home") delta = -Number.MAX_SAFE_INTEGER / 4;
    else if (event.key === "End") delta = Number.MAX_SAFE_INTEGER / 4;
    if (delta === undefined) return;
    event.preventDefault();
    commit(moveRule(total(), current, minimums, index, delta));
  }

  const tracks = gridTracks(current, minimums);
  const sizes = resolveSizes(1000, current, []);
  const cells: ReactNode[] = [];
  panes.forEach((pane, index) => {
    if (index > 0) {
      const before = labels[index - 1] ?? "";
      const after = labels[index] ?? "";
      cells.push(
        <div
          key={`rule-${index}`}
          className="sb-split-rule"
          role="separator"
          tabIndex={0}
          aria-orientation={horizontal ? "vertical" : "horizontal"}
          aria-label={`${before} and ${after}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((sizes[index - 1] ?? 0) / 10)}
          onPointerDown={(event) => onPointerDown(index - 1, event)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={() => commit(normalizeShares(shares))}
          onKeyDown={(event) => onKeyDown(index - 1, event)}
        />,
      );
    }
    cells.push(
      <div key={`pane-${index}`} className="sb-split-cell">
        {pane}
      </div>,
    );
  });
  return (
    <div
      ref={container}
      className={join("sb-split", className)}
      data-direction={direction}
      style={horizontal ? { gridTemplateColumns: tracks } : { gridTemplateRows: tracks }}
    >
      {cells}
    </div>
  );
}
