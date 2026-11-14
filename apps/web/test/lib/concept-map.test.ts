import assert from "node:assert/strict";
import test from "node:test";
import {
  ancestors,
  conceptGraph,
  crossingCount,
  edgePath,
  highlight,
  layoutMap,
  neighbour,
  placeInOrder,
  type MapConcept,
  type MapItem,
  type MapLayout,
  type MapMetrics,
} from "../../src/lib/concept-map.ts";

const metrics: MapMetrics = { nodeWidth: 100, nodeHeight: 40, layerGap: 40, nodeGap: 10, laneGap: 6, padding: 20 };

const concept = (slug: string): MapConcept => ({ slug, name: slug.toUpperCase() });
const lesson = (slug: string, prerequisites: string[] = [], concepts = [slug]): MapItem => ({
  slug: `learn-${slug}`,
  kind: "concept",
  concepts,
  prerequisites,
});
const practice = (slug: string, concepts: string[]): MapItem => ({
  slug,
  kind: "practice",
  concepts,
  prerequisites: [],
});

/**
 * A small course: a → b → d, a → c → d, d → e, and a redundant a → e. The lessons are in the order a, c, b, d, e,
 * so course order puts c above b where nothing else decides.
 */
const concepts = ["a", "b", "c", "d", "e"].map(concept);
const items: MapItem[] = [
  lesson("a"),
  practice("try-a", ["a"]),
  lesson("c", ["a"]),
  lesson("b", ["a"]),
  practice("try-bd", ["b", "d"]),
  lesson("d", ["b", "c"]),
  lesson("e", ["d", "a"]),
];

function layerOf(layout: MapLayout, slug: string) {
  return layout.nodes.find((node) => node.slug === slug)?.layer;
}

test("a concept's layer is one more than its deepest prerequisite's", () => {
  const graph = conceptGraph(concepts, items);
  assert.deepEqual(
    graph.nodes.map((node) => [node.slug, node.layer]),
    [
      ["a", 0],
      ["c", 1],
      ["b", 1],
      ["d", 2],
      ["e", 3],
    ],
  );
  const layout = layoutMap(graph, metrics);
  assert.deepEqual(layout.layers, [["a"], ["c", "b"], ["d"], ["e"]]);
  assert.equal(layerOf(layout, "e"), 3);
});

test("a redundant arrow is left out, and the concept still lists it as a prerequisite", () => {
  const graph = conceptGraph(concepts, items);
  assert.deepEqual(graph.redundant, [{ from: "a", to: "e" }]);
  assert.ok(!graph.edges.some((edge) => edge.from === "a" && edge.to === "e"));
  assert.deepEqual(graph.nodes.find((node) => node.slug === "e")?.prerequisites, ["a", "d"]);
  assert.deepEqual(graph.nodes.find((node) => node.slug === "a")?.unlocks, ["c", "b", "e"]);
  assert.deepEqual(graph.nodes.find((node) => node.slug === "d")?.practice, ["try-bd"]);
});

test("every arrow points to the right, through every layer it passes", () => {
  const layout = layoutMap(conceptGraph(concepts, items), metrics);
  assert.equal(layout.edges.length, 5);
  for (const edge of layout.edges) {
    const xs = edge.points.map((point) => point.x);
    assert.ok(xs[0]! < xs.at(-1)!, `${edge.from} > ${edge.to}`);
    for (let at = 1; at < xs.length; at++) assert.ok(xs[at]! >= xs[at - 1]!);
    assert.ok(layerOf(layout, edge.from)! < layerOf(layout, edge.to)!);
  }
});

test("an arrow across several layers runs through a lane of its own there, clear of the nodes", () => {
  const graph = conceptGraph(["a", "b", "c", "d", "z", "e"].map(concept), [
    lesson("a"),
    lesson("b", ["a"]),
    lesson("c", ["b"]),
    lesson("d", ["c"]),
    lesson("z"),
    lesson("e", ["d", "z"]),
  ]);
  // z → e goes from layer 0 to layer 4.
  const layout = layoutMap(graph, metrics);
  const long = layout.edges.find((edge) => edge.from === "z" && edge.to === "e")!;
  // Start, then in and out of layers 1, 2 and 3, then the end.
  assert.equal(long.points.length, 8);
  for (const point of long.points.slice(1, -1)) {
    for (const node of layout.nodes) {
      const inside =
        point.x >= node.x &&
        point.x <= node.x + metrics.nodeWidth &&
        point.y > node.y - metrics.laneGap + 0.5 &&
        point.y < node.y + metrics.nodeHeight + metrics.laneGap - 0.5;
      assert.ok(!inside, `lane point ${point.x},${point.y} is inside ${node.slug}`);
    }
  }
  assert.match(edgePath(long.points), /^M\d+(\.\d+)? \d+(\.\d+)? C.* L.* C.* L.* C.* L.* C/);
});

