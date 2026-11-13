/**
 * The arithmetic of docked panes. A split divides a length among its panes as shares of the window, each pane with
 * a minimum in pixels and no maximum, and 1 px rules between them. Everything here is plain numbers, so it can be
 * tested without a browser.
 */

/** Shares scaled to sum to 1. Non-finite or negative shares count as 0; all zeros become equal shares. */
export function normalizeShares(shares: readonly number[]): number[] {
  const clean = shares.map((share) => (Number.isFinite(share) && share > 0 ? share : 0));
  const sum = clean.reduce((total, share) => total + share, 0);
  if (sum === 0) return clean.map(() => 1 / Math.max(1, clean.length));
  return clean.map((share) => share / sum);
}

/** The space left for panes once the rules between them are taken out. */
export function paneSpace(total: number, count: number, rule = 1): number {
  return Math.max(0, total - Math.max(0, count - 1) * rule);
}

/**
 * The pixel size of each pane: its share of the space, raised to its minimum, with the panes above their minimums
 * giving up what the raised ones took. When the space is smaller than the minimums together, the minimums are
 * scaled down in proportion.
 */
export function resolveSizes(
  total: number,
  shares: readonly number[],
  minimums: readonly number[],
  rule = 1,
): number[] {
  const count = shares.length;
  const space = paneSpace(total, count, rule);
  const mins = shares.map((_, index) => Math.max(0, minimums[index] ?? 0));
  const minTotal = mins.reduce((sum, min) => sum + min, 0);
  if (minTotal >= space) return minTotal === 0 ? mins.map(() => 0) : mins.map((min) => (min / minTotal) * space);

  const normalized = normalizeShares(shares);
  const sizes = new Array<number>(count).fill(0);
  const fixed = new Set<number>();
  // Pin every pane whose share falls below its minimum, then share the rest among the others. Each round pins at
  // least one more pane or finishes, so this ends within `count` rounds.
  for (;;) {
    const free = normalized.map((share, index) => (fixed.has(index) ? 0 : share));
    const freeShare = free.reduce((sum, share) => sum + share, 0);
    const pinned = [...fixed].reduce((sum, index) => sum + (mins[index] ?? 0), 0);
    const left = space - pinned;
    let changed = false;
    for (let index = 0; index < count; index++) {
      if (fixed.has(index)) {
        sizes[index] = mins[index] ?? 0;
        continue;
      }
      const size = freeShare > 0 ? ((free[index] ?? 0) / freeShare) * left : left / (count - fixed.size);
      if (size < (mins[index] ?? 0)) {
        fixed.add(index);
        changed = true;
      }
      sizes[index] = size;
    }
    if (!changed) return sizes;
  }
}

/** Shares from pixel sizes. */
export function sharesFromSizes(sizes: readonly number[]): number[] {
  return normalizeShares(sizes);
}

/**
 * Moves the rule after pane `index` by `delta` pixels (positive moves it right or down) and returns the new shares.
 * Only the two panes beside the rule change, and neither goes below its minimum.
 */
export function moveRule(
  total: number,
  shares: readonly number[],
  minimums: readonly number[],
  index: number,
  delta: number,
  rule = 1,
): number[] {
  const sizes = resolveSizes(total, shares, minimums, rule);
  const before = sizes[index];
  const after = sizes[index + 1];
  if (before === undefined || after === undefined) return normalizeShares(shares);
  const minBefore = Math.min(before, minimums[index] ?? 0);
  const minAfter = Math.min(after, minimums[index + 1] ?? 0);
  const clamped = Math.max(minBefore - before, Math.min(after - minAfter, delta));
  sizes[index] = before + clamped;
  sizes[index + 1] = after - clamped;
  return sharesFromSizes(sizes);
}

/** The CSS grid track list for a split: each pane `minmax(min, share fr)`, with a rule track between panes. */
export function gridTracks(shares: readonly number[], minimums: readonly number[], rule = 1): string {
  const normalized = normalizeShares(shares);
  return normalized
    .map((share, index) => `minmax(${Math.max(0, minimums[index] ?? 0)}px, ${round(share * 1000)}fr)`)
    .join(` ${rule}px `);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Parses stored shares, returning undefined unless they are `count` finite positive numbers. */
export function parseStoredShares(text: string | null | undefined, count: number): number[] | undefined {
  if (!text) return undefined;
  try {
    const value: unknown = JSON.parse(text);
    if (
      Array.isArray(value) &&
      value.length === count &&
      value.every((item): item is number => typeof item === "number" && Number.isFinite(item) && item > 0)
    )
      return normalizeShares(value);
  } catch {
    // A stored value from another version is ignored.
  }
  return undefined;
}
