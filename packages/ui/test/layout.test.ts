import assert from "node:assert/strict";
import test from "node:test";
import { gridTracks, moveRule, normalizeShares, paneSpace, parseStoredShares, resolveSizes } from "../src/layout.ts";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test("shares are normalized, and bad shares count as nothing", () => {
  assert.deepEqual(normalizeShares([1, 3]), [0.25, 0.75]);
  assert.deepEqual(normalizeShares([0, 0]), [0.5, 0.5]);
  assert.deepEqual(normalizeShares([Number.NaN, 2, -1]), [0, 1, 0]);
});

test("the rules between panes are taken out of the space", () => {
  assert.equal(paneSpace(1001, 2), 1000);
  assert.equal(paneSpace(1002, 3), 1000);
  assert.equal(paneSpace(0, 3), 0);
});

test("sizes follow the shares when every pane is above its minimum", () => {
  const sizes = resolveSizes(1001, [0.3, 0.7], [100, 100]);
  close(sizes[0]!, 300);
  close(sizes[1]!, 700);
});

test("a pane below its minimum is raised, and the others give up the difference", () => {
  const sizes = resolveSizes(1002, [0.1, 0.45, 0.45], [300, 100, 100]);
  close(sizes[0]!, 300);
  close(sizes[1]!, 350);
  close(sizes[2]!, 350);
  close(sum(sizes), 1000);
});

test("raising one pane can push another below its minimum, which is then raised too", () => {
  const sizes = resolveSizes(1002, [0.05, 0.15, 0.8], [300, 200, 100]);
  close(sizes[0]!, 300);
  close(sizes[1]!, 200);
  close(sizes[2]!, 500);
});

test("minimums are scaled down together when the window is too small for them", () => {
  const sizes = resolveSizes(301, [0.5, 0.5], [400, 200]);
  close(sizes[0]!, 200);
  close(sizes[1]!, 100);
});

test("moving a rule changes only the two panes beside it, within their minimums", () => {
  const shares = moveRule(1002, [0.25, 0.5, 0.25], [100, 100, 100], 0, 100);
  close(shares[0]!, 0.35);
  close(shares[1]!, 0.4);
  close(shares[2]!, 0.25);
  const clamped = moveRule(1002, [0.25, 0.5, 0.25], [100, 100, 100], 1, 1000);
  close(clamped[2]!, 0.1);
  close(clamped[1]!, 0.65);
  const back = moveRule(1002, [0.25, 0.5, 0.25], [100, 100, 100], 0, -1000);
  close(back[0]!, 0.1);
});

test("the grid tracks carry the minimums and the shares", () => {
  assert.equal(gridTracks([1, 3], [200, 300]), "minmax(200px, 250fr) 1px minmax(300px, 750fr)");
});

test("stored shares are read back only when they fit the split", () => {
  assert.deepEqual(parseStoredShares("[1,3]", 2), [0.25, 0.75]);
  assert.equal(parseStoredShares("[1,3]", 3), undefined);
  assert.equal(parseStoredShares("[1,-3]", 2), undefined);
  assert.equal(parseStoredShares("not json", 2), undefined);
  assert.equal(parseStoredShares(null, 2), undefined);
});
