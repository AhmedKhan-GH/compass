"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { KeyButton, Label, StatusGlyph, StatusMark, statusWord, useKeyBindings, type Status } from "@compass/ui";
import { count } from "@/lib/catalog";
import {
  conceptGraph,
  edgePath,
  highlight,
  layoutMap,
  neighbour,
  type ConceptNode,
  type Direction,
  type MapMetrics,
} from "@/lib/concept-map";
import type { CourseItemRow } from "./course-browser";

/**
 * Nodes wide enough for the longest concept names in two lines of the small UI size; the widest layers of the
 * courses, with the arrows passing through them, then fit the map's height at 1440 × 900.
 */
const METRICS: MapMetrics = { nodeWidth: 140, nodeHeight: 40, layerGap: 52, nodeGap: 14, laneGap: 8, padding: 20 };

const DIRECTIONS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

const STATE: Record<CourseItemRow["progress"], Status> = {
  "not-started": "not-started",
  "in-progress": "in-progress",
  completed: "completed",
};

/**
 * The course's concepts as a flow from left to right: one node per concept in the state of its lesson, an arrow
 * from each prerequisite to the concept that needs it. Selecting a node lights up the path through it, dims the rest
 * and shows the concept's lesson, prerequisites, practice and what it unlocks beside the map.
 */
