import assert from "node:assert/strict";
import test from "node:test";
import { courseApi, itemApi, waitQuery } from "../../src/lib/api.ts";

test("a read sends the wait, the state it last saw, and the position only while queued", () => {
  assert.equal(waitQuery(undefined), "");
  assert.equal(waitQuery(5000), "?wait=5000");
  assert.equal(waitQuery(5000, { state: "queued", position: 2 }), "?wait=5000&state=queued&position=2");
  assert.equal(waitQuery(5000, { state: "queued" }), "?wait=5000&state=queued");
  assert.equal(waitQuery(5000, { state: "running", position: 2 }), "?wait=5000&state=running");
});

test("course and item addresses", () => {
  assert.equal(courseApi("sternbild/verilog"), "/api/courses/sternbild/verilog");
  assert.equal(itemApi("sternbild/verilog", "drive-high"), "/api/courses/sternbild/verilog/items/drive-high");
});
