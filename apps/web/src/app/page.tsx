import Link from "next/link";
import { KeyHint, Label, Meter, StatusItem, Thumbnail } from "@compass/ui";
import { listCourses } from "@/server/content";
import { SiteFrame } from "@/components/site-frame";
import { RowNavigation } from "@/components/row-navigation";
import { CatalogStatus } from "@/components/catalog-status";
import { courseHref } from "@/lib/routes";
import { progressCounts, readCourseProgress } from "./course-progress";
import "@/components/site.css";

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  const courses = listCourses();
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
          <StatusItem>{courses.length === 1 ? "1 course" : `${courses.length} courses`}</StatusItem>
          <CatalogStatus />
        </>
      }
    >
      <div className="site-page">
        <header className="site-heading">
          <h1 className="sb-page-title">Courses</h1>
        </header>
        <RowNavigation className="catalog">
          <div className="catalog-head" aria-hidden="true">
            <span />
            <Label>Course</Label>
            <Label>Language</Label>
            <Label className="numeric">Exercises</Label>
            <Label>Progress</Label>
          </div>
          <ul className="sb-list">
            {courses.map((course) => {
              const counts = progressCounts(course, readCourseProgress(course));
              return (
                <li key={course.id}>
                  <Link href={courseHref(course)} className="catalog-row sb-row" data-row>
                    <Thumbnail size={64} />
                    <span className="catalog-course">
                      <span className="catalog-title sb-row-name">{course.title}</span>
                      <span className="catalog-blurb">{course.blurb}</span>
                      <span className="catalog-meta">
                        {course.id} · {course.version}
                        {course.status === "draft" ? " · Draft" : ""}
                      </span>
                    </span>
                    <span className="catalog-cell">{languageName(course.language)}</span>
                    <span className="catalog-cell numeric">{course.items.length}</span>
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </RowNavigation>
      </div>
    </SiteFrame>
  );
}

function languageName(language: string): string {
  return language.charAt(0).toUpperCase() + language.slice(1);
}
