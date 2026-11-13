/** How the catalog and the course page arrange course data. Pure functions over the content views. */

type CategorySource = { category?: { id: string; title: string; icon?: string | undefined } | undefined };

export type CourseGroup<C> = {
  /** Absent for the courses that name no category; that group comes last. */
  category?: { id: string; title: string; icon?: string };
  courses: C[];
};

/**
 * Courses grouped by category, in the order each category first appears, with uncategorized courses last. Within a
 * group, courses that can be taken come before courses in development, each in index order. A category's icon is
 * the first one any of its courses carries.
 */
export function groupByCategory<C extends CategorySource & { status?: string }>(
  courses: readonly C[],
): CourseGroup<C>[] {
  const groups: CourseGroup<C>[] = [];
  const rest: C[] = [];
  for (const course of courses) {
    const category = course.category;
    if (!category) {
      rest.push(course);
      continue;
    }
    let group = groups.find((candidate) => candidate.category?.id === category.id);
    if (!group) {
      group = { category: { id: category.id, title: category.title }, courses: [] };
      groups.push(group);
    }
    if (group.category && !group.category.icon && category.icon) group.category.icon = category.icon;
    group.courses.push(course);
  }
  if (rest.length) groups.push({ courses: rest });
  // Array.prototype.sort is stable, so index order holds within each kind.
  const planned = (course: C) => (course.status === "in-development" ? 1 : 0);
  for (const group of groups) group.courses.sort((a, b) => planned(a) - planned(b));
  return groups;
}

export type Planned = {
  slug: string;
  title: string;
  blurb: string;
  kind: "concept" | "practice";
  stage?: string | undefined;
};

export type StageGroup = {
  /** Absent for planned exercises that name no stage; that group comes last. */
  stage?: { id: string; name: string };
  /** Each with its number in the list as shown, from 1. */
  planned: (Planned & { number: number })[];
};

/**
 * Planned exercises grouped by stage, in stage order and in list order within a stage, with unstaged ones last.
 * Empty stages are left out. They are numbered in the order shown, so the numbers run without gaps.
 */
export function groupByStage(
  stages: readonly { id: string; name: string }[],
  planned: readonly Planned[],
): StageGroup[] {
  const known = new Set(stages.map((stage) => stage.id));
  const groups: { stage?: { id: string; name: string }; planned: Planned[] }[] = stages.map((stage) => ({
    stage: { id: stage.id, name: stage.name },
    planned: planned.filter((entry) => entry.stage === stage.id),
  }));
  const rest = planned.filter((entry) => !entry.stage || !known.has(entry.stage));
  if (rest.length) groups.push({ planned: rest });
  let number = 0;
  return groups
    .filter((group) => group.planned.length > 0)
    .map((group) => ({ ...group, planned: group.planned.map((entry) => ({ ...entry, number: ++number })) }));
}

/** "1 exercise", "5 exercises". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
