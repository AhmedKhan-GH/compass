import assert from "node:assert/strict";
import { test } from "node:test";
import type { CircuitJobRequest, JobResult } from "@compass/schema";
import { readCircuit, startCircuit } from "../../src/server/circuits.ts";
import { findIndexedItem } from "../../src/server/content.ts";
import { HttpError } from "../../src/server/http.ts";
import { BARE_COURSE_ID, CHECKS_MARKER, COURSE_ID, IMAGE_ID, PLAIN_ITEM, TASKS_ITEM, freshEnvironment } from "./fixture.ts";

const solution = "module top_module(output out); assign out = 1'b1; endmodule\n";
const built: JobResult = {
  kind: "circuit",
  circuit: { devices: { d1: { type: "Constant" } }, connectors: [], subcircuits: {} },
  ports: [{ name: "out", direction: "output", bits: 1 }],
  warnings: "",
  imageId: IMAGE_ID,
  durationMs: 12,
};

function found(courseId = COURSE_ID, slug = TASKS_ITEM.slug) {
  const item = findIndexedItem(courseId, slug);
  assert.ok(item);
  return item;
}

test("a circuit is built by the course's circuit runner and read like a run", async () => {
  const { runner } = freshEnvironment();
  const started = await startCircuit(found(), { files: { "top_module.v": solution } });
  assert.equal(started.state, "queued");
  assert.equal(started.courseId, COURSE_ID);
  assert.equal(started.itemId, TASKS_ITEM.id);
  const request = runner.requests[0] as CircuitJobRequest;
  assert.deepEqual(request, {
    runner: "yosys-digitaljs@1",
    top: "top_module",
    solution: "top_module.v",
    files: { "defs.vh": TASKS_ITEM.starter["defs.vh"], "helper.v": TASKS_ITEM.starter["helper.v"], "top_module.v": solution },
  });
  assert.ok(!JSON.stringify(request).includes(CHECKS_MARKER));
  runner.run();
  assert.equal((await readCircuit(started.id))?.state, "running");
  runner.succeed(built);
  const done = await readCircuit(started.id, { waitMs: 2000 });
  assert.equal(done?.state, "succeeded");
  assert.deepEqual(done?.circuit, built.kind === "circuit" ? built.circuit : undefined);
  assert.deepEqual(done?.ports, [{ name: "out", direction: "output", bits: 1 }]);
  assert.equal(done?.warnings, "");
  assert.equal(runner.waits.at(-1), 2000);
});

test("a circuit read with seen compares the state only, from the store first and then at the runner", async () => {
  const { runner } = freshEnvironment();
  const started = await startCircuit(found(), { files: { "top_module.v": solution } });
  assert.equal(started.state, "queued");
  const calls = runner.waits.length;
  const ahead = await readCircuit(started.id, { waitMs: 2000, seen: { state: "running" } });
  assert.equal(ahead?.state, "queued");
  assert.equal(runner.waits.length, calls, "The store already differs from what was seen.");

  runner.run();
  const running = await readCircuit(started.id, { waitMs: 2000, seen: { state: "queued", position: 4 } });
  assert.equal(running?.state, "running");
  assert.deepEqual(runner.seens.at(-1), { state: "queued" }, "A circuit has no position to compare.");
  assert.equal(runner.waits.at(-1), 2000);

  runner.succeed(built);
  assert.equal((await readCircuit(started.id, { waitMs: 2000, seen: { state: "running" } }))?.state, "succeeded");
  assert.deepEqual(runner.seens.at(-1), { state: "running" });
});

test("the same files for the same revision reuse the stored circuit; other files build a new one", async () => {
  const { runner } = freshEnvironment();
  const first = await startCircuit(found(), { files: { "top_module.v": solution } });
  // While it is still being built, the same request joins it.
  assert.equal((await startCircuit(found(), { files: { "top_module.v": solution } })).id, first.id);
  runner.succeed(built);
  await readCircuit(first.id);
  // Spelling out an unchanged starter file is the same set of files.
  const same = await startCircuit(found(), {
    files: { "top_module.v": solution, "helper.v": TASKS_ITEM.starter["helper.v"] ?? "" },
  });
  assert.equal(same.id, first.id);
  assert.equal(same.state, "succeeded");
  assert.equal(runner.requests.length, 1);
  const changed = await startCircuit(found(), { files: { "top_module.v": solution + "// changed\n" } });
  assert.notEqual(changed.id, first.id);
  assert.equal(runner.requests.length, 2);
});

test("a design error is kept for the same files; an unavailable runner is tried again", async () => {
  const { runner } = freshEnvironment();
  const rejected = await startCircuit(found(), { files: { "top_module.v": solution } });
  runner.fail({ kind: "design", message: "Yosys rejected the design.", diagnostics: "ERROR: syntax error" });
  const read = await readCircuit(rejected.id);
  assert.equal(read?.state, "failed");
  assert.equal(read?.error?.diagnostics, "ERROR: syntax error");
  assert.equal((await startCircuit(found(), { files: { "top_module.v": solution } })).id, rejected.id);
  assert.equal(runner.requests.length, 1);

  runner.unreachable = true;
  const other = await startCircuit(found(), { files: { "top_module.v": "module top_module; endmodule\n" } });
  assert.equal(other.state, "failed");
  assert.equal(other.error?.kind, "unavailable");
  runner.unreachable = false;
  const retried = await startCircuit(found(), { files: { "top_module.v": "module top_module; endmodule\n" } });
  assert.notEqual(retried.id, other.id);
  assert.equal(retried.state, "queued");
  assert.equal(await readCircuit(other.id), undefined);
});

test("a circuit the runner forgot fails with unavailable", async () => {
  const { runner } = freshEnvironment();
  const started = await startCircuit(found(), { files: { "top_module.v": solution } });
  runner.forget();
  const read = await readCircuit(started.id);
  assert.equal(read?.state, "failed");
  assert.equal(read?.error?.kind, "unavailable");
});

test("a course without a circuit runner and an item without a schematic refuse circuits", async () => {
  const { runner } = freshEnvironment();
  await assert.rejects(
    startCircuit(found(BARE_COURSE_ID, PLAIN_ITEM.slug), { files: { "top_module.v": solution } }),
    (error: unknown) => error instanceof HttpError && error.status === 404 && error.code === "no-circuit",
  );
  await assert.rejects(
    startCircuit(found(COURSE_ID, PLAIN_ITEM.slug), { files: { "top_module.v": solution } }),
    (error: unknown) => error instanceof HttpError && error.status === 409 && error.code === "no-schematic",
  );
  await assert.rejects(
    startCircuit(found(), { files: { "defs.vh": "x", "top_module.v": solution } }),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
  assert.equal(runner.requests.length, 0);
});
