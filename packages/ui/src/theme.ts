/**
 * The two themes: the light learn theme (the default) and the dark Sternbild theme. A theme is applied by
 * `data-theme` on the root element and kept in local storage. Safe to import from server components.
 */

export type Theme = "learn" | "dark";

export const THEMES: readonly Theme[] = ["learn", "dark"];
export const DEFAULT_THEME: Theme = "learn";
export const THEME_STORAGE_KEY = "compass:theme";

export function isTheme(value: unknown): value is Theme {
  return value === "learn" || value === "dark";
}

/** Runs in the document head before the first paint, so a stored theme never flashes the default. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="learn"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
