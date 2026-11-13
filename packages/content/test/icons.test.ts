/** The icon rule: an approved-style icon passes; each forbidden thing is an error with its line. */
import assert from "node:assert/strict";
import { readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { checkIcon } from "../src/icons.ts";
import { FIXTURE_PACK, check, editToml, messages, temporaryDirectory, temporaryPack } from "./helpers.ts";

const good = await readFile(path.join(FIXTURE_PACK, "icon.svg"), "utf8");

/** The problems of the fixture icon with `body` added before its closing tag, as "line: message". */
function withBody(body: string): string[] {
  return problems(good.replace("</svg>", `${body}\n</svg>`));
}

function problems(svg: string): string[] {
  return checkIcon(svg).map((problem) => `${problem.warning ? "warning " : ""}${problem.line ?? "-"}: ${problem.message}`);
}

const LAST = good.split("\n").length - 1;

test("an icon with gradients, filters, data- attributes and references to its own ids passes", () => {
  assert.deepEqual(problems(good), []);
  assert.deepEqual(
    withBody(
      '<style><![CDATA[.a { fill: url(#tile-fill); }]]></style><style>.b { stroke: URL( "#tile-fill" ) }</style>' +
        "<rect class=\"a\" style=\"fill: url('#tile-fill')\" width=\"4\" height=\"4\"/><!-- a comment -->",
    ),
    [],
  );
  assert.deepEqual(problems('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8,-8,16,16"/>'), []);
});

test("the root element is svg", () => {
  assert.deepEqual(problems('<g xmlns="http://www.w3.org/2000/svg"/>'), ["1: the root element is g, not svg"]);
  assert.deepEqual(problems("plain text"), ["-: the file holds no svg element", "1: there is text before the svg element"].reverse());
});

test("the viewBox is four numbers, square and positive", () => {
  const root = (viewBox: string) => problems(`<svg xmlns="http://www.w3.org/2000/svg"${viewBox}></svg>`);
  assert.deepEqual(root(""), ["1: the svg element has no viewBox"]);
  assert.deepEqual(root(' viewbox="0 0 64 64"'), ["1: the svg element has no viewBox"]);
  assert.deepEqual(root(' viewBox="0 0 64 32"'), ['1: the viewBox "0 0 64 32" is not square']);
  assert.deepEqual(root(' viewBox="0 0 64"'), ['1: the viewBox "0 0 64" is not four numbers']);
  assert.deepEqual(root(' viewBox="0 0 sixty 64"'), ['1: the viewBox "0 0 sixty 64" is not four numbers']);
  assert.deepEqual(root(' viewBox="0 0 0 0"'), ['1: the viewBox "0 0 0 0" needs a positive width and height']);
  assert.deepEqual(root(' viewBox="0 0 -4 -4"'), ['1: the viewBox "0 0 -4 -4" needs a positive width and height']);
  assert.deepEqual(root(' viewBox="0 0 1e2 100"'), []);
});

test("no script element, in any case or namespace prefix", () => {
  assert.deepEqual(withBody("<script>alert(1)</script>"), [`${LAST}: a script element`]);
  assert.deepEqual(withBody("<SCRIPT/>"), [`${LAST}: a script element`]);
  assert.deepEqual(withBody('<svg:script xmlns:svg="http://www.w3.org/2000/svg"/>'), [`${LAST}: a script element`]);
});

test("no event handler attribute", () => {
  assert.deepEqual(withBody('<rect onclick="go()" width="1" height="1"/>'), [`${LAST}: an event handler attribute (onclick)`]);
  assert.deepEqual(problems(good.replace("<svg ", '<svg OnLoad="go()" ')), ["2: an event handler attribute (OnLoad)"]);
});

test("no foreignObject and no image element", () => {
  assert.deepEqual(withBody("<foreignObject><div/></foreignObject>"), [`${LAST}: a foreignObject element`]);
  assert.deepEqual(withBody("<FOREIGNOBJECT/>"), [`${LAST}: a foreignObject element`]);
  assert.deepEqual(withBody('<image href="#lamp" width="1" height="1"/>'), [`${LAST}: an image element`]);
});

test("no document type or entity declaration", () => {
  const svg = good.replace("<svg ", '<!DOCTYPE svg [\n<!ENTITY lamp "x">\n]>\n<svg ');
  assert.deepEqual(problems(svg), ["2: a document type or entity declaration", "3: a document type or entity declaration"]);
  assert.deepEqual(withBody("<!entity x 'y'>"), [`${LAST}: a document type or entity declaration`]);
});

test("no style import", () => {
  assert.deepEqual(withBody('<style>@import "theme.css";</style>'), [`${LAST}: a style import (@import)`]);
  assert.deepEqual(withBody("<style>@IMPORT url(#a);</style>"), [`${LAST}: a style import (@import)`]);
  assert.deepEqual(problems(good.replace("?>", "?>\n<?xml-stylesheet href=\"theme.css\"?>")), [
    "2: a processing instruction (only the XML declaration at the start is allowed)",
  ]);
});

test("href and xlink:href point only to an id in the file", () => {
  assert.deepEqual(withBody('<use href="other.svg#lamp"/>'), [
    `${LAST}: href="other.svg#lamp" is not a reference to an id in the file (#id)`,
  ]);
  assert.deepEqual(withBody('<a xlink:href="https://example.org/"><use xlink:href="#lamp"/></a>'), [
    `${LAST}: xlink:href="https://example.org/" is not a reference to an id in the file (#id)`,
  ]);
  assert.deepEqual(withBody('<set attributeName="xlink:href" to="#lamp"/>'), [`${LAST}: an animation of xlink:href`]);
});

test("url() points only to an id in the file, in attributes, style elements and style attributes", () => {
  assert.deepEqual(withBody('<rect fill="url(https://example.org/p.svg#g)" width="1" height="1"/>'), [
    `${LAST}: url(https://example.org/p.svg#g) in the attribute fill is not a reference to an id in the file (url(#id))`,
  ]);
  assert.deepEqual(withBody("<style>.a { fill: url('pattern.svg') }</style>"), [
    `${LAST}: url(pattern.svg) in a style element is not a reference to an id in the file (url(#id))`,
  ]);
  assert.deepEqual(withBody('<rect style="filter: URL(#tile-shadow); fill: url(paint.svg)" width="1" height="1"/>'), [
    `${LAST}: url(paint.svg) in a style attribute is not a reference to an id in the file (url(#id))`,
  ]);
  assert.deepEqual(withBody('<rect fill="u&#114;l(paint.svg)" width="1" height="1"/>'), [
    `${LAST}: url(paint.svg) in the attribute fill is not a reference to an id in the file (url(#id))`,
  ]);
  assert.deepEqual(withBody("<style>.a { fill: \\75 rl(paint.svg) }</style>"), [`${LAST}: a CSS escape in a style element`]);
});

test("no javascript: or data: reference anywhere", () => {
  assert.deepEqual(withBody("<!-- javascript:alert(1) -->"), [`${LAST}: a javascript: reference`]);
  assert.deepEqual(withBody('<a href="#lamp" data-x="JavaScript:go()"/>'), [`${LAST}: a javascript: reference`]);
  assert.deepEqual(withBody('<a xlink:href="data:image/png;base64,AAAA"/>'), [
    `${LAST}: a data: reference`,
    `${LAST}: xlink:href="data:image/png;base64,AAAA" is not a reference to an id in the file (#id)`,
  ]);
  assert.deepEqual(withBody('<a data-x="&#106;avascript:go()"/>'), [`${LAST}: a javascript: reference (written with entities)`]);
  assert.deepEqual(withBody("<title>Metadata: unchanged</title>"), [], "a word that ends in data is not a reference");
});

test("an icon over 256 KiB is refused; a missing SVG namespace is a warning", () => {
  const big = good.replace("</svg>", `<!-- ${"x".repeat(256 * 1024)} -->\n</svg>`);
  assert.deepEqual(problems(big), [`-: the icon is ${Buffer.byteLength(big)} bytes, over the limit of 256 KiB`]);
  assert.deepEqual(problems('<svg viewBox="0 0 1 1"/>'), [
    'warning 1: the svg element does not declare xmlns="http://www.w3.org/2000/svg", so a browser will not draw it as an image',
  ]);
});

test("unreadable markup is refused rather than guessed at", () => {
  assert.deepEqual(withBody("<rect width=4/>"), [`${LAST}: the attribute width of rect has no quoted value`]);
  assert.deepEqual(withBody("<rect width='4"), [`${LAST}: the attribute width of rect is not closed`]);
  assert.deepEqual(withBody("<!-- open"), [`${LAST}: a comment is not closed`]);
});

test("the pack's icons are checked where they are, as the icons rule", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/drive-high/icon.svg"), good.replace("<svg ", '<svg onload="x()" '));
  await writeFile(path.join(pack, "icon.svg"), good.replace('viewBox="0 0 64 64"', 'viewBox="0 0 64 48"'));
  const diagnostics = (await check(pack)).filter((d) => d.rule === "icons");
  assert.deepEqual(
    diagnostics.map((d) => [d.item, d.file, d.message]),
    [
      [undefined, "icon.svg", 'the viewBox "0 0 64 48" is not square (line 2)'],
      ["drive-high", "items/drive-high/icon.svg", "an event handler attribute (onload) (line 2)"],
    ],
  );
});

test("an icon that is a link or too large is an icons error from the loader", async (t) => {
  const pack = await temporaryPack(t);
  const outside = await temporaryDirectory(t);
  await writeFile(path.join(outside, "icon.svg"), good);
  await rm(path.join(pack, "icon.svg"));
  await symlink(path.join(outside, "icon.svg"), path.join(pack, "icon.svg"));
  await writeFile(path.join(pack, "items/drive-high/icon.svg"), "x".repeat(256 * 1024 + 1));
  assert.deepEqual(messages(await check(pack), "icons"), [
    "error: icon.svg is a symbolic link; packs may not contain links",
    "error: items/drive-high/icon.svg is 262145 bytes, over the limit of 256 KiB for this file",
  ]);
});

test("a category icon needs a [category] table", async (t) => {
  const pack = await temporaryPack(t);
  await editToml(path.join(pack, "course.toml"), (course) => {
    delete course.category;
  });
  assert.deepEqual(messages(await check(pack), "icons"), [
    "error: category-icon.svg is present but course.toml has no [category] table",
  ]);
});
