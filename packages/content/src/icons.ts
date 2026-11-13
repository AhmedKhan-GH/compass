/**
 * The icon rule. An icon is read as text, never rendered here: a small, strict reader walks its tags and
 * attributes and reports everything the "Icons" section of docs/ARCHITECTURE.md forbids. When in doubt it refuses.
 */
import { createHash } from "node:crypto";
import { ICON_LIMIT_BYTES } from "@compass/schema";
import { formatBytes } from "./files.ts";

export type IconProblem = { message: string; line?: number; warning?: true };

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** The asset name of an icon: the SHA-256 of its bytes, with `.svg`. */
export function iconAssetName(content: string): string {
  return `${createHash("sha256").update(content, "utf8").digest("hex")}.svg`;
}

type Attribute = { name: string; raw: string; value: string };
type Tag = { name: string; attributes: Attribute[]; line: number };

const NAME = /^[A-Za-z_:][A-Za-z0-9_.:-]*/;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const ID_REFERENCE = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/;
const FORBIDDEN_ELEMENTS: Record<string, string> = {
  script: "a script element",
  foreignobject: "a foreignObject element",
  image: "an image element",
};

/** Every problem of the icon, in the order found. An empty list means the icon is acceptable. */
export function checkIcon(content: string): IconProblem[] {
  const problems: IconProblem[] = [];
  const add = (message: string, line?: number) => problems.push(line === undefined ? { message } : { message, line });
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > ICON_LIMIT_BYTES) {
    add(`the icon is ${bytes} bytes, over the limit of ${formatBytes(ICON_LIMIT_BYTES)}`);
    return problems;
  }
  checkAnywhere(content, add);

  const lineAt = lineCounter(content);
  let root: Tag | undefined;
  let styleDepth = 0;
  let position = 0;
  while (position < content.length) {
    const open = content.indexOf("<", position);
    const textEnd = open === -1 ? content.length : open;
    if (styleDepth > 0) {
      const raw = content.slice(position, textEnd);
      if (raw.includes("&")) checkAnywhere(decodeEntities(raw), (message) => add(`${message} (written with entities)`, lineAt(position)));
      checkCss(decodeEntities(raw), "a style element", lineAt(position), add);
    } else if (!root && content.slice(position, textEnd).trim() !== "")
      add("there is text before the svg element", lineAt(position));
    if (open === -1) break;
    const line = lineAt(open);
    const rest = content.slice(open);

    if (rest.startsWith("<!--")) {
      const end = content.indexOf("-->", open + 4);
      if (end === -1) return [...problems, { message: "a comment is not closed", line }];
      position = end + 3;
      continue;
    }
    if (rest.startsWith("<![CDATA[")) {
      const end = content.indexOf("]]>", open + 9);
      if (end === -1) return [...problems, { message: "a CDATA section is not closed", line }];
      if (styleDepth > 0) checkCss(content.slice(open + 9, end), "a style element", line, add);
      position = end + 3;
      continue;
    }
    if (rest.startsWith("<!")) {
      add("a document type or entity declaration", line);
      let end = content.indexOf(">", open);
      const subset = content.indexOf("[", open);
      if (/^<!DOCTYPE/i.test(rest) && subset !== -1 && (end === -1 || subset < end)) {
        // An internal subset: skip to its closing `]>`, reporting each declaration inside it.
        const close = /\]\s*>/g;
        close.lastIndex = subset;
        const found = close.exec(content);
        const stop = found ? found.index : content.length;
        for (const inner of content.slice(subset, stop).matchAll(/<!/g)) add("a document type or entity declaration", lineAt(subset + inner.index));
        end = found ? found.index + found[0].length - 1 : -1;
      }
      position = end === -1 ? content.length : end + 1;
      continue;
    }
    if (rest.startsWith("<?")) {
      const end = content.indexOf("?>", open + 2);
      if (end === -1) return [...problems, { message: "a processing instruction is not closed", line }];
      const declaration = open === 0 && /^<\?xml\s/.test(rest);
      if (!declaration) add("a processing instruction (only the XML declaration at the start is allowed)", line);
      position = end + 2;
      continue;
    }
    if (rest.startsWith("</")) {
      const name = NAME.exec(rest.slice(2))?.[0];
      const end = content.indexOf(">", open);
      if (!name || end === -1) return [...problems, { message: "a closing tag cannot be read", line }];
      if (localName(name) === "style" && styleDepth > 0) styleDepth--;
      position = end + 1;
      continue;
    }
    const parsed = readTag(content, open, line);
    if (!parsed.ok) return [...problems, { message: parsed.message, line }];
    const { tag, end, selfClosing } = parsed;
    if (!root) {
      root = tag;
      checkRoot(tag, add, (message, at) => problems.push({ message, ...(at === undefined ? {} : { line: at }), warning: true }));
    }
    checkTag(tag, add);
    if (localName(tag.name) === "style" && !selfClosing) styleDepth++;
    position = end;
  }
  if (!root) add("the file holds no svg element");
  return problems;
}

