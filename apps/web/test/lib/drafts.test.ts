import assert from "node:assert/strict";
import test from "node:test";
import {
  draftKey,
  editableNames,
  loadDraft,
  parseDraft,
  saveDraft,
  shownNames,
  starterFiles,
  submittedFiles,
  type DraftStorage,
} from "../../src/lib/drafts.ts";

const item = {
  design: {
    top: "top_module",
    solution: "top.v",
    support: ["helper.v", "table.hex"],
    editable: ["helper.v"],
    schematic: true,
  },
  starter: { "top.v": "module top; endmodule\n", "helper.v": "module helper; endmodule\n", "table.hex": "00\n" },
};

function memory(): DraftStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

test("a draft key names the course, the item id and the revision", () => {
  assert.equal(draftKey("sternbild/verilog", "9a2f", "abc"), "compass:draft:sternbild/verilog:9a2f:abc");
  assert.notEqual(draftKey("c/d", "i", "r1"), draftKey("c/d", "i", "r2"));
});

test("the editable files are the solution and the editable support files", () => {
  assert.deepEqual(editableNames(item), ["top.v", "helper.v"]);
  assert.deepEqual(shownNames(item), ["top.v", "helper.v", "table.hex"]);
  assert.deepEqual(Object.keys(starterFiles(item)), ["top.v", "helper.v"]);
});

test("a missing or broken draft falls back to the starter", () => {
  const storage = memory();
  assert.deepEqual(loadDraft(storage, "k", item), starterFiles(item));
  storage.setItem("k", "{not json");
  assert.deepEqual(loadDraft(storage, "k", item), starterFiles(item));
  assert.deepEqual(loadDraft(undefined, "k", item), starterFiles(item));
});

test("a stored draft keeps known files, drops unknown ones and fills missing ones from the starter", () => {
  const files = parseDraft(JSON.stringify({ files: { "top.v": "edited", "evil.v": "x", "helper.v": 3 } }), item);
  assert.deepEqual(files, { "top.v": "edited", "helper.v": "module helper; endmodule\n" });
});

test("saving stores an edited draft and removes one that equals the starter", () => {
  const storage = memory();
  const edited = { ...starterFiles(item), "top.v": "module top(output out); endmodule\n" };
  assert.equal(saveDraft(storage, "k", edited, item, "2026-11-13T10:00:00Z"), true);
  assert.deepEqual(loadDraft(storage, "k", item), edited);
  saveDraft(storage, "k", starterFiles(item), item, "2026-11-13T10:01:00Z");
  assert.equal(storage.map.has("k"), false);
});

test("saving reports a storage that refuses", () => {
  const full: DraftStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
    removeItem: () => {},
  };
  assert.equal(saveDraft(full, "k", { ...starterFiles(item), "top.v": "x" }, item, "t"), false);
});

test("a run carries only the editable files", () => {
  assert.deepEqual(submittedFiles({ "top.v": "a", "helper.v": "b", "table.hex": "c" }, item), {
    "top.v": "a",
    "helper.v": "b",
  });
});
