import test from "node:test";
import assert from "node:assert/strict";
import { toCircuitResult } from "../src/circuit-launcher.ts";
import { JobFailure } from "../src/failure.ts";
import { checkSelection, legacyConfig, legacyRequest, parseResults, toRunReport } from "../src/legacy.ts";
import { TASK_SELECTION_MESSAGE, checkJobRequest } from "../src/requests.ts";
import { circuitRequest, testRequest } from "./helpers.ts";

const passed = { name: "Output follows input", status: "pass", test_code: "assert out == expected" };
const invalidReport = (error: unknown) =>
  error instanceof JobFailure && error.kind === "invalid-result" && /invalid test report/.test(error.message);

test("legacy reports remain readable and version three preserves numeric task identities", () => {
  const legacy = { version: 2, status: "pass", tests: [passed] };
  assert.deepEqual(parseResults(legacy), legacy);
  const grouped = {
    version: 3,
    status: "fail",
    tests: [
      { ...passed, task_id: 1 },
      { ...passed, name: "Next output", task_id: 2, status: "fail", message: "Expected 1, observed 0." },
    ],
  };
  assert.deepEqual(parseResults(grouped), grouped);
  const selected = { version: 3, status: "pass", tests: [{ ...passed, task_id: 3 }] };
  assert.deepEqual(parseResults(selected), selected, "A selected task need not include earlier task IDs.");
  for (const version of [2, 3]) {
    const error = { version, status: "error", message: "Could not compile the source." };
    assert.deepEqual(parseResults(error), error);
  }
});

test("empty, inconsistent and malformed reports never count as passing", () => {
  for (const value of [
    null,
    [],
    "pass",
    { version: 2, status: "pass", tests: [] },
    { version: 2, status: "pass", tests: [{ ...passed, status: "fail", message: "Wrong" }] },
    { version: 2, status: "pass", tests: [{ name: "x", status: "pass" }] },
    { version: 2, status: "fail", tests: [{ ...passed, status: "fail" }] },
    { version: 2, status: "error" },
    { version: 3, status: "pass", tests: [] },
    { version: 3, status: "fail", tests: [{ ...passed, task_id: 1 }] },
    { version: 3, status: "pass", tests: [{ ...passed, task_id: 1, status: "error", message: "No signal." }] },
    { version: 3, status: "error", message: " " },
    { version: 4, status: "pass", tests: [passed] },
    { version: 2, status: "pass", tests: [{ ...passed, task_id: 1 }] },
  ])
    assert.throws(() => parseResults(value), invalidReport, JSON.stringify(value));
});

test("version three requires a positive integer task ID on every reported test", () => {
  for (const task_id of [undefined, null, 0, -1, 1.5, true, "1", Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => parseResults({ version: 3, status: "pass", tests: [{ ...passed, task_id }] }),
      invalidReport,
      String(task_id),
    );
  }
  assert.throws(
    () => parseResults({ version: 3, status: "pass", tests: [{ ...passed, task_id: 1 }, passed] }),
    invalidReport,
  );
});

test("a report must match the version and the tasks the request selected", () => {
  const tasks = [
    { id: 1, tests: ["first"] },
    { id: 2, tests: ["second", "third"] },
  ];
  const t = (task_id: number) => ({ ...passed, task_id });
  const unexpected = /unexpected task selection/;
  // A request without tasks or a selection expects version 2.
  assert.doesNotThrow(() => checkSelection(parseResults({ version: 2, status: "pass", tests: [passed] }), {}));
  assert.throws(() => checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1)] }), {}), unexpected);
  assert.throws(
    () => checkSelection(parseResults({ version: 2, status: "pass", tests: [passed] }), { tasks }),
    unexpected,
  );
  // The full suite of a task map has every mapped test, each under its task.
  assert.doesNotThrow(() =>
    checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1), t(2), t(2)] }), { tasks }),
  );
  assert.throws(
    () => checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1), t(2)] }), { tasks }),
    unexpected,
  );
  assert.throws(
    () => checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1), t(2), t(2), t(3)] }), { tasks }),
    unexpected,
  );
  // A selected task reports exactly its own tests.
  assert.doesNotThrow(() =>
    checkSelection(parseResults({ version: 3, status: "pass", tests: [t(2), t(2)] }), { tasks, taskId: 2 }),
  );
  assert.throws(
    () => checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1)] }), { tasks, taskId: 2 }),
    unexpected,
  );
  // The implicit task 1 of a concept item without a task map.
  assert.doesNotThrow(() =>
    checkSelection(parseResults({ version: 3, status: "pass", tests: [t(1), t(1)] }), { taskId: 1 }),
  );
  // An error report only has to have the right version.
  assert.doesNotThrow(() =>
    checkSelection(parseResults({ version: 3, status: "error", message: "No tests found." }), { tasks, taskId: 1 }),
  );
});

test("a report maps to a RunReport without its version", () => {
  assert.deepEqual(toRunReport({ version: 2, status: "pass", tests: [passed] }, {}), {
    status: "pass",
    tests: [passed],
  });
  assert.deepEqual(
    toRunReport({ version: 3, status: "error", message: "Compilation failed." }, { tasks: [{ id: 1, tests: ["x"] }] }),
    { status: "error", message: "Compilation failed." },
  );
});

