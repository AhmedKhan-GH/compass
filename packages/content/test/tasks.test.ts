/** The splitting of instructions and hints into tasks, ported from the old app's tasks.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { splitItemText, splitSections } from "../src/markdown.ts";

const instructions =
  "Common context.\n\n## 1. First\nRead one bit.\n```text\n## 9. This is an example, not a task\n```\n\n## 2. Second\nJoin two bits.\n### Example\nMore detail.";

test("numbered headings split the text; fenced examples and deeper headings stay inside their task", () => {
  const { preamble, sections } = splitSections(instructions);
  assert.equal(preamble, "Common context.");
  assert.deepEqual(
    sections.map((section) => [section.id, section.title]),
    [
      [1, "First"],
      [2, "Second"],
    ],
  );
  assert.ok(sections[0]?.text.includes("## 9."));
  assert.equal(sections[1]?.text, "Join two bits.\n### Example\nMore detail.");
});

test("a fence closes only with the same marker of at least the same length", () => {
  const markdown = "Intro\n````md\n```\n## 1. Inside\n```\n````\n## 1. Real\nText";
  const { sections } = splitSections(markdown);
  assert.deepEqual(
    sections.map((section) => section.title),
    ["Real"],
  );
  const tilde = splitSections("~~~\n## 1. Inside\n```\n## 2. Still inside\n~~~\n## 1. Real\nText");
  assert.deepEqual(
    tilde.sections.map((section) => section.title),
    ["Real"],
  );
});

test("a heading with trailing hashes keeps its title; unnumbered headings are text", () => {
  const { preamble, sections } = splitSections("## Overview\nText\n## 1. Light it ##\nBody");
  assert.equal(preamble, "## Overview\nText");
  assert.equal(sections[0]?.title, "Light it");
});

test("item text: tasks take their sections, the preamble stays general", () => {
  const split = splitItemText(instructions, undefined, [1, 2]);
  assert.equal(split.instructions, "Common context.");
  assert.equal(split.hints, undefined);
  assert.deepEqual(
    split.tasks.map((task) => [task.id, task.title]),
    [
      [1, "First"],
      [2, "Second"],
    ],
  );
});

test("hints keep general guidance separate and preserve fenced examples", () => {
  const hints =
    "Shared advice.\n\n## 1. First\nHint one.\n```md\n## 3. Example heading\n```\n\n## 2. Second\nHint two.";
  const split = splitItemText("## 1. A\nx\n## 2. B\ny\n## 3. C\nz", hints, [1, 2, 3]);
  assert.equal(split.hints, "Shared advice.");
  assert.equal(split.tasks[0]?.hints, "Hint one.\n```md\n## 3. Example heading\n```");
  assert.equal(split.tasks[1]?.hints, "Hint two.");
  assert.equal(split.tasks[2]?.hints, undefined);
  assert.equal(splitItemText("## 1. A\nx", "Unnumbered advice", [1]).hints, "Unnumbered advice");
});

test("without tasks the whole text is the instructions and all of hints.md is general", () => {
  const split = splitItemText("## 1. Puzzle\nSolve it.\n", "## 1. Puzzle hint\n", []);
  assert.deepEqual(split, { instructions: "## 1. Puzzle\nSolve it.", hints: "## 1. Puzzle hint", tasks: [] });
  assert.equal(splitItemText("Text", "   \n", []).hints, undefined);
});