/** References to `javascript:` and `data:` and style imports are refused wherever they appear, comments included. */
function checkAnywhere(content: string, add: (message: string, line?: number) => void): void {
  const lineAt = lineCounter(content);
  for (const [pattern, what] of [
    [/\bjavascript\s*:/gi, "a javascript: reference"],
    [/\bdata\s*:/gi, "a data: reference"],
    [/@import\b/gi, "a style import (@import)"],
  ] as const)
    for (const match of content.matchAll(pattern)) add(what, lineAt(match.index));
}

function checkRoot(tag: Tag, add: (message: string, line?: number) => void, warn: (message: string, line?: number) => void): void {
  if (tag.name !== "svg") {
    add(`the root element is ${tag.name}, not svg`, tag.line);
    return;
  }
  if (tag.attributes.find((attribute) => attribute.name === "xmlns")?.value !== SVG_NAMESPACE)
    warn(`the svg element does not declare xmlns="${SVG_NAMESPACE}", so a browser will not draw it as an image`, tag.line);
  const viewBox = tag.attributes.find((attribute) => attribute.name === "viewBox");
  if (!viewBox) {
    add("the svg element has no viewBox", tag.line);
  } else {
    const parts = viewBox.value.trim().split(/[\s,]+/);
    if (parts.length !== 4 || !parts.every((part) => NUMBER.test(part)))
      add(`the viewBox "${viewBox.value}" is not four numbers`, tag.line);
    else {
      const [, , width, height] = parts.map(Number);
      if (width === undefined || height === undefined || !(width > 0) || !(height > 0))
        add(`the viewBox "${viewBox.value}" needs a positive width and height`, tag.line);
      else if (width !== height) add(`the viewBox "${viewBox.value}" is not square`, tag.line);
    }
  }
}

function checkTag(tag: Tag, add: (message: string, line?: number) => void): void {
  const element = localName(tag.name).toLowerCase();
  const forbidden = FORBIDDEN_ELEMENTS[element];
  if (forbidden) add(forbidden, tag.line);
  for (const attribute of tag.attributes) {
    const local = localName(attribute.name).toLowerCase();
    if (local.startsWith("on")) add(`an event handler attribute (${attribute.name})`, tag.line);
    if (local === "href" && !ID_REFERENCE.test(attribute.value.trim()))
      add(`${attribute.name}="${attribute.raw}" is not a reference to an id in the file (#id)`, tag.line);
    if (local === "attributename" && /^(?:[\w-]+:)?href$/i.test(attribute.value.trim()))
      add(`an animation of ${attribute.value.trim()}`, tag.line);
    if (attribute.raw.includes("&")) checkAnywhere(attribute.value, (message) => add(`${message} (written with entities)`, tag.line));
    if (local === "style") checkCss(attribute.value, "a style attribute", tag.line, add);
    else checkUrls(attribute.value, `the attribute ${attribute.name}`, tag.line, add);
  }
}

