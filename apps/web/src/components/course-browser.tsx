"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Label,
  PrimaryButton,
  StatusMark,
  TabStrip,
  Thumbnail,
  useKeyBindings,
  type Status,
  type Tab,
} from "@compass/ui";
import type { StageGroup } from "@/lib/catalog";
import { RowNavigation } from "./row-navigation";

export type CourseItemRow = {
  slug: string;
  href: string;
  title: string;
  topic?: string;
  blurb: string;
  kind: "concept" | "practice";
  status: string;
  concepts: { slug: string; name: string }[];
  prerequisites: { slug: string; name: string }[];
  /** The icon's URL, when the exercise has one. */
  icon?: string | undefined;
  tasks: number;
  progress: "not-started" | "in-progress" | "completed";
  passedTasks: number;
};

type ConceptPage = { name: string; introduction?: ReactNode; about?: ReactNode };
type TabId = "exercises" | "syllabus" | "concepts";

/** The course's exercises, syllabus and concepts as tabs of one page. */
export function CourseBrowser({
  items,
  concepts,
  conceptPages,
  syllabus,
  planned,
  plannedCount,
  initialTab,
  initialConcept,
  continueHref,
  continueLabel,
}: {
  items: CourseItemRow[];
  concepts: { slug: string; name: string }[];
  conceptPages: Record<string, ConceptPage>;
  syllabus?: ReactNode;
  /** Exercises still to come, by stage. They cannot be opened. */
  planned: StageGroup[];
  plannedCount: number;
  initialTab?: string;
  initialConcept?: string;
  continueHref?: string;
  continueLabel: string;
}) {
  const router = useRouter();
  // A course that is only a plan shows its planned exercises in the first tab; tabs without content are left out.
  const tabs: Tab[] = [
    items.length
      ? { id: "exercises", label: "Exercises", detail: String(items.length), chord: "Alt+Digit1" }
      : { id: "exercises", label: "Planned exercises", detail: String(plannedCount), chord: "Alt+Digit1" },
    { id: "syllabus", label: "Syllabus", chord: "Alt+Digit2", hidden: !syllabus },
    {
      id: "concepts",
      label: "Concepts",
      detail: String(concepts.length),
      chord: "Alt+Digit3",
      hidden: !concepts.length,
    },
  ];
  const [tab, setTab] = useState<TabId>(
    initialTab === "syllabus" && syllabus
      ? "syllabus"
      : initialTab === "concepts" && concepts.length
        ? "concepts"
        : "exercises",
  );
  const [concept, setConcept] = useState(
    concepts.find((candidate) => candidate.slug === initialConcept)?.slug ?? concepts[0]?.slug,
  );

  function show(next: TabId, conceptSlug = concept) {
    setTab(next);
    if (conceptSlug !== concept) setConcept(conceptSlug);
    const query = new URLSearchParams();
    if (next !== "exercises") query.set("tab", next);
    if (next === "concepts" && conceptSlug) query.set("concept", conceptSlug);
    const search = query.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }
  function select(next: TabId) {
    show(next);
    requestAnimationFrame(() => document.getElementById(`course-tab-${next}`)?.focus());
  }

  useKeyBindings([
    { chord: "Alt+Digit1", run: () => select("exercises") },
    { chord: "Alt+Digit2", run: () => select("syllabus"), enabled: Boolean(syllabus) },
    { chord: "Alt+Digit3", run: () => select("concepts"), enabled: concepts.length > 0 },
    { chord: "Mod+Enter", run: () => continueHref && router.push(continueHref), enabled: Boolean(continueHref) },
  ]);

  return (
    <div className="course-browser">
      <div className="course-tabs">
        <TabStrip tabs={tabs} active={tab} onSelect={(id) => show(id as TabId)} idPrefix="course" label="Course" />
        <span className="sb-spacer" />
        {continueHref && (
          <PrimaryButton chord="Mod+Enter" onClick={() => router.push(continueHref)}>
            {continueLabel}
          </PrimaryButton>
        )}
      </div>
      <div className="course-panel" role="tabpanel" id={`course-panel-${tab}`} aria-labelledby={`course-tab-${tab}`}>
        {tab === "exercises" && (
          <>
            {items.length > 0 && <ExerciseTable items={items} />}
            {plannedCount > 0 && <PlannedList groups={planned} count={plannedCount} labelled={items.length > 0} />}
          </>
        )}
        {tab === "syllabus" && <div className="course-prose">{syllabus}</div>}
        {tab === "concepts" && (
          <ConceptBrowser
            concepts={concepts}
            pages={conceptPages}
            items={items}
            selected={concept}
            onSelect={(slug) => show("concepts", slug)}
          />
        )}
      </div>
    </div>
  );
}

function progressMark(item: CourseItemRow): { status: Status; label: string } {
  if (item.progress === "completed") return { status: "completed", label: "Completed" };
  if (item.progress === "in-progress")
    return { status: "in-progress", label: item.tasks ? `${item.passedTasks} of ${item.tasks} tasks` : "In progress" };
  return { status: "not-started", label: "Not started" };
}

