import assert from "node:assert/strict";
import test from "node:test";
import { count, groupByCategory, groupByStage } from "../../src/lib/catalog.ts";

test("courses are grouped by category in order of first appearance, uncategorized last, plans after courses", () => {
  const ordered = groupByCategory([
    { id: "plan", status: "in-development", category: { id: "rtl", title: "RTL" } },
    { id: "course", status: "draft", category: { id: "rtl", title: "RTL" } },
  ]);
  assert.deepEqual(
    ordered[0]?.courses.map((course) => course.id),
    ["course", "plan"],
  );

  const groups = groupByCategory([
    { id: "a", category: { id: "rtl", title: "RTL" } },
    { id: "b" },
    { id: "c", category: { id: "sw", title: "Software", icon: "s.svg" } },
    { id: "d", category: { id: "rtl", title: "RTL", icon: "r.svg" } },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.category?.id, group.category?.icon, group.courses.map((course) => course.id)]),
    [
      ["rtl", "r.svg", ["a", "d"]],
      ["sw", "s.svg", ["c"]],
      [undefined, undefined, ["b"]],
    ],
  );
  assert.deepEqual(groupByCategory([]), []);
});

test("planned exercises are grouped by stage, numbered as shown, unstaged last, empty stages left out", () => {
  const stages = [
    { id: "one", name: "One" },
    { id: "two", name: "Two" },
    { id: "three", name: "Three" },
  ];
  const groups = groupByStage(stages, [
    { slug: "a", title: "A", blurb: "", kind: "concept", stage: "two" },
    { slug: "b", title: "B", blurb: "", kind: "practice", stage: "one" },
    { slug: "c", title: "C", blurb: "", kind: "concept" },
    { slug: "d", title: "D", blurb: "", kind: "concept", stage: "two" },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.stage?.id, group.planned.map((entry) => `${entry.number}${entry.slug}`)]),
    [
      ["one", ["1b"]],
      ["two", ["2a", "3d"]],
      [undefined, ["4c"]],
    ],
  );
});

test("counts", () => {
  assert.equal(count(1, "exercise", "exercises"), "1 exercise");
  assert.equal(count(130, "exercise", "exercises"), "130 exercises");
});