test("the adapter writes the legacy config and request the image reads", () => {
  const request = testRequest({
    files: { "top_module.v": "module top_module; endmodule", "helper.v": "module helper; endmodule", "data.hex": "00" },
    tasks: [{ id: 1, tests: ["output_is_high"] }],
    taskId: 1,
  });
  assert.deepEqual(legacyConfig(request), {
    files: { solution: ["top_module.v"], test: ["test_output.py"], editor: ["helper.v", "data.hex"] },
    custom: {
      compass: { runner: "icarus-cocotb-v1", top_module: "top_module", tasks: [{ id: 1, tests: ["output_is_high"] }] },
    },
  });
  assert.deepEqual(legacyRequest(request), { kind: "concept", task_id: 1 });
  const plain = testRequest({ itemKind: "practice" });
  assert.deepEqual(legacyConfig(plain), {
    files: { solution: ["top_module.v"], test: ["test_output.py"] },
    custom: { compass: { runner: "icarus-cocotb-v1", top_module: "top_module" } },
  });
  assert.deepEqual(legacyRequest(plain), { kind: "practice" });
});

test("unknown and malformed task selections are rejected before Docker is needed", () => {
  for (const taskId of [0, -1, 1.5, Infinity, 2])
    assert.equal(checkJobRequest(testRequest({ taskId })), TASK_SELECTION_MESSAGE, String(taskId));
  const tasks = [
    { id: 1, tests: ["first"] },
    { id: 2, tests: ["second"] },
  ];
  assert.equal(checkJobRequest(testRequest({ tasks, taskId: 3 })), TASK_SELECTION_MESSAGE);
  assert.equal(checkJobRequest(testRequest({ tasks, taskId: 2 })), undefined);
  assert.equal(checkJobRequest(testRequest({ taskId: 1 })), undefined, "A concept item has an implicit task 1.");
  assert.equal(
    checkJobRequest(testRequest({ itemKind: "practice", taskId: 1 })),
    TASK_SELECTION_MESSAGE,
    "Implicit task 1 applies only to concept items.",
  );
});

test("a request must name a present, non-empty solution and a checks file distinct from the sources", () => {
  assert.match(checkJobRequest(testRequest({ solution: "other.v" })) ?? "", /not among the files/);
  assert.match(checkJobRequest(testRequest({ files: { "top_module.v": "  \n" } })) ?? "", /empty/);
  assert.match(
    checkJobRequest(testRequest({ checks: { name: "top_module.v", content: "import cocotb" } })) ?? "",
    /case is ignored/,
  );
  assert.match(
    checkJobRequest(testRequest({ files: { "top_module.v": "module m; endmodule", "Top_Module.v": "x" } })) ?? "",
    /case is ignored/,
  );
  // The schema drops a __proto__ key, so the solution must not be read from the prototype.
  assert.match(checkJobRequest(circuitRequest({ solution: "__proto__", files: {} })) ?? "", /not among the files/);
  assert.match(checkJobRequest(circuitRequest({ files: { "top_module.v": "" } })) ?? "", /empty/);
  assert.equal(checkJobRequest(circuitRequest()), undefined);
});

test("a circuit result maps to a CircuitJobResult, a design error to a design failure", () => {
  const circuit = { devices: { d1: { type: "Output", net: "out" } }, connectors: [], subcircuits: {} };
  const ports = [{ name: "out", direction: "output", bits: 1 }];
  assert.deepEqual(toCircuitResult({ version: 1, circuit, ports, warnings: "" }, "sha256:x", 7), {
    kind: "circuit",
    circuit,
    ports,
    warnings: "",
    imageId: "sha256:x",
    durationMs: 7,
  });
  assert.throws(
    () => toCircuitResult({ error: "ERROR: syntax error", diagnostics: "yosys log" }, "sha256:x", 7),
    (error) =>
      error instanceof JobFailure &&
      error.kind === "design" &&
      error.message === "ERROR: syntax error" &&
      error.diagnostics === "yosys log",
  );
  for (const value of [
    null,
    { version: 2, circuit, ports, warnings: "" },
    { version: 1, circuit: { devices: {} }, ports, warnings: "" },
    { version: 1, circuit, ports: [{ name: "out", direction: "inout", bits: 1 }], warnings: "" },
    { version: 1, circuit, ports },
  ])
    assert.throws(
      () => toCircuitResult(value, "sha256:x", 7),
      (error) => error instanceof JobFailure && error.kind === "invalid-result",
      JSON.stringify(value),
    );
});


test("new test kinds keep their native adapter and validate source ordering and task selection", () => {
  for (const [runner, legacy] of [
    ["iverilog-native@1", "icarus-native-v1"],
    ["ghdl-cocotb@1", "ghdl-cocotb-v1"],
    ["ghdl-native@1", "ghdl-native-v1"],
  ] as const) {
    const request = { ...testRequest(), runner, sourceOrder: ["top_module.v"] };
    assert.equal(legacyConfig(request).custom.compass.runner, legacy);
    assert.deepEqual(legacyConfig(request).custom.compass.source_order, ["top_module.v"]);
    assert.equal(checkJobRequest(request), undefined);
    assert.match(checkJobRequest({ ...request, sourceOrder: ["missing.v"] }) ?? "", /sourceOrder/);
    assert.equal(checkJobRequest({ ...request, taskId: 999 }), TASK_SELECTION_MESSAGE);
    assert.match(checkJobRequest({ ...request, checks: { name: "top_module.v", content: "test" } }) ?? "", /Two files/);
  }
});
