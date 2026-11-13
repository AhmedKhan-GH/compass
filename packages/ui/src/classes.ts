/** Joins class names, skipping empty ones. Safe to call from server and client components. */
export function join(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
