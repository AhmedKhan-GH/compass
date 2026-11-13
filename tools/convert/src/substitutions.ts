/**
 * References to the labels of the old interface, rewritten to the labels of the new one.
 * Applied to Markdown only, as a plain string replacement of every occurrence.
 */
export const SUBSTITUTIONS: readonly (readonly [from: string, to: string])[] = [
  ["**Schematic**", "**Circuit**"],
  ["**Waveforms**", "**Waveform**"],
];

export interface SubstitutionCount {
  from: string;
  to: string;
  count: number;
}

/** Applies the table and returns the new text with the number of replacements per entry. */
export function substitute(text: string): { text: string; counts: SubstitutionCount[] } {
  const counts: SubstitutionCount[] = [];
  let out = text;
  for (const [from, to] of SUBSTITUTIONS) {
    const parts = out.split(from);
    counts.push({ from, to, count: parts.length - 1 });
    out = parts.join(to);
  }
  return { text: out, counts };
}
