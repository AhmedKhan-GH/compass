import type { CourseProgress, CourseView } from "@compass/schema";
import { courseProgress } from "@/server/progress";

/** The learner's progress in a course, or none when the store cannot be read; the page renders either way. */
export function readCourseProgress(course: CourseView): CourseProgress | undefined {
  try {
    return courseProgress(course);
  } catch (error) {
    console.error(`Progress for ${course.id} could not be read.`, error);
    return undefined;
  }
}

/** Counts for a course's progress mark. */
export function progressCounts(course: CourseView, progress: CourseProgress | undefined) {
  let completed = 0;
  let started = 0;
  for (const item of course.items) {
    const status = progress?.items[item.slug]?.status;
    if (status === "completed") completed += 1;
    else if (status === "in-progress") started += 1;
  }
  return { completed, started, total: course.items.length };
}
