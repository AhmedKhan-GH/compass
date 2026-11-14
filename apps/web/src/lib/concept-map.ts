/**
 * The concept map of a course: one node per concept, an arrow from each prerequisite to the concept that needs it,
 * laid out left to right in layers by dependency depth. Plain functions over plain data, so they can be tested
 * without a browser.
 *
 * A concept's prerequisites are those of its concept lesson: the first concept item in course order that names it.
 * Imperfect data never stops the map:
 * - a prerequisite that names no concept of the course is left out (`unknown`);
 * - a concept that no lesson teaches is a node without a lesson and without prerequisites, so it starts a layer 0
 *   flow of its own; arrows still leave it for the concepts that need it;
 * - a link that would close a cycle is left off the map (`cycles`) and stays in the lists of the concepts' own
 *   prerequisites, so every arrow points to the right.
 * Arrows implied by a longer path are left out too (`redundant`, a transitive reduction).
 */

export type MapConcept = { slug: string; name: string };
export type MapItem = {
  slug: string;
  kind: "concept" | "practice";
  concepts: readonly string[];
  prerequisites: readonly string[];
};

export type ConceptNode = {
  slug: string;
  name: string;
  /** The slug of the concept lesson that teaches it, when one does. */
  lesson: string | undefined;
  /** Its place in course order: its lesson's place among the items; concepts without a lesson come last. */
  rank: number;
  /** Its lesson's prerequisites that are concepts of the course, in course order. */
  prerequisites: string[];
  /** The concepts whose lessons name it as a prerequisite, in course order. */
  unlocks: string[];
  /** The practice items that use it, in course order. */
  practice: string[];
  /** One more than the layer of its deepest prerequisite on the map; 0 without one. */
  layer: number;
};

export type Link = { from: string; to: string };

export type ConceptGraph = {
  /** In course order. */
  nodes: ConceptNode[];
  /** The arrows on the map, from prerequisite to concept, in course order of the concept and then of the prerequisite. */
  edges: Link[];
  /** Links left out because the prerequisite names no concept of the course. */
  unknown: Link[];
  /** Links left out because they would close a cycle. */
  cycles: Link[];
  /** Links left out because a longer path implies them. */
  redundant: Link[];
};

