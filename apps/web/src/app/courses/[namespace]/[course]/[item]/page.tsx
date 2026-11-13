import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findItem } from "@/server/content";
import { WorkspaceLoader } from "@/components/workspace/loader";
import type { WorkspaceCourse } from "@/components/workspace/workspace";

export const dynamic = "force-dynamic";

type Params = { namespace: string; course: string; item: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { namespace, course, item } = await params;
  return { title: findItem(`${namespace}/${course}`, item)?.item.title ?? "Exercise" };
}

export default async function ItemPage({ params }: { params: Promise<Params> }) {
  const { namespace, course: name, item: slug } = await params;
  const found = findItem(`${namespace}/${name}`, slug);
  if (!found) notFound();
  const { course, item } = found;
  // Only the open item's text goes to the browser; the other items are names for the navigation.
  const summary: WorkspaceCourse = {
    id: course.id,
    namespace: course.namespace,
    name: course.name,
    title: course.title,
    language: course.language,
    indent: course.editor.indent,
    circuit: course.circuit !== undefined,
    concepts: Object.fromEntries(course.concepts.map((concept) => [concept.slug, concept.name])),
    items: course.items.map((entry) => ({ slug: entry.slug, title: entry.title })),
  };
  return <WorkspaceLoader course={summary} item={item} />;
}