export function ConceptMap({
  concepts,
  items,
}: {
  concepts: { slug: string; name: string }[];
  items: CourseItemRow[];
}) {
  const router = useRouter();
  const graph = useMemo(
    () =>
      conceptGraph(
        concepts,
        items.map((item) => ({
          slug: item.slug,
          kind: item.kind,
          concepts: item.concepts.map((concept) => concept.slug),
          prerequisites: item.prerequisites.map((concept) => concept.slug),
        })),
      ),
    [concepts, items],
  );
  const layout = useMemo(() => layoutMap(graph, METRICS), [graph]);
  const itemBySlug = useMemo(() => new Map(items.map((item) => [item.slug, item])), [items]);
  const nodeBySlug = useMemo(() => new Map(graph.nodes.map((node) => [node.slug, node])), [graph]);
  const [selected, setSelected] = useState<string>();
  const [active, setActive] = useState<string>();
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(
    null,
  );
  const lit = useMemo(() => highlight(graph, selected), [graph, selected]);

  useKeyBindings([{ chord: "Escape", run: () => setSelected(undefined), enabled: selected !== undefined }]);

  // The selected node stays in view when the detail panel narrows the map.
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() =>
      nodes.current.get(selected)?.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  if (!graph.nodes.length)
    return (
      <div className="map-empty">
        <span className="sb-faint">No concepts</span>
      </div>
    );

  const stateOf = (node: ConceptNode): Status => {
    const lesson = node.lesson ? itemBySlug.get(node.lesson) : undefined;
    return lesson ? STATE[lesson.progress] : "unavailable";
  };
  const wordOf = (node: ConceptNode) => (node.lesson ? statusWord(stateOf(node)) : "No lesson");
  const tabStop = active ?? selected ?? layout.layers[0]?.[0];

  function choose(slug: string, focus: boolean) {
    setSelected(slug);
    setActive(slug);
    if (!focus) return;
    const element = nodes.current.get(slug);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function open(slug: string) {
    const lesson = nodeBySlug.get(slug)?.lesson;
    const href = lesson ? itemBySlug.get(lesson)?.href : undefined;
    if (href) router.push(href);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const slug = (event.target as HTMLElement).closest<HTMLElement>("[data-concept]")?.dataset.concept;
    if (!slug) return;
    const direction = DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      const next = neighbour(layout, slug, direction);
      if (next) choose(next, true);
      else if (selected !== slug) choose(slug, true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(slug);
    }
  }
  // The empty space of the map pans it by dragging; a click there clears the selection.
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".map-node")) return;
    const box = viewport.current;
    if (!box) return;
    box.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: box.scrollLeft,
      top: box.scrollTop,
      moved: false,
    };
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const box = viewport.current;
    if (!state || !box || state.pointer !== event.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.moved && Math.hypot(dx, dy) < 4) return;
    state.moved = true;
    box.dataset.panning = "";
    box.scrollLeft = state.left - dx;
    box.scrollTop = state.top - dy;
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointer !== event.pointerId) return;
    drag.current = null;
    delete viewport.current?.dataset.panning;
    if (!state.moved) setSelected(undefined);
  }

  const selectedNode = selected ? nodeBySlug.get(selected) : undefined;
  const edgeState = (key: string) => (lit.edges.has(key) ? "lit" : selected ? "dimmed" : undefined);
  // Lit arrows are drawn last, over the others.
  const edges = [...layout.edges].sort(
    (a, b) => Number(lit.edges.has(`${a.from}>${a.to}`)) - Number(lit.edges.has(`${b.from}>${b.to}`)),
  );
  return (
    <div className="concept-map" data-selection={selected ? "" : undefined}>
      <div
        ref={viewport}
        className="map-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="map-canvas"
          role="group"
          aria-label="Concept map"
          style={{ width: layout.width, height: layout.height }}
          onKeyDown={onKeyDown}
        >
          <svg className="map-arrows" width={layout.width} height={layout.height} aria-hidden="true">
            {edges.map((edge) => {
              const key = `${edge.from}>${edge.to}`;
              const end = edge.points.at(-1)!;
              return (
                <g key={key} className="map-arrow" data-state={edgeState(key)}>
                  <path d={edgePath(edge.points)} />
                  <path d={`M${end.x - 5} ${end.y - 3.5} L${end.x - 0.5} ${end.y} L${end.x - 5} ${end.y + 3.5}`} />
                </g>
              );
            })}
          </svg>
          {layout.nodes.map((placed) => {
            const node = nodeBySlug.get(placed.slug)!;
            const status = stateOf(node);
            const label = [
              node.name,
              wordOf(node),
              count(node.prerequisites.length, "prerequisite", "prerequisites"),
              `unlocks ${count(node.unlocks.length, "concept", "concepts")}`,
              count(node.practice.length, "practice problem", "practice problems"),
            ].join(", ");
            return (
              <button
                key={node.slug}
                ref={(element) => {
                  if (element) nodes.current.set(node.slug, element);
                  else nodes.current.delete(node.slug);
                }}
                type="button"
                className="map-node"
                data-concept={node.slug}
                data-state={status}
                data-path={lit.nodes.has(node.slug) || undefined}
                data-dimmed={lit.dimmed.has(node.slug) || undefined}
                aria-pressed={node.slug === selected}
                aria-label={label}
                tabIndex={node.slug === tabStop ? 0 : -1}
                style={{ left: placed.x, top: placed.y, width: METRICS.nodeWidth, height: METRICS.nodeHeight }}
                onClick={() => choose(node.slug, false)}
                onDoubleClick={() => open(node.slug)}
                onFocus={() => setActive(node.slug)}
              >
                <span className="map-node-name">
                  <StatusGlyph status={status} />
                  {node.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selectedNode && (
        <MapDetail
          node={selectedNode}
          status={stateOf(selectedNode)}
          word={wordOf(selectedNode)}
          nodeBySlug={nodeBySlug}
          itemBySlug={itemBySlug}
          stateOf={stateOf}
          onSelect={(slug) => choose(slug, true)}
          onClear={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}

/** The selected concept: its lesson, what it needs, where it is practised and what it unlocks. */
function MapDetail({
  node,
  status,
  word,
  nodeBySlug,
  itemBySlug,
  stateOf,
  onSelect,
  onClear,
}: {
  node: ConceptNode;
  status: Status;
  word: string;
  nodeBySlug: Map<string, ConceptNode>;
  itemBySlug: Map<string, CourseItemRow>;
  stateOf: (node: ConceptNode) => Status;
  onSelect: (slug: string) => void;
  onClear: () => void;
}) {
  const lesson = node.lesson ? itemBySlug.get(node.lesson) : undefined;
  const concepts = (slugs: string[]) =>
    slugs.flatMap((slug) => {
      const other = nodeBySlug.get(slug);
      return other
        ? [
            <button key={slug} type="button" className="map-detail-entry" onClick={() => onSelect(slug)}>
              <StatusGlyph status={stateOf(other)} />
              {other.name}
            </button>,
          ]
        : [];
    });
  const practice = node.practice.flatMap((slug) => {
    const item = itemBySlug.get(slug);
    return item
      ? [
          <Link key={slug} href={item.href} className="map-detail-entry">
            <StatusGlyph status={STATE[item.progress]} />
            {item.title}
          </Link>,
        ]
      : [];
  });
  return (
    <aside className="map-detail" aria-label={node.name}>
      <div className="map-detail-head">
        <h2 className="map-detail-title">{node.name}</h2>
        <KeyButton chord="Escape" aria-label="Clear selection" onClick={onClear} />
      </div>
      <StatusMark status={status} label={word} />
      <DetailList label="Lesson">
        {lesson
          ? [
              <Link key={lesson.slug} href={lesson.href} className="map-detail-entry">
                <StatusGlyph status={STATE[lesson.progress]} />
                {lesson.title}
              </Link>,
            ]
          : []}
      </DetailList>
      <DetailList label="Prerequisites">{concepts(node.prerequisites)}</DetailList>
      <DetailList label="Practice">{practice}</DetailList>
      <DetailList label="Unlocks">{concepts(node.unlocks)}</DetailList>
    </aside>
  );
}

function DetailList({ label, children }: { label: string; children: ReactNode[] }) {
  return (
    <section className="map-detail-list">
      <Label>{label}</Label>
      {children.length ? (
        <ul className="sb-list">
          {children.map((child, at) => (
            <li key={at}>{child}</li>
          ))}
        </ul>
      ) : (
        <p className="sb-faint">None</p>
      )}
    </section>
  );
}