/** The graph of a course's concepts. `concepts` and `items` are in course order. */
export function conceptGraph(concepts: readonly MapConcept[], items: readonly MapItem[]): ConceptGraph {
  const known = new Map<string, MapConcept>();
  for (const concept of concepts) if (!known.has(concept.slug)) known.set(concept.slug, concept);

  // The teaching lesson of each concept and the course order.
  const lessonOf = new Map<string, { slug: string; index: number; prerequisites: readonly string[] }>();
  items.forEach((item, index) => {
    if (item.kind !== "concept") return;
    for (const slug of item.concepts)
      if (known.has(slug) && !lessonOf.has(slug))
        lessonOf.set(slug, { slug: item.slug, index, prerequisites: item.prerequisites });
  });
  const listIndex = new Map([...known.keys()].map((slug, index) => [slug, index]));
  const rankOf = (slug: string) => lessonOf.get(slug)?.index ?? items.length + (listIndex.get(slug) ?? 0);
  const order = [...known.keys()].sort((a, b) => rankOf(a) - rankOf(b) || compareText(a, b));
  const byRank = (a: string, b: string) => rankOf(a) - rankOf(b) || compareText(a, b);

  const unknown: Link[] = [];
  const declared = new Map<string, string[]>();
  for (const slug of order) {
    const names = new Set<string>();
    for (const prerequisite of lessonOf.get(slug)?.prerequisites ?? []) {
      if (prerequisite === slug) continue;
      if (known.has(prerequisite)) names.add(prerequisite);
      else unknown.push({ from: prerequisite, to: slug });
    }
    declared.set(slug, [...names].sort(byRank));
  }

  // Links that would close a cycle, found by a depth-first walk back through the prerequisites in course order.
  const cycles: Link[] = [];
  const acyclic = new Map(order.map((slug) => [slug, [] as string[]]));
  const state = new Map<string, "open" | "done">();
  for (const root of order) {
    if (state.has(root)) continue;
    // An explicit stack, so a long chain cannot overflow the call stack.
    const stack: { slug: string; next: number }[] = [{ slug: root, next: 0 }];
    state.set(root, "open");
    while (stack.length) {
      const frame = stack[stack.length - 1]!;
      const prerequisites = declared.get(frame.slug) ?? [];
      if (frame.next >= prerequisites.length) {
        state.set(frame.slug, "done");
        stack.pop();
        continue;
      }
      const prerequisite = prerequisites[frame.next++]!;
      const seen = state.get(prerequisite);
      if (seen === "open") {
        cycles.push({ from: prerequisite, to: frame.slug });
        continue;
      }
      acyclic.get(frame.slug)!.push(prerequisite);
      if (!seen) {
        state.set(prerequisite, "open");
        stack.push({ slug: prerequisite, next: 0 });
      }
    }
  }

  // Everything each concept depends on, in an order where prerequisites come first.
  const topological = topologicalOrder(order, acyclic);
  const below = new Map<string, Set<string>>();
  for (const slug of topological) {
    const all = new Set<string>();
    for (const prerequisite of acyclic.get(slug)!) {
      all.add(prerequisite);
      for (const deeper of below.get(prerequisite)!) all.add(deeper);
    }
    below.set(slug, all);
  }

  // A direct link is redundant when another direct prerequisite already depends on it.
  const redundant: Link[] = [];
  const kept = new Map<string, string[]>();
  for (const slug of order) {
    const direct = acyclic.get(slug)!;
    const keep: string[] = [];
    for (const prerequisite of direct) {
      const implied = direct.some((other) => other !== prerequisite && below.get(other)!.has(prerequisite));
      if (implied) redundant.push({ from: prerequisite, to: slug });
      else keep.push(prerequisite);
    }
    kept.set(slug, keep.sort(byRank));
  }

  const layer = new Map<string, number>();
  for (const slug of topological)
    layer.set(slug, Math.max(-1, ...kept.get(slug)!.map((prerequisite) => layer.get(prerequisite)!)) + 1);

  const unlocks = new Map(order.map((slug) => [slug, [] as string[]]));
  for (const slug of order) for (const prerequisite of declared.get(slug)!) unlocks.get(prerequisite)!.push(slug);
  const practice = new Map(order.map((slug) => [slug, [] as string[]]));
  for (const item of items) {
    if (item.kind !== "practice") continue;
    for (const slug of new Set(item.concepts)) practice.get(slug)?.push(item.slug);
  }

  const nodes: ConceptNode[] = order.map((slug) => ({
    slug,
    name: known.get(slug)!.name,
    lesson: lessonOf.get(slug)?.slug,
    rank: rankOf(slug),
    prerequisites: declared.get(slug)!,
    unlocks: unlocks.get(slug)!,
    practice: practice.get(slug)!,
    layer: layer.get(slug)!,
  }));
  const edges = order.flatMap((slug) => kept.get(slug)!.map((prerequisite) => ({ from: prerequisite, to: slug })));
  return { nodes, edges, unknown, cycles, redundant };
}

