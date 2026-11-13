/** The site's own URLs. */

export function courseHref(course: { namespace: string; name: string }): string {
  return `/courses/${encodeURIComponent(course.namespace)}/${encodeURIComponent(course.name)}`;
}

export function itemHref(course: { namespace: string; name: string }, itemSlug: string): string {
  return `${courseHref(course)}/${encodeURIComponent(itemSlug)}`;
}
