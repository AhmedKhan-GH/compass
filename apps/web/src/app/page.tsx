import Image from "next/image";
import Link from "next/link";
import { KeyHint, Label, Meter, StatusItem, Thumbnail } from "@compass/ui";
import { listCourses } from "@/server/content";
import { SiteFrame } from "@/components/site-frame";
import { MARK_SRC } from "@/components/brand";
import { RowNavigation } from "@/components/row-navigation";
import { CatalogStatus } from "@/components/catalog-status";
import type { CourseView } from "@compass/schema";
import { count, groupByCategory } from "@/lib/catalog";
import { assetUrl, courseHref } from "@/lib/routes";
import { progressCounts, readCourseProgress } from "./course-progress";
import "@/components/site.css";

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  const courses = listCourses();
  const exercises = courses.reduce((total, course) => total + course.items.length, 0);
  return (
    <SiteFrame
      trail={["Courses"]}
      commands={
        <span className="site-hints">
          <KeyHint chord="ArrowUp" />
          <KeyHint chord="ArrowDown" />
          <span>Select</span>
          <KeyHint chord="Enter" />
          <span>Open</span>
        </span>
      }
      status={
        <>
          <StatusItem>{count(courses.length, "course", "courses")}</StatusItem>
          <CatalogStatus />
        </>
      }
    >
      <div className="site-page">
        <header className="catalog-heading">
          <Image src={MARK_SRC} alt="" width={48} height={48} unoptimized priority className="catalog-mark" />
          <div className="catalog-heading-text">
            <h1 className="catalog-name">Compass</h1>
            <p className="catalog-descriptor">Technical skill practice platform</p>
            <p className="catalog-count">
              {count(courses.length, "course", "courses")} · {count(exercises, "exercise", "exercises")}
            </p>
          </div>
        </header>
        <RowNavigation className="catalog">
          {groupByCategory(courses).map((group) => (
            <section key={group.category?.id ?? "other"} className="catalog-group" aria-label={group.category?.title}>
              {group.category && (
                <h2 className="catalog-category">
                  <Thumbnail size={32} src={assetUrl(group.category.icon)} />
                  <span className="catalog-category-title">{group.category.title}</span>
                  <span className="catalog-category-count">{count(group.courses.length, "course", "courses")}</span>
                </h2>
              )}
              <div className="catalog-head" aria-hidden="true">
                <span />
                <Label>Course</Label>
                <Label className="numeric">Exercises</Label>
                <Label>Progress</Label>
              </div>
              <ul className="sb-list">
                {group.courses.map((course) => (
                  <li key={course.id}>
                    <CourseRow course={course} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </RowNavigation>
      </div>
    </SiteFrame>
  );
}

function CourseRow({ course }: { course: CourseView }) {
  const inDevelopment = course.status === "in-development";
  const counts = inDevelopment ? undefined : progressCounts(course, readCourseProgress(course));
  return (
    <Link href={courseHref(course)} className="catalog-row sb-row" data-row>
      <Thumbnail size={56} src={assetUrl(course.icon)} />
      <span className="catalog-course">
        <span className="catalog-title sb-row-name">{course.title}</span>
        <span className="catalog-blurb">{course.blurb}</span>
        <span className="catalog-meta">
          {course.id} · {course.version}
          {course.status === "draft" ? " · Draft" : ""}
        </span>
      </span>
      <span className="catalog-cell numeric">
        {inDevelopment ? `${course.planned.length} planned` : course.items.length}
      </span>
      {counts ? (
        <span className="catalog-progress">
          <Meter
            complete={counts.completed}
            started={counts.started}
            total={counts.total}
            label={`${counts.completed} of ${counts.total} completed`}
          />
          <span className="catalog-cell">
            {counts.completed} of {counts.total} completed
          </span>
        </span>
      ) : (
        <span className="catalog-progress">
          <span className="sb-tag" data-tone="neutral">
            In development
          </span>
        </span>
      )}
    </Link>
  );
}