/**
 * CSS from a style element or attribute, as the browser will read it: no escapes (they could spell url or @import)
 * and url() only to an id in the file. Imports and javascript: or data: references are found by checkAnywhere.
 */
function checkCss(css: string, where: string, line: number, add: (message: string, line?: number) => void): void {
  if (css.includes("\\")) add(`a CSS escape in ${where}`, line);
  checkUrls(css, where, line, add);
}

function checkUrls(text: string, where: string, line: number, add: (message: string, line?: number) => void): void {
  const opener = /url\s*\(/gi;
  for (const match of text.matchAll(opener)) {
    const after = text.slice(match.index + match[0].length);
    const argument = /^\s*(?:"([^"]*)"|'([^']*)'|([^)\s"']*))\s*\)/.exec(after);
    const target = argument ? (argument[1] ?? argument[2] ?? argument[3] ?? "") : undefined;
    if (target === undefined || !ID_REFERENCE.test(target))
      add(`url(${target ?? after.slice(0, 40)}) in ${where} is not a reference to an id in the file (url(#id))`, line);
  }
}

type ReadTag = { ok: true; tag: Tag; end: number; selfClosing: boolean } | { ok: false; message: string };

/** Reads a start tag at `open` (the `<`): its name and its quoted attributes. */
function readTag(content: string, open: number, line: number): ReadTag {
  let index = open + 1;
  const name = NAME.exec(content.slice(index))?.[0];
  if (!name) return { ok: false, message: "a tag cannot be read" };
  index += name.length;
  const attributes: Attribute[] = [];
  for (;;) {
    const space = /^\s*/.exec(content.slice(index))?.[0] ?? "";
    index += space.length;
    if (content.startsWith("/>", index)) return { ok: true, tag: { name, attributes, line }, end: index + 2, selfClosing: true };
    if (content.startsWith(">", index)) return { ok: true, tag: { name, attributes, line }, end: index + 1, selfClosing: false };
    if (index >= content.length) return { ok: false, message: `the tag ${name} is not closed` };
    if (space.length === 0) return { ok: false, message: `the tag ${name} cannot be read` };
    const attributeName = NAME.exec(content.slice(index))?.[0];
    if (!attributeName) return { ok: false, message: `an attribute of ${name} cannot be read` };
    index += attributeName.length;
    const equals = /^\s*=\s*/.exec(content.slice(index))?.[0];
    if (!equals) return { ok: false, message: `the attribute ${attributeName} of ${name} has no quoted value` };
    index += equals.length;
    const quote = content[index];
    if (quote !== '"' && quote !== "'")
      return { ok: false, message: `the attribute ${attributeName} of ${name} has no quoted value` };
    const close = content.indexOf(quote, index + 1);
    if (close === -1) return { ok: false, message: `the attribute ${attributeName} of ${name} is not closed` };
    const raw = content.slice(index + 1, close);
    if (raw.includes("<")) return { ok: false, message: `the attribute ${attributeName} of ${name} holds a <` };
    attributes.push({ name: attributeName, raw, value: decodeEntities(raw) });
    index = close + 1;
  }
}

function localName(name: string): string {
  const colon = name.lastIndexOf(":");
  return colon === -1 ? name : name.slice(colon + 1);
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** Resolves XML character references and the predefined entities, so encoded text is checked as it will be read. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[A-Za-z]+);/g, (whole, body: string) => {
    if (body.startsWith("#")) {
      const code = body[1] === "x" || body[1] === "X" ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

function lineCounter(content: string): (index: number) => number {
  const starts = [0];
  for (let index = 0; index < content.length; index++) if (content[index] === "\n") starts.push(index + 1);
  return (index) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if ((starts[middle] ?? 0) <= index) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };
}
