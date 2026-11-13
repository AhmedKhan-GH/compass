/**
 * VCD parsing for the waveform pane. A VCD is simulator data, not markup: parsing and rendering are bounded
 * independently of the runner's own size limit, and X and Z are kept rather than read as zero.
 */

export type WaveSignal = {
  /** The hierarchical name, scopes joined by dots. */
  name: string;
  width: number;
  /** Value changes in time order: [time, bits], bits lower-case and `width` long. */
  changes: [number, string][];
};

export type Waveform = { timescale: string; endTime: number; signals: WaveSignal[]; truncated: boolean };

export const WAVEFORM_LIMITS = { bytes: 512 * 1024, signals: 64, width: 64, events: 12_000 } as const;

export function parseWaveform(vcd: string): Waveform {
  const input = vcd.slice(0, WAVEFORM_LIMITS.bytes);
  const result: Waveform = {
    timescale: "1ns",
    endTime: 0,
    signals: [],
    truncated: vcd.length >= WAVEFORM_LIMITS.bytes,
  };
  const boundary = input.indexOf("$enddefinitions");
  if (boundary < 0) return result;
  const timescale = input.match(/\$timescale\s+([^$]+)\$end/)?.[1];
  if (timescale) result.timescale = timescale.trim().replace(/\s+/g, "");
  const scopes: string[] = [];
  const ids = new Map<string, WaveSignal[]>();
  for (const declaration of input.slice(0, boundary).matchAll(/\$(scope|upscope|var)\s+([^$]*)\$end/g)) {
    const words = (declaration[2] ?? "").trim().split(/\s+/);
    if (declaration[1] === "scope") scopes.push(words[1] ?? "");
    else if (declaration[1] === "upscope") scopes.pop();
    else {
      const width = Number(words[1]);
      const id = words[2];
      const name = words[3];
      if (!Number.isInteger(width) || width < 1 || width > WAVEFORM_LIMITS.width || !id || !name) continue;
      if (result.signals.length >= WAVEFORM_LIMITS.signals) {
        result.truncated = true;
        continue;
      }
      const signal: WaveSignal = { name: [...scopes, name].join("."), width, changes: [] };
      result.signals.push(signal);
      ids.set(id, [...(ids.get(id) ?? []), signal]);
    }
  }
  let time = 0;
  let count = 0;
  for (const line of input.slice(boundary).split(/\r?\n/)) {
    const text = line.trim();
    if (/^#\d+$/.test(text)) {
      const next = Number(text.slice(1));
      if (Number.isSafeInteger(next) && next >= time) {
        time = next;
        result.endTime = time;
      }
      continue;
    }
    const scalar = text.match(/^([01xXzZ])(\S+)$/);
    const vector = text.match(/^[bB]([01xXzZ]+)\s+(\S+)$/);
    const value = scalar?.[1] ?? vector?.[1];
    const id = scalar?.[2] ?? vector?.[2];
    const targets = id === undefined ? undefined : ids.get(id);
    if (!value || !targets) continue;
    if (++count > WAVEFORM_LIMITS.events) {
      result.truncated = true;
      break;
    }
    const lower = value.toLowerCase();
    for (const signal of targets) {
      // A vector shorter than its width is extended with its leading x or z, or with zeros.
      const fill = /^[xz]/.test(lower) ? lower.charAt(0) : "0";
      const bits = lower.padStart(signal.width, fill).slice(-signal.width);
      const previous = signal.changes.at(-1);
      if (previous && previous[0] === time) previous[1] = bits;
      else if (previous?.[1] !== bits) signal.changes.push([time, bits]);
    }
  }
  return result;
}

/** The signal's value at `time`: its last change at or before it, or all x before the first change. */
export function valueAt(signal: WaveSignal, time: number): string {
  let value = "x".repeat(signal.width);
  for (const [changed, next] of signal.changes) {
    if (changed > time) break;
    value = next;
  }
  return value;
}

/** One bit as it is; a word in hexadecimal; anything with x or z bits as its bits. */
export function displayValue(bits: string): string {
  if (/[xz]/.test(bits) || bits.length === 1) return bits;
  return (
    "0x" +
    BigInt("0b" + bits)
      .toString(16)
      .toUpperCase()
  );
}

const UNIT_NS: Record<string, number> = { s: 1e9, ms: 1e6, us: 1e3, ns: 1, ps: 1e-3, fs: 1e-6 };

/** A time in nanoseconds, from ticks of the timescale. */
export function displayTime(ticks: number, timescale: string): string {
  const match = timescale.match(/^(\d+)(s|ms|us|ns|ps|fs)$/);
  const unit = match?.[2];
  if (!match || !unit) return `${ticks} × ${timescale}`;
  const ns = ticks * Number(match[1]) * (UNIT_NS[unit] ?? 1);
  return `${Number(ns.toPrecision(7))} ns`;
}

/** Every time at which any of the signals changes, sorted and without repeats. */
export function edgeTimes(signals: readonly WaveSignal[]): number[] {
  return [...new Set(signals.flatMap((signal) => signal.changes.map(([time]) => time)))].sort((a, b) => a - b);
}

/** The edge before or after `time`, or the end of the trace when there is none. */
export function stepEdge(edges: readonly number[], time: number, direction: -1 | 1, endTime: number): number {
  if (direction < 0) return edges.filter((edge) => edge < time).at(-1) ?? 0;
  return edges.find((edge) => edge > time) ?? endTime;
}

/** Evenly spaced ticks for a time axis: about `count` of them, at 1, 2 or 5 times a power of ten. */
export function axisTicks(endTime: number, count: number): number[] {
  if (endTime <= 0 || count < 1) return [0];
  const raw = endTime / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= raw) ?? raw) || 1;
  const ticks: number[] = [];
  for (let time = 0; time <= endTime + step * 1e-9; time += step) ticks.push(Math.round(time * 1e6) / 1e6);
  return ticks;
}