test("the same course gives the same map, whatever the order of keys and of prerequisites", () => {
  const first = layoutMap(conceptGraph(concepts, items), metrics);
  const again = layoutMap(conceptGraph(concepts, items), metrics);
  assert.deepEqual(again, first);
  const reordered = items.map((item) => ({
    prerequisites: [...item.prerequisites].reverse(),
    concepts: item.concepts,
    kind: item.kind,
    slug: item.slug,
  }));
  const shuffledConcepts = [...concepts].reverse().map((entry) => ({ name: entry.name, slug: entry.slug }));
  assert.deepEqual(layoutMap(conceptGraph(shuffledConcepts, reordered), metrics), first);
});

test("course order breaks ties: with nothing else to decide, earlier lessons go higher", () => {
  const siblings = ["root", "p", "q", "r"].map(concept);
  const forward = layoutMap(
    conceptGraph(siblings, [lesson("root"), lesson("p", ["root"]), lesson("q", ["root"]), lesson("r", ["root"])]),
    metrics,
  );
  assert.deepEqual(forward.layers[1], ["p", "q", "r"]);
  const backward = layoutMap(
    conceptGraph(siblings, [lesson("root"), lesson("r", ["root"]), lesson("q", ["root"]), lesson("p", ["root"])]),
    metrics,
  );
  assert.deepEqual(backward.layers[1], ["r", "q", "p"]);
});

test("crossings are reduced: children follow the order of their parents", () => {
  // Course order alone would cross: x2 is listed before x1, but x1 hangs from the upper parent.
  const graph = conceptGraph(["top", "bottom", "x2", "x1"].map(concept), [
    lesson("top"),
    lesson("bottom"),
    lesson("x2", ["bottom"]),
    lesson("x1", ["top"]),
  ]);
  const layout = layoutMap(graph, metrics);
  assert.deepEqual(layout.layers, [
    ["top", "bottom"],
    ["x1", "x2"],
  ]);
});

test("imperfect data: unknown prerequisites, a concept without a lesson, a cycle", () => {
  const graph = conceptGraph(["a", "b", "c", "orphan", "lonely"].map(concept), [
    lesson("a", ["missing", "a"]),
    lesson("b", ["a", "c"]),
    lesson("c", ["b", "orphan"]),
  ]);
  // A prerequisite that is not a concept of the course is left out; a lesson naming its own concept is ignored.
  assert.deepEqual(graph.unknown, [{ from: "missing", to: "a" }]);
  // The cycle b ⇄ c is broken at the link found closing it; both links stay in the lessons' own lists.
  assert.deepEqual(graph.cycles, [{ from: "b", to: "c" }]);
  assert.deepEqual(graph.nodes.find((node) => node.slug === "c")?.prerequisites, ["b", "orphan"]);
  // Concepts without a lesson are nodes in course order after the taught ones, with no prerequisites.
  const orphan = graph.nodes.find((node) => node.slug === "orphan")!;
  assert.equal(orphan.lesson, undefined);
  assert.deepEqual(orphan.prerequisites, []);
  assert.deepEqual(
    graph.nodes.map((node) => node.slug),
    ["a", "b", "c", "orphan", "lonely"],
  );
  const layout = layoutMap(graph, metrics);
  assert.equal(layout.nodes.length, 5);
  for (const edge of layout.edges) assert.ok(layerOf(layout, edge.from)! < layerOf(layout, edge.to)!);
  assert.deepEqual(
    graph.edges.map((edge) => `${edge.from}>${edge.to}`),
    ["a>b", "c>b", "orphan>c"],
  );
});

test("a longer cycle and a long chain finish", () => {
  const ring = ["r1", "r2", "r3", "r4"];
  const graph = conceptGraph(
    ring.map(concept),
    ring.map((slug, at) => lesson(slug, [ring[(at + ring.length - 1) % ring.length]!])),
  );
  assert.equal(graph.cycles.length, 1);
  assert.equal(new Set(graph.nodes.map((node) => node.layer)).size, 4);

  const chain = Array.from({ length: 400 }, (_, at) => `c${at}`);
  const long = conceptGraph(
    chain.map(concept),
    chain.map((slug, at) => lesson(slug, at ? [chain[at - 1]!] : [])),
  );
  assert.equal(long.nodes.at(-1)?.layer, 399);
});

test("a course without concepts gives an empty map", () => {
  const layout = layoutMap(conceptGraph([], [practice("p", [])]), metrics);
  assert.deepEqual(layout, { nodes: [], edges: [], layers: [], width: 0, height: 0 });
});

test("nodes of a layer keep their order and their spacing", () => {
  const layout = layoutMap(conceptGraph(concepts, items), metrics);
  for (const layer of layout.layers) {
    const ys = layer.map((slug) => layout.nodes.find((node) => node.slug === slug)!.y);
    for (let at = 1; at < ys.length; at++) assert.ok(ys[at]! - ys[at - 1]! >= metrics.nodeHeight + metrics.nodeGap);
  }
  assert.ok(layout.nodes.every((node) => node.y >= metrics.padding - 0.01));
  assert.deepEqual(placeInOrder([10, 0, 50], [0, 20, 20]), [-5, 15, 50]);
});

