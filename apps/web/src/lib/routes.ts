/** The site's own URLs. */

export function courseHref(course: { namespace: string; name: string }): string {
  return `/courses/${encodeURIComponent(course.namespace)}/${encodeURIComponent(course.name)}`;
}

export function itemHref(course: { namespace: string; name: string }, itemSlug: string): string {
  return `${courseHref(course)}/${encodeURIComponent(itemSlug)}`;
}

/** The URL of a content asset (an icon), named by the hash of its bytes in the content index. */
export function assetUrl(name: string | undefined): string | undefined {
  return name ? `/content-assets/${encodeURIComponent(name)}` : undefined;
}