/** Kahn's order over an acyclic graph, with course order among the concepts that are ready. */
function topologicalOrder(order: readonly string[], prerequisites: Map<string, string[]>): string[] {
  const waiting = new Map(order.map((slug) => [slug, prerequisites.get(slug)!.length]));
  const dependents = new Map(order.map((slug) => [slug, [] as string[]]));
  for (const slug of order)
    for (const prerequisite of prerequisites.get(slug)!) dependents.get(prerequisite)!.push(slug);
  const position = new Map(order.map((slug, index) => [slug, index]));
  const ready = order.filter((slug) => waiting.get(slug) === 0);
  const result: string[] = [];
  while (ready.length) {
    ready.sort((a, b) => position.get(a)! - position.get(b)!);
    const slug = ready.shift()!;
    result.push(slug);
    for (const dependent of dependents.get(slug)!) {
      const left = waiting.get(dependent)! - 1;
      waiting.set(dependent, left);
      if (left === 0) ready.push(dependent);
    }
  }
  return result;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/* Layout */

export type MapMetrics = {
  nodeWidth: number;
  nodeHeight: number;
  /** The horizontal space between layers, where the arrows bend. */
  layerGap: number;
  /** The vertical space between two nodes of a layer. */
  nodeGap: number;
  /** The vertical space between an arrow passing through a layer and its neighbours there. */
  laneGap: number;
  padding: number;
};

export type Point = { x: number; y: number };
export type PlacedNode = { slug: string; layer: number; order: number; x: number; y: number };
/**
 * An arrow as points: its start on the right side of the prerequisite, then for each layer it passes through the
 * points where it enters and leaves that layer, then its end on the left side of the concept.
 */
export type PlacedEdge = Link & { points: Point[] };
export type MapLayout = {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  /** The slugs of each layer, top to bottom. */
  layers: string[][];
  width: number;
  height: number;
};

type Entry = { id: string; node?: ConceptNode; tie: [number, number, number] };

const SWEEPS = 12;
const TRANSPOSE_PASSES = 8;
const PLACEMENT_ROUNDS = 4;

/**
 * Lays the graph out in layers from left to right. Within a layer, nodes and the arrows passing through it are
 * ordered to reduce crossings (barycentres over a number of down and up sweeps, keeping the best order seen, with
 * course order breaking ties), then placed as close to their neighbours as the spacing allows.
 */
export function layoutMap(graph: ConceptGraph, metrics: MapMetrics): MapLayout {
  const nodeBySlug = new Map(graph.nodes.map((node) => [node.slug, node]));
  const layerCount = graph.nodes.reduce((most, node) => Math.max(most, node.layer + 1), 0);
  const layers: Entry[][] = Array.from({ length: layerCount }, () => []);
  const upper = new Map<string, string[]>();
  const lower = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    lower.get(a)!.push(b);
    upper.get(b)!.push(a);
  };
  const add = (layer: number, entry: Entry) => {
    layers[layer]!.push(entry);
    upper.set(entry.id, []);
    lower.set(entry.id, []);
  };
  for (const node of graph.nodes) add(node.layer, { id: node.slug, node, tie: [node.rank, 0, 0] });
  // An arrow longer than one layer passes through the layers between as a lane of its own.
  const lanes = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const from = nodeBySlug.get(edge.from)!;
    const to = nodeBySlug.get(edge.to)!;
    let previous = from.slug;
    const chain: string[] = [];
    for (let layer = from.layer + 1; layer < to.layer; layer++) {
      const id = `${edge.from}>${edge.to}@${layer}`;
      add(layer, { id, tie: [from.rank, 1, to.rank] });
      link(previous, id);
      chain.push(id);
      previous = id;
    }
    link(previous, to.slug);
    lanes.set(`${edge.from}>${edge.to}`, chain);
  }

  // Order: the first layer in course order, each next one by its barycentres, then sweeps.
  const position = new Map<string, number>();
  const index = (layer: Entry[]) => layer.forEach((entry, at) => position.set(entry.id, at));
  const sortBy = (layer: Entry[], neighbours: Map<string, string[]>) => {
    const key = new Map(layer.map((entry) => [entry.id, barycentre(entry.id, neighbours, position)]));
    layer.sort(
      (a, b) =>
        key.get(a.id)! - key.get(b.id)! || position.get(a.id)! - position.get(b.id)! || compareTie(a.tie, b.tie),
    );
    index(layer);
  };
  for (const layer of layers) {
    layer.sort((a, b) => compareTie(a.tie, b.tie));
    index(layer);
  }
  for (let at = 1; at < layers.length; at++) sortBy(layers[at]!, upper);
  // Swaps neighbours in a layer while that removes crossings with the layers on either side.
  const transpose = () => {
    for (let pass = 0; pass < TRANSPOSE_PASSES; pass++) {
      let improved = false;
      for (const layer of layers)
        for (let at = 0; at + 1 < layer.length; at++) {
          const a = layer[at]!;
          const b = layer[at + 1]!;
          if (pairCrossings(b.id, a.id, upper, lower, position) < pairCrossings(a.id, b.id, upper, lower, position)) {
            layer[at] = b;
            layer[at + 1] = a;
            position.set(b.id, at);
            position.set(a.id, at + 1);
            improved = true;
          }
        }
      if (!improved) break;
    }
  };
  transpose();
  let best = layers.map((layer) => [...layer]);
  let fewest = crossings(layers, lower, position);
  for (let sweep = 0; sweep < SWEEPS && fewest > 0; sweep++) {
    if (sweep % 2 === 0) for (let at = 1; at < layers.length; at++) sortBy(layers[at]!, upper);
    else for (let at = layers.length - 2; at >= 0; at--) sortBy(layers[at]!, lower);
    transpose();
    const count = crossings(layers, lower, position);
    if (count < fewest) {
      fewest = count;
      best = layers.map((layer) => [...layer]);
    }
  }
  best.forEach(index);

  // Vertical places: the centre of each entry, as close to its neighbours' as the spacing allows.
  const height = (entry: Entry) => (entry.node ? metrics.nodeHeight : 0);
  const gap = (a: Entry, b: Entry) => (a.node && b.node ? metrics.nodeGap : metrics.laneGap);
  const centre = new Map<string, number>();
  for (const layer of best) {
    let y = 0;
    layer.forEach((entry, at) => {
      if (at > 0) y += height(layer[at - 1]!) / 2 + gap(layer[at - 1]!, entry) + height(entry) / 2;
      centre.set(entry.id, y);
    });
  }
  const place = (layer: Entry[], neighbours: (id: string) => string[]) => {
    const wanted = layer.map((entry) => {
      const around = neighbours(entry.id);
      return around.length
        ? around.reduce((sum, id) => sum + centre.get(id)!, 0) / around.length
        : centre.get(entry.id)!;
    });
    const separations = layer.map((entry, at) =>
      at === 0 ? 0 : height(layer[at - 1]!) / 2 + gap(layer[at - 1]!, entry) + height(entry) / 2,
    );
    placeInOrder(wanted, separations).forEach((y, at) => centre.set(layer[at]!.id, y));
  };
  for (let round = 0; round < PLACEMENT_ROUNDS; round++) {
    for (let at = 1; at < best.length; at++) place(best[at]!, (id) => upper.get(id)!);
    for (let at = best.length - 2; at >= 0; at--) place(best[at]!, (id) => lower.get(id)!);
  }
  for (const layer of best) place(layer, (id) => [...upper.get(id)!, ...lower.get(id)!]);

  let top = Infinity;
  let bottom = -Infinity;
  for (const layer of best)
    for (const entry of layer) {
      top = Math.min(top, centre.get(entry.id)! - height(entry) / 2);
      bottom = Math.max(bottom, centre.get(entry.id)! + height(entry) / 2);
    }
  if (!Number.isFinite(top)) top = bottom = 0;
  const shift = metrics.padding - top;
  const columnX = (layer: number) => metrics.padding + layer * (metrics.nodeWidth + metrics.layerGap);
  const y = (id: string) => round(centre.get(id)! + shift);

  const nodes: PlacedNode[] = best.flatMap((layer, at) =>
    layer
      .filter((entry) => entry.node)
      .map((entry, order) => ({
        slug: entry.id,
        layer: at,
        order,
        x: columnX(at),
        y: round(y(entry.id) - metrics.nodeHeight / 2),
      })),
  );

  // Arrows leave and reach a node at ports spread down its side, in the order of where they come from or go to.
  const placed = new Map(nodes.map((node) => [node.slug, node]));
  const firstStep = (edge: Link) => lanes.get(`${edge.from}>${edge.to}`)![0] ?? edge.to;
  const lastStep = (edge: Link) => lanes.get(`${edge.from}>${edge.to}`)!.at(-1) ?? edge.from;
  const ports = (slug: string, side: "out" | "in") => {
    const own = graph.edges.filter((edge) => (side === "out" ? edge.from : edge.to) === slug);
    const toward = (edge: Link) => centre.get(side === "out" ? firstStep(edge) : lastStep(edge))!;
    own.sort((a, b) => toward(a) - toward(b) || compareText(`${a.from}>${a.to}`, `${b.from}>${b.to}`));
    const node = placed.get(slug)!;
    return new Map(
      own.map((edge, at) => [
        `${edge.from}>${edge.to}`,
        round(node.y + (metrics.nodeHeight * (at + 1)) / (own.length + 1)),
      ]),
    );
  };
  const outPorts = new Map(graph.nodes.map((node) => [node.slug, ports(node.slug, "out")]));
  const inPorts = new Map(graph.nodes.map((node) => [node.slug, ports(node.slug, "in")]));
  const edges: PlacedEdge[] = graph.edges.map((edge) => {
    const key = `${edge.from}>${edge.to}`;
    const from = placed.get(edge.from)!;
    const to = placed.get(edge.to)!;
    const points: Point[] = [{ x: from.x + metrics.nodeWidth, y: outPorts.get(edge.from)!.get(key)! }];
    for (const id of lanes.get(key)!) {
      const layer = Number(id.slice(id.lastIndexOf("@") + 1));
      points.push({ x: columnX(layer), y: y(id) }, { x: columnX(layer) + metrics.nodeWidth, y: y(id) });
    }
    points.push({ x: to.x, y: inPorts.get(edge.to)!.get(key)! });
    return { ...edge, points };
  });

  return {
    nodes,
    edges,
    layers: best.map((layer) => layer.filter((entry) => entry.node).map((entry) => entry.id)),
    width: layerCount ? columnX(layerCount - 1) + metrics.nodeWidth + metrics.padding : 0,
    height: layerCount ? round(bottom - top + metrics.padding * 2) : 0,
  };
}

