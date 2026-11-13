/**
 * Access to the content index. This is the only module in the app that reads it.
 * Pages and API responses use the views, which carry no checks; only the run API uses `findIndexedItem`.
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  ContentIndex,
  DEFAULT_CONTENT_INDEX_PATH,
  toCourseView,
  toItemView,
  type CourseView,
  type IndexedCourse,
  type IndexedItem,
  type ItemView,
} from "@compass/schema";
import { repositoryRoot } from "./paths.ts";

let cached: { path: string; mtimeMs: number; index: ContentIndex } | undefined;

export function contentIndexPath(): string {
  return path.resolve(repositoryRoot(), process.env.COMPASS_CONTENT_INDEX ?? DEFAULT_CONTENT_INDEX_PATH);
}

/** Reads and validates the index, and reads it again when the file changes. */
export function contentIndex(): ContentIndex {
  const file = contentIndexPath();
  let mtimeMs: number;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    throw new Error(`The content index is missing at ${file}. Run "npm run content:build".`);
  }
  if (!cached || cached.path !== file || cached.mtimeMs !== mtimeMs)
    cached = { path: file, mtimeMs, index: ContentIndex.parse(JSON.parse(readFileSync(file, "utf8"))) };
  return cached.index;
}

function findIndexedCourse(courseId: string): IndexedCourse | undefined {
  return contentIndex().courses.find((course) => course.id === courseId);
}

/** Server-only: the item with its checks, for building a runner job. */
export function findIndexedItem(
  courseId: string,
  itemSlug: string,
): { course: IndexedCourse; item: IndexedItem } | undefined {
  const course = findIndexedCourse(courseId);
  const item = course?.items.find((candidate) => candidate.slug === itemSlug);
  return course && item ? { course, item } : undefined;
}

export function listCourses(): CourseView[] {
  return contentIndex().courses.map(toCourseView);
}

export function findCourse(courseId: string): CourseView | undefined {
  const course = findIndexedCourse(courseId);
  return course && toCourseView(course);
}

export function findItem(courseId: string, itemSlug: string): { course: CourseView; item: ItemView } | undefined {
  const found = findIndexedItem(courseId, itemSlug);
  return found && { course: toCourseView(found.course), item: toItemView(found.item) };
}
