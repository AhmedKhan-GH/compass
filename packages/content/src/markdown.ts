/** Splitting instructions and hints into tasks, and finding relative links in Markdown. */

export type Section = { id: number; title: string; text: string; line: number };
export type Sections = { preamble: string; sections: Section[] };

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const TASK_HEADING = /^## (\d+)\.\s+(.+?)\s*#*\s*$/;

type Fence = { marker: string; length: number };

/** Tracks fenced code blocks line by line, so heading-like or link-like text inside them is ignored. */
class FenceTracker {
  private fence: Fence | undefined;

  /** Returns true when the line is a fence boundary or inside a fenced block. */
  step(line: string): boolean {
    const boundary = FENCE.exec(line);
    if (boundary) {
      const marker = boundary[1] ?? "";
      const rest = boundary[2] ?? "";
      if (!this.fence) this.fence = { marker: marker[0] ?? "`", length: marker.length };
      else if (marker[0] === this.fence.marker && marker.length >= this.fence.length && !rest.trim())
        this.fence = undefined;
      return true;
    }
    return this.fence !== undefined;
  }
}

/**
 * Splits Markdown at its `## N. Title` headings. The text before the first heading is the preamble.
 * Headings inside fenced code blocks are text; deeper headings stay inside their task.
 */
export function splitSections(markdown: string): Sections {
  const sections: { id: number; title: string; line: number; lines: string[] }[] = [];
  const preamble: string[] = [];
  const fences = new FenceTracker();
  for (const [index, line] of markdown.split("\n").entries()) {
    const inCode = fences.step(line);
    const heading = inCode ? null : TASK_HEADING.exec(line);
    if (heading) {
      sections.push({ id: Number(heading[1]), title: heading[2] ?? "", line: index + 1, lines: [] });
      continue;
    }
    (sections.at(-1)?.lines ?? preamble).push(line);
  }
  return {
    preamble: preamble.join("\n").trim(),
    sections: sections.map(({ lines, ...section }) => ({ ...section, text: lines.join("\n").trim() })),
  };
}

export type SplitTask = { id: number; title: string; instructions: string; hints?: string };
export type SplitText = {
  /** The preamble, or the whole text when the item has no tasks. */
  instructions: string;
  /** General hints: the text before the first numbered heading, or all of hints.md without tasks. */
  hints?: string;
  tasks: SplitTask[];
};

/**
 * The item's text as the index holds it. Assumes the headings were checked against the task ids
 * (see the `tasks` rule); a heading for an unknown task is dropped.
 */
export function splitItemText(instructions: string, hints: string | undefined, taskIds: readonly number[]): SplitText {
  if (taskIds.length === 0) {
    const general = hints?.trim();
    return { instructions: instructions.trim(), ...(general ? { hints: general } : {}), tasks: [] };
  }
  const text = splitSections(instructions);
  const hintText = hints === undefined ? { preamble: "", sections: [] } : splitSections(hints);
  const tasks = taskIds.map((id): SplitTask => {
    const section = text.sections.find((candidate) => candidate.id === id);
    const hint = hintText.sections.find((candidate) => candidate.id === id)?.text;
    return {
      id,
      title: section?.title ?? `Task ${id}`,
      instructions: section?.text ?? "",
      ...(hint ? { hints: hint } : {}),
    };
  });
  return {
    instructions: text.preamble,
    ...(hintText.preamble ? { hints: hintText.preamble } : {}),
    tasks,
  };
}

export type Link = { target: string; line: number };

const INLINE_LINK = /!?\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const REFERENCE_DEFINITION = /^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/;
const HTML_ATTRIBUTE = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const INLINE_CODE = /(`+)(?:(?!\1)[\s\S])*?\1/g;

/** Every link target in the Markdown, outside code blocks and code spans. */
export function findLinks(markdown: string): Link[] {
  const links: Link[] = [];
  const fences = new FenceTracker();
  for (const [index, raw] of markdown.split("\n").entries()) {
    if (fences.step(raw)) continue;
    if (/^( {4}|\t)/.test(raw) && raw.trim() !== "") continue;
    const line = raw.replace(INLINE_CODE, (match) => " ".repeat(match.length));
    const definition = REFERENCE_DEFINITION.exec(line);
    if (definition?.[1]) links.push({ target: unwrap(definition[1]), line: index + 1 });
    for (const match of line.matchAll(INLINE_LINK))
      if (match[1]) links.push({ target: unwrap(match[1]), line: index + 1 });
    for (const match of line.matchAll(HTML_ATTRIBUTE)) {
      const target = match[1] ?? match[2];
      if (target) links.push({ target, line: index + 1 });
    }
  }
  return links;
}

function unwrap(target: string): string {
  return target.startsWith("<") && target.endsWith(">") ? target.slice(1, -1) : target;
}

/** A link to a file of the pack rather than to a web address, a site path or an anchor. */
export function isRelativeLink(target: string): boolean {
  if (target === "" || target.startsWith("#") || target.startsWith("/") || target.startsWith("?")) return false;
  return !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target);
}

/** The path part of a relative link: without its query and fragment, percent-decoded. */
export function linkPath(target: string): string {
  const cut = target.search(/[?#]/);
  const bare = cut === -1 ? target : target.slice(0, cut);
  try {
    return decodeURI(bare);
  } catch {
    return bare;
  }
}