/** The number of places where two arrows cross between layers, from the drawn points. */
export function crossingCount(layout: Pick<MapLayout, "edges">): number {
  // Each arrow crosses each gap it spans once: from one point to the next where the x changes across a gap.
  const byGap = new Map<number, [number, number][]>();
  for (const edge of layout.edges)
    edge.points.forEach((point, at) => {
      if (at % 2 === 1) return;
      const next = edge.points[at + 1];
      if (!next) return;
      const spans = byGap.get(point.x) ?? [];
      spans.push([point.y, next.y]);
      byGap.set(point.x, spans);
    });
  let count = 0;
  for (const spans of byGap.values())
    for (let a = 0; a < spans.length; a++)
      for (let b = a + 1; b < spans.length; b++) {
        const [a1, a2] = spans[a]!;
        const [b1, b2] = spans[b]!;
        if ((a1 - b1) * (a2 - b2) < 0) count++;
      }
  return count;
}

function compareTie(a: readonly number[], b: readonly number[]): number {
  for (let at = 0; at < a.length; at++) if (a[at] !== b[at]) return a[at]! - b[at]!;
  return 0;
}

function barycentre(id: string, neighbours: Map<string, string[]>, position: Map<string, number>): number {
  const around = neighbours.get(id)!;
  if (!around.length) return position.get(id)!;
  return around.reduce((sum, other) => sum + position.get(other)!, 0) / around.length;
}

