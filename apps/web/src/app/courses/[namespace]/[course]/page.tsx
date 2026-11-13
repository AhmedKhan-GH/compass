import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Meter, StatusItem, Thumbnail } from "@compass/ui";
import { findCourse } from "@/server/content";
import { SiteFrame } from "@/components/site-frame";
import { CatalogStatus } from "@/components/catalog-status";
import { CourseBrowser, type CourseItemRow } from "@/components/course-browser";
import { Markdown } from "@/components/markdown";
import { count, groupByStage } from "@/lib/catalog";
import { assetUrl, itemHref } from "@/lib/routes";
import { progressCounts, readCourseProgress } from "../../../course-progress";
import "@/components/site.css";

export const dynamic = "force-dynamic";

type Params = { namespace: string; course: string };
type Search = { tab?: string | string[]; concept?: string | string[] };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { namespace, course } = await params;
  return { title: findCourse(`${namespace}/${course}`)?.title ?? "Course" };
}

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { namespace, course: name } = await params;
  const course = findCourse(`${namespace}/${name}`);
  if (!course) notFound();
  const search = await searchParams;
  const inDevelopment = course.status === "in-development";
  const progress = inDevelopment ? undefined : readCourseProgress(course);
  const counts = progressCounts(course, progress);
  const names = new Map(course.concepts.map((concept) => [concept.slug, concept.name]));
  const items: CourseItemRow[] = course.items.map((item) => {
    const itemProgress = progress?.items[item.slug];
    const tasks = Object.values(itemProgress?.tasks ?? {});
    return {
      slug: item.slug,
      href: itemHref(course, item.slug),
      title: item.title,
      topic: item.topic,
      blurb: item.blurb,
      kind: item.kind,
      status: item.status,
      concepts: item.concepts.map((slug) => ({ slug, name: names.get(slug) ?? slug })),
      prerequisites: item.prerequisites.map((slug) => ({ slug, name: names.get(slug) ?? slug })),
      icon: assetUrl(item.icon),
      tasks: item.tasks.length,
      progress: itemProgress?.status ?? "not-started",
      passedTasks: tasks.filter((status) => status === "passed").length,
    };
  });
  const next = items.find((item) => item.progress !== "completed") ?? items[0];
  const conceptPages = Object.fromEntries(
    course.concepts.map((concept) => [
      concept.slug,
      {
        name: concept.name,
        introduction: concept.introduction ? <Markdown>{concept.introduction}</Markdown> : undefined,
        about: concept.about ? <Markdown>{concept.about}</Markdown> : undefined,
      },
    ]),
  );
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return (
    <SiteFrame
      trail={[
        <Link key="courses" href="/">
          Courses
        </Link>,
        course.title,
      ]}
      status={
        <>
          <StatusItem>{course.source}</StatusItem>
          {course.runner && <StatusItem>{course.runner}</StatusItem>}
          {course.circuit && <StatusItem>{course.circuit}</StatusItem>}
          <CatalogStatus />
        </>
      }
    >
      <div className="course-page">
        <header className="course-heading">
          <Thumbnail size={72} src={assetUrl(course.icon)} />
          <div className="course-heading-text">
            <h1 className="sb-page-title course-title">{course.title}</h1>
            <p className="course-blurb">{course.blurb}</p>
            {course.description && <p className="course-description">{course.description}</p>}
            <p className="course-facts">
              {[
                course.items.length ? count(course.items.length, "exercise", "exercises") : undefined,
                course.planned.length ? `${course.planned.length} planned` : undefined,
                course.stages.length ? count(course.stages.length, "stage", "stages") : undefined,
                course.concepts.length ? count(course.concepts.length, "concept", "concepts") : undefined,
                `version ${course.version}`,
                course.status === "draft" ? "Draft" : undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {inDevelopment ? (
            <span className="sb-tag" data-tone="neutral">
              In development
            </span>
          ) : (
            course.items.length > 0 && (
              <div className="course-progress">
                <Meter
                  complete={counts.completed}
                  started={counts.started}
                  total={counts.total}
                  label={`${counts.completed} of ${counts.total} completed`}
                />
                <span className="course-progress-count">
                  {counts.completed} of {counts.total} completed
                </span>
              </div>
            )
          )}
        </header>
        <CourseBrowser
          items={items}
          concepts={course.concepts.map((concept) => ({ slug: concept.slug, name: concept.name }))}
          conceptPages={conceptPages}
          syllabus={course.syllabus ? <Markdown>{course.syllabus}</Markdown> : undefined}
          initialTab={first(search.tab)}
          initialConcept={first(search.concept)}
          planned={groupByStage(course.stages, course.planned)}
          plannedCount={course.planned.length}
          continueHref={inDevelopment ? undefined : next?.href}
          continueLabel={counts.completed || counts.started ? "Continue" : "Start"}
        />
      </div>
    </SiteFrame>
  );
}
