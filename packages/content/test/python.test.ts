/** Finding cocotb tests by reading the checks file's text. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { findCocotbTests } from "../src/python.ts";
import { FIXTURE_PACK } from "./helpers.ts";

test("the fixture's tests are found in order with their lines", async () => {
  const source = await readFile(path.join(FIXTURE_PACK, "items/drive-high/checks/test_output.py"), "utf8");
  const scan = findCocotbTests(source);
  assert.deepEqual(
    scan.tests.map((found) => found.name),
    ["output_port_is_one_bit", "output_is_high", "output_stays_high"],
  );
  assert.equal(scan.tests[0]?.line, 15);
  assert.deepEqual(scan.problems, []);
});

test("only an async def directly under @cocotb.test() is a test", () => {
  const source = [
    "import cocotb",
    "",
    "async def helper(dut):",
    "    pass",
    "",
    "@cocotb.test()",
    "# a comment between",
    "",
    "async def first(dut):",
    "    pass",
    "",
    "@cocotb.test(timeout_time=10,",
    '             timeout_unit="us")',
    "async def second(dut):",
    "    pass",
    "",
    "@cocotb.test",
    "async def third(dut):",
    "    pass",
    "",
    "class Helper:",
    "    @cocotb.test()",
    "    async def method(self):",
    "        pass",
  ].join("\n");
  assert.deepEqual(
    findCocotbTests(source).tests.map((found) => found.name),
    ["first", "second", "third"],
  );
});

test("decorator-like text inside strings is not a test", () => {
  const source = ['"""', "@cocotb.test()", "async def in_docstring(dut):", '"""', "", "@cocotb.test()", "async def real(dut):", "    pass"].join(
    "\n",
  );
  assert.deepEqual(
    findCocotbTests(source).tests.map((found) => found.name),
    ["real"],
  );
});

test("a decorator over a plain def or over something else is a problem", () => {
  const scan = findCocotbTests(["@cocotb.test()", "def not_async(dut):", "    pass", "", "@cocotb.test()", "x = 1"].join("\n"));
  assert.deepEqual(scan.tests, []);
  assert.equal(scan.problems.length, 2);
  assert.match(scan.problems[0]?.message ?? "", /not_async on line 2 must be an async def/);
  assert.match(scan.problems[1]?.message ?? "", /line 5 is not directly followed by an async def/);
});