/** The crossings among the arrows of two entries of a layer when `first` is placed above `second`. */
function pairCrossings(
  first: string,
  second: string,
  upper: Map<string, string[]>,
  lower: Map<string, string[]>,
  position: Map<string, number>,
): number {
  let count = 0;
  for (const neighbours of [upper, lower])
    for (const a of neighbours.get(first)!)
      for (const b of neighbours.get(second)!) if (position.get(a)! > position.get(b)!) count++;
  return count;
}

/** The number of arrow crossings between each pair of neighbouring layers. */
function crossings(layers: Entry[][], lower: Map<string, string[]>, position: Map<string, number>): number {
  let count = 0;
  for (const layer of layers) {
    const pairs: [number, number][] = [];
    for (const entry of layer)
      for (const next of lower.get(entry.id)!) pairs.push([position.get(entry.id)!, position.get(next)!]);
    for (let a = 0; a < pairs.length; a++)
      for (let b = a + 1; b < pairs.length; b++) {
        const [a1, a2] = pairs[a]!;
        const [b1, b2] = pairs[b]!;
        if ((a1 - b1) * (a2 - b2) < 0) count++;
      }
  }
  return count;
}

/**
 * Places values in their order, each at least its separation below the one before, as close to the wanted values
 * as possible in the least-squares sense (pool adjacent violators over the offsets).
 */