test("a selection lights up the concept, what it depends on and the arrows leading to it; the rest dims", () => {
  // a → b → d → e, a → c → d; selecting d lights a, b, c and d and the arrows into d; e, which d unlocks, dims.
  const graph = conceptGraph(concepts, items);
  assert.deepEqual([...ancestors(graph, "d")].sort(), ["a", "b", "c"]);
  assert.deepEqual([...ancestors(graph, "a")], []);
  const lit = highlight(graph, "d");
  assert.deepEqual([...lit.nodes].sort(), ["a", "b", "c", "d"]);
  assert.deepEqual([...lit.edges].sort(), ["a>b", "a>c", "b>d", "c>d"]);
  assert.deepEqual([...lit.dimmed], ["e"]);
  assert.ok(!lit.edges.has("d>e"));

  // From the middle of a chain, a side branch that does not lead to the selection dims as well.
  const fromB = highlight(graph, "b");
  assert.deepEqual([...fromB.nodes].sort(), ["a", "b"]);
  assert.deepEqual([...fromB.edges], ["a>b"]);
  assert.deepEqual([...fromB.dimmed].sort(), ["c", "d", "e"]);

  const none = highlight(graph, undefined);
  assert.equal(none.nodes.size + none.edges.size + none.dimmed.size, 0);
  assert.equal(highlight(graph, "nothing").dimmed.size, 0);
});

test("arrow keys move within a layer and to the nearest node of the next layer", () => {
  const layout = layoutMap(conceptGraph(concepts, items), metrics);
  assert.equal(neighbour(layout, "c", "down"), "b");
  assert.equal(neighbour(layout, "b", "down"), undefined);
  assert.equal(neighbour(layout, "b", "up"), "c");
  assert.equal(neighbour(layout, "a", "left"), undefined);
  assert.equal(neighbour(layout, "e", "right"), undefined);
  assert.equal(neighbour(layout, "d", "right"), "e");
  // From a, the nearest of c and b; from b, back to a, the only node there.
  const a = layout.nodes.find((node) => node.slug === "a")!;
  const nearest = ["c", "b"].sort(
    (x, y) =>
      Math.abs(layout.nodes.find((node) => node.slug === x)!.y - a.y) -
      Math.abs(layout.nodes.find((node) => node.slug === y)!.y - a.y),
  )[0];
  assert.equal(neighbour(layout, "a", "right"), nearest);
  assert.equal(neighbour(layout, "b", "left"), "a");
  assert.equal(neighbour(layout, "nothing", "down"), "a");
});

/** A course of 45 concepts with prerequisites drawn from a fixed pseudo-random sequence, like the real courses. */
function generatedCourse(seed: number) {
  let state = seed;
  const next = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  const slugs = Array.from({ length: 45 }, (_, at) => `k${at}`);
  const lessons = slugs.map((slug, at) => {
    const count = at === 0 ? 0 : 1 + Math.floor(next() * 3);
    const prerequisites = new Set<string>();
    for (let pick = 0; pick < count; pick++) prerequisites.add(slugs[Math.floor(next() * at)]!);
    return lesson(slug, [...prerequisites]);
  });
  return { concepts: slugs.map(concept), items: lessons };
}

test("on a course the size of the real ones, arrows stay clear of the nodes and the layout settles", () => {
  for (const seed of [1, 7, 42]) {
    const course = generatedCourse(seed);
    const graph = conceptGraph(course.concepts, course.items);
    const layout = layoutMap(graph, metrics);
    assert.deepEqual(layoutMap(conceptGraph(course.concepts, course.items), metrics), layout);
    for (const edge of layout.edges) {
      // Curves run between columns; straight runs pass through a column clear of its nodes.
      for (let at = 1; at + 2 < edge.points.length; at += 2) {
        const enter = edge.points[at]!;
        const leave = edge.points[at + 1]!;
        assert.equal(enter.y, leave.y);
        for (const node of layout.nodes.filter((candidate) => candidate.x === enter.x))
          assert.ok(
            enter.y <= node.y - metrics.laneGap + 0.5 || enter.y >= node.y + metrics.nodeHeight + metrics.laneGap - 0.5,
            `${edge.from} > ${edge.to} runs through ${node.slug}`,
          );
      }
      const from = layout.nodes.find((node) => node.slug === edge.from)!;
      const to = layout.nodes.find((node) => node.slug === edge.to)!;
      assert.equal(edge.points[0]!.x, from.x + metrics.nodeWidth);
      assert.equal(edge.points.at(-1)!.x, to.x);
      const ends = [edge.points[0]!.y - from.y, edge.points.at(-1)!.y - to.y];
      for (const end of ends) assert.ok(end > 0 && end < metrics.nodeHeight);
    }
  }
});

test("a graph that can be drawn without crossings is", () => {
  const graph = conceptGraph(["a", "b", "c", "d", "e", "f", "g"].map(concept), [
    lesson("a"),
    lesson("e", ["a"]),
    lesson("b", ["a"]),
    lesson("f", ["e"]),
    lesson("c", ["b"]),
    lesson("g", ["e"]),
    lesson("d", ["b"]),
  ]);
  assert.equal(crossingCount(layoutMap(graph, metrics)), 0);
});
