import assert from "node:assert/strict";
import { test } from "node:test";
import { SOURCE_LIMITS } from "@compass/schema";
import { mergeWithStarter, sourceHash, validateSubmittedFiles } from "../../src/server/files.ts";
import { HttpError } from "../../src/server/http.ts";
import { TASKS_ITEM } from "./fixture.ts";

const solution = "module top_module(output out); assign out = 1'b1; endmodule\n";

function rejects(files: Record<string, string>, pattern: RegExp) {
  assert.throws(
    () => validateSubmittedFiles(TASKS_ITEM, files),
    (error: unknown) => error instanceof HttpError && error.status === 400 && pattern.test(error.message),
  );
}

test("accepts the solution file and editable support files, sorted by name", () => {
  const files = validateSubmittedFiles(TASKS_ITEM, { "top_module.v": solution, "helper.v": "module helper; endmodule" });
  assert.deepEqual(Object.keys(files), ["helper.v", "top_module.v"]);
  assert.deepEqual(validateSubmittedFiles(TASKS_ITEM, { "top_module.v": solution }), { "top_module.v": solution });
});

test("rejects other names, a missing solution, empty files and oversized files", () => {
  rejects({ "top_module.v": solution, "defs.vh": "`define X" }, /defs\.vh is not a file/);
  rejects({ "top_module.v": solution, "other.v": "module other; endmodule" }, /other\.v is not a file/);
  rejects({ "helper.v": "module helper; endmodule" }, /Submit top_module\.v/);
  rejects({ "top_module.v": "  \n\t" }, /top_module\.v is empty/);
  rejects({ "top_module.v": solution, "helper.v": "" }, /helper\.v is empty/);
  // Fewer characters than the limit, more bytes: the limit is in bytes.
  const wide = "é".repeat(SOURCE_LIMITS.fileBytes / 2 + 1);
  assert.ok(wide.length < SOURCE_LIMITS.fileBytes);
  rejects({ "top_module.v": wide }, /larger than 64 KiB/);
  assert.doesNotThrow(() => validateSubmittedFiles(TASKS_ITEM, { "top_module.v": "x".repeat(SOURCE_LIMITS.fileBytes) }));
});

test("the submitted files replace the starter files of the same name", () => {
  const merged = mergeWithStarter(TASKS_ITEM, { "top_module.v": solution });
  assert.deepEqual(Object.keys(merged), ["defs.vh", "helper.v", "top_module.v"]);
  assert.equal(merged["top_module.v"], solution);
  assert.equal(merged["defs.vh"], TASKS_ITEM.starter["defs.vh"]);
});

test("the source hash ignores key order and changes with any byte", () => {
  const a = sourceHash({ "a.v": "1", "b.v": "2" });
  assert.equal(a, sourceHash({ "b.v": "2", "a.v": "1" }));
  assert.notEqual(a, sourceHash({ "a.v": "1", "b.v": "3" }));
  assert.notEqual(a, sourceHash({ "a.v": "12", "b.v": "" }));
  assert.match(a, /^[0-9a-f]{64}$/);
});