export function placeInOrder(wanted: readonly number[], separations: readonly number[]): number[] {
  const offsets: number[] = [];
  let total = 0;
  wanted.forEach((_, at) => {
    total += at === 0 ? 0 : (separations[at] ?? 0);
    offsets.push(total);
  });
  const blocks: { sum: number; count: number }[] = [];
  wanted.forEach((value, at) => {
    blocks.push({ sum: value - offsets[at]!, count: 1 });
    while (blocks.length > 1) {
      const last = blocks[blocks.length - 1]!;
      const before = blocks[blocks.length - 2]!;
      if (before.sum / before.count <= last.sum / last.count) break;
      before.sum += last.sum;
      before.count += last.count;
      blocks.pop();
    }
  });
  const result: number[] = [];
  for (const block of blocks) for (let at = 0; at < block.count; at++) result.push(block.sum / block.count);
  return result.map((value, at) => value + offsets[at]!);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The SVG path of an arrow: curves between layers, straight runs through the layers it passes. */
export function edgePath(points: readonly Point[]): string {
  const [start, ...rest] = points;
  if (!start) return "";
  let path = `M${start.x} ${start.y}`;
  let previous = start;
  rest.forEach((point, at) => {
    if (at % 2 === 0) {
      const bend = (point.x - previous.x) / 2;
      path += ` C${previous.x + bend} ${previous.y} ${point.x - bend} ${point.y} ${point.x} ${point.y}`;
    } else path += ` L${point.x} ${point.y}`;
    previous = point;
  });
  return path;
}

/* Selection */

/** Everything a concept depends on, all the way back, along the arrows of the map. */
export function ancestors(graph: Pick<ConceptGraph, "edges">, slug: string): Set<string> {
  const found = new Set<string>();
  const queue = [slug];
  while (queue.length) {
    const next = queue.shift()!;
    for (const edge of graph.edges)
      if (edge.to === next && edge.from !== slug && !found.has(edge.from)) {
        found.add(edge.from);
        queue.push(edge.from);
      }
  }
  return found;
}

export type Highlight = {
  /** The selected concept and everything it depends on. */
  nodes: Set<string>;
  /** The arrows among them, as "from>to": the paths that lead to the selected concept. */
  edges: Set<string>;
  /** Everything else, what the concept unlocks included. */
  dimmed: Set<string>;
};

/**
 * What a selection lights up and what it dims: the selected concept, everything it depends on and the arrows that
 * lead to it are lit; the rest, what it unlocks included, dims. With nothing selected, nothing is lit or dimmed.
 */
export function highlight(graph: Pick<ConceptGraph, "nodes" | "edges">, selected: string | undefined): Highlight {
  if (selected === undefined || !graph.nodes.some((node) => node.slug === selected))
    return { nodes: new Set(), edges: new Set(), dimmed: new Set() };
  const nodes = ancestors(graph, selected);
  nodes.add(selected);
  const edges = new Set(
    graph.edges.filter((edge) => nodes.has(edge.from) && nodes.has(edge.to)).map((edge) => `${edge.from}>${edge.to}`),
  );
  const dimmed = new Set(graph.nodes.map((node) => node.slug).filter((slug) => !nodes.has(slug)));
  return { nodes, edges, dimmed };
}

export type Direction = "left" | "right" | "up" | "down";

/**
 * The node an arrow key moves to: up and down within the layer; left and right to the nearest layer that way, at
 * the node whose middle is nearest in height (the upper one on a tie). Undefined at an edge of the map.
 */
export function neighbour(
  layout: Pick<MapLayout, "nodes" | "layers">,
  slug: string,
  direction: Direction,
): string | undefined {
  const node = layout.nodes.find((candidate) => candidate.slug === slug);
  if (!node) return layout.layers[0]?.[0];
  if (direction === "up" || direction === "down") {
    const layer = layout.layers[node.layer] ?? [];
    return layer[node.order + (direction === "down" ? 1 : -1)];
  }
  const step = direction === "right" ? 1 : -1;
  for (let at = node.layer + step; at >= 0 && at < layout.layers.length; at += step) {
    const candidates = layout.nodes.filter((candidate) => candidate.layer === at);
    if (!candidates.length) continue;
    // Every node has the same height, so the nearest top is the nearest middle.
    let nearest = candidates[0]!;
    for (const candidate of candidates)
      if (Math.abs(candidate.y - node.y) < Math.abs(nearest.y - node.y)) nearest = candidate;
    return nearest.slug;
  }
  return undefined;
}