function ExerciseTable({ items }: { items: CourseItemRow[] }) {
  return (
    <RowNavigation className="exercise-table">
      <div className="exercise-head" aria-hidden="true">
        <Label className="numeric">No.</Label>
        <span />
        <Label>Exercise</Label>
        <Label>Topic</Label>
        <Label>Kind</Label>
        <Label>Concepts</Label>
        <Label>Prerequisites</Label>
        <Label className="numeric">Tasks</Label>
        <Label>Progress</Label>
      </div>
      <ol className="sb-list">
        {items.map((item, index) => {
          const mark = progressMark(item);
          return (
            <li key={item.slug} className="exercise-item">
              <Link href={item.href} className="exercise-row sb-row" data-row>
                <span className="exercise-number numeric">{index + 1}</span>
                <Thumbnail size={36} src={item.icon} />
                <span className="exercise-name">
                  <span className="exercise-title sb-row-name">{item.title}</span>
                  <span className="exercise-blurb">{item.blurb}</span>
                </span>
                <span className="exercise-cell">{item.topic}</span>
                <span className="exercise-cell">{item.kind === "concept" ? "Concept" : "Practice"}</span>
                <span className="exercise-cell">{item.concepts.map((concept) => concept.name).join(", ")}</span>
                <span className="exercise-cell">
                  {item.prerequisites.length ? item.prerequisites.map((concept) => concept.name).join(", ") : "None"}
                </span>
                <span className="exercise-cell numeric">{item.tasks || "–"}</span>
                <span className="exercise-cell">
                  <StatusMark status={mark.status} label={mark.label} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </RowNavigation>
  );
}

function ConceptBrowser({
  concepts,
  pages,
  items,
  selected,
  onSelect,
}: {
  concepts: { slug: string; name: string }[];
  pages: Record<string, ConceptPage>;
  items: CourseItemRow[];
  selected: string | undefined;
  onSelect: (slug: string) => void;
}) {
  const page = selected ? pages[selected] : undefined;
  const taught = items.filter((item) => item.kind === "concept" && item.concepts.some((c) => c.slug === selected));
  const practised = items.filter((item) => item.kind === "practice" && item.concepts.some((c) => c.slug === selected));
  const required = items.filter((item) => item.prerequisites.some((c) => c.slug === selected));
  const count = (slug: string) => items.filter((item) => item.concepts.some((c) => c.slug === slug)).length;
  return (
    <div className="concept-browser">
      <RowNavigation className="concept-list">
        <div className="concept-list-head">
          <Label>Concept</Label>
          <Label className="numeric">Exercises</Label>
        </div>
        <ul className="sb-list" role="listbox" aria-label="Concepts">
          {concepts.map((concept) => (
            <li key={concept.slug}>
              <button
                type="button"
                role="option"
                aria-selected={concept.slug === selected}
                className="concept-row sb-row"
                data-row
                onClick={() => onSelect(concept.slug)}
                onFocus={() => onSelect(concept.slug)}
              >
                <span className="sb-row-name">{concept.name}</span>
                <span className="numeric concept-count">{count(concept.slug)}</span>
              </button>
            </li>
          ))}
        </ul>
      </RowNavigation>
      <article className="concept-page" aria-label={page?.name}>
        {page ? (
          <>
            <h2 className="sb-page-title concept-title">{page.name}</h2>
            <ConceptLinks label="Taught in" items={taught} />
            <ConceptLinks label="Practised in" items={practised} />
            <ConceptLinks label="Required by" items={required} />
            {page.introduction && (
              <section className="concept-section">
                <Label>Introduction</Label>
                {page.introduction}
              </section>
            )}
            {page.about && (
              <section className="concept-section">
                <Label>About</Label>
                {page.about}
              </section>
            )}
          </>
        ) : null}
      </article>
    </div>
  );
}

function ConceptLinks({ label, items }: { label: string; items: CourseItemRow[] }) {
  if (!items.length) return null;
  return (
    <p className="concept-links">
      <Label>{label}</Label>
      {items.map((item, index) => (
        <span key={item.slug}>
          {index > 0 && <span className="sb-faint">, </span>}
          <Link href={item.href}>{item.title}</Link>
        </span>
      ))}
    </p>
  );
}

/**
 * Planned exercises by stage: each stage with its count, each exercise with its number, title, kind and blurb. They
 * are plain text in muted ink: not links, not focusable, with no hover.
 */
function PlannedList({ groups, count, labelled }: { groups: StageGroup[]; count: number; labelled: boolean }) {
  return (
    <section className="planned" aria-label="Planned exercises">
      {labelled && (
        <h2 className="planned-heading">
          <Label>Planned exercises</Label>
          <span className="planned-count">{count}</span>
        </h2>
      )}
      <div className="planned-stages">
        {groups.map((group) => (
          <section key={group.stage?.id ?? "other"} className="planned-stage" aria-label={group.stage?.name}>
            <h3 className="planned-stage-head">
              <span className="planned-stage-name">{group.stage?.name ?? "Other"}</span>
              <span className="planned-count">{group.planned.length}</span>
            </h3>
            <ol className="sb-list">
              {group.planned.map((entry) => (
                <li key={entry.slug} className="planned-row">
                  <span className="planned-number">{entry.number}</span>
                  <span className="planned-title">{entry.title}</span>
                  <span className="planned-kind">{entry.kind === "concept" ? "Concept" : "Practice"}</span>
                  <span className="planned-blurb">{entry.blurb}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
