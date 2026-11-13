/** The pack loader: what it reads, and how it reports files that are missing, too large, linked or outside the pack. */
import assert from "node:assert/strict";
import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { isPackPath, readPackFile } from "../src/files.ts";
import { FIXTURE_PACK, editToml, load, messages, temporaryDirectory, temporaryPack } from "./helpers.ts";

test("the fixture pack loads into a typed pack with no diagnostics", async () => {
  const pack = await load(FIXTURE_PACK);
  assert.deepEqual(pack.diagnostics, []);
  assert.equal(pack.manifest?.id, "fixture/verilog");
  assert.equal(pack.manifest?.status, "published");
  assert.ok(pack.syllabus?.includes("First Light"));
  assert.deepEqual(
    pack.concepts.map((concept) => [concept.slug, concept.hasDirectory, Boolean(concept.introduction), Boolean(concept.about)]),
    [["constants", true, true, true]],
  );
  assert.deepEqual(
    pack.items.map((item) => [item.slug, item.position, item.prerequisites]),
    [
      ["drive-high", 0, []],
      ["light-bank", 1, ["constants"]],
    ],
  );
  const drive = pack.items[0];
  assert.ok(drive?.manifest && drive.checks);
  assert.equal(drive.manifest.task?.length, 2);
  assert.deepEqual([...drive.starter.keys()], ["top_module.v"]);
  assert.equal(drive.checks.name, "test_output.py");
  assert.deepEqual([...drive.reference.keys()], ["exemplar.v"]);
  assert.deepEqual([...drive.wrong.keys()], ["low.v"]);
  assert.deepEqual([...drive.stages.keys()], ["task_1.v", "task_2.v"]);
  assert.ok(drive.notes?.includes("NOTES-ONLY-MARKER"));
  assert.ok(drive.intro?.startsWith("### Start with a model"));
  const bank = pack.items[1];
  assert.deepEqual([...(bank?.starter.keys() ?? [])], ["top_module.v", "lamp.v"]);
  assert.deepEqual([...(bank?.reference.keys() ?? [])], ["example.v", "lamp.v"]);
  assert.equal(
    pack.markdown.map((file) => file.file).join(","),
    [
      "syllabus.md",
      "concepts/constants/introduction.md",
      "concepts/constants/about.md",
      "items/drive-high/intro.md",
      "items/drive-high/instructions.md",
      "items/drive-high/hints.md",
      "items/drive-high/notes.md",
      "items/light-bank/instructions.md",
      "items/light-bank/hints.md",
    ].join(","),
  );
});

test("errors are collected with their location, not thrown one at a time", async (t) => {
  const pack = await temporaryPack(t);
  await rm(path.join(pack, "items/drive-high/starter/top_module.v"));
  await rm(path.join(pack, "items/drive-high/wrong/low.v"));
  await rm(path.join(pack, "items/light-bank/instructions.md"));
  const loaded = await load(pack);
  assert.deepEqual(
    loaded.diagnostics.map((d) => [d.severity, d.rule, d.item, d.file, d.message]),
    [
      ["error", "files", "drive-high", "items/drive-high/item.toml", "design.solution names starter/top_module.v, which does not exist"],
      ["error", "files", "drive-high", "items/drive-high/item.toml", "checks.wrong names wrong/low.v, which does not exist"],
      ["error", "files", "light-bank", "items/light-bank/instructions.md", "items/light-bank/instructions.md is required and does not exist"],
    ],
  );
});

test("TOML syntax errors and schema issues point at the manifest", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/light-bank/item.toml"), 'id = "x"\ntitle = [\n');
  await editToml(path.join(pack, "items/drive-high/item.toml"), (item) => {
    item.id = "not-a-uuid";
    item.extra = true;
    (item.design as Record<string, unknown>).solution = "../escape.v";
  });
  const loaded = await load(pack);
  const errors = loaded.diagnostics.filter((d) => d.rule === "manifest");
  assert.deepEqual(
    errors.map((d) => [d.item, d.file]),
    [
      ["drive-high", "items/drive-high/item.toml"],
      ["drive-high", "items/drive-high/item.toml"],
      ["drive-high", "items/drive-high/item.toml"],
      ["light-bank", "items/light-bank/item.toml"],
    ],
  );
  const text = messages(errors).join("\n");
  assert.match(text, /id: must be a lower-case UUID/);
  assert.match(text, /design\.solution: must be a plain file name in its folder/);
  assert.match(text, /Unrecognized key: "extra"/);
  assert.match(text, /not valid TOML: .*\(line 3, column 1\)/);
});

test("an invalid course.toml stops the pack early with its errors", async (t) => {
  const pack = await temporaryPack(t);
  await editToml(path.join(pack, "course.toml"), (course) => {
    course.id = "Fixture";
    course.version = "1.0";
  });
  const loaded = await load(pack);
  assert.equal(loaded.manifest, undefined);
  assert.deepEqual(messages(loaded.diagnostics), [
    "error: id: must be namespace/name, both lower-case slugs",
    "error: version: must be a version such as 0.1.0",
  ]);
});

test("file sizes are bounded", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/drive-high/starter/top_module.v"), "x".repeat(64 * 1024 + 1));
  await writeFile(path.join(pack, "items/drive-high/instructions.md"), "y".repeat(256 * 1024 + 1));
  const loaded = await load(pack);
  assert.deepEqual(messages(loaded.diagnostics), [
    "error: items/drive-high/instructions.md is 262145 bytes, over the limit of 256 KiB for this file",
    "error: items/drive-high/starter/top_module.v is 65537 bytes, over the limit of 64 KiB for this file",
  ]);
});

test("symlinks are refused wherever they are, including a linked item folder", async (t) => {
  const pack = await temporaryPack(t);
  const outside = await temporaryDirectory(t);
  await writeFile(path.join(outside, "secret.v"), "module secret; endmodule\n");
  const target = path.join(pack, "items/drive-high/wrong/low.v");
  await rm(target);
  await symlink(path.join(outside, "secret.v"), target);
  const bank = path.join(pack, "items/light-bank");
  await rm(bank, { recursive: true });
  await symlink(path.join(pack, "items/drive-high"), bank);
  const loaded = await load(pack);
  const text = messages(loaded.diagnostics, "files");
  assert.ok(text.includes("error: items/light-bank is a symbolic link; packs may not contain links"), text.join("\n"));
  assert.ok(text.includes("error: items/drive-high/wrong/low.v is a symbolic link; packs may not contain links"), text.join("\n"));
  assert.equal(loaded.items[0]?.wrong.size, 0);
  assert.equal(loaded.items[1]?.manifest, undefined);
});

test("no path leaves the pack", async (t) => {
  const pack = await temporaryPack(t);
  for (const relative of ["../outside", "/etc/passwd", "a/../b", "a//b", "a\\b", "", "./a"])
    assert.equal(isPackPath(relative), false, relative);
  assert.equal(isPackPath("items/drive-high/item.toml"), true);
  const result = await readPackFile(pack, "../verilog/course.toml", 1024);
  assert.equal(result.ok, false);
  assert.equal(result.ok ? undefined : result.failure, "invalid-path");
});

test("text is read as UTF-8 with line ends normalised", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/drive-high/hints.md"), "﻿## 1. A\r\nOne\r\n## 2. B\r\nTwo\r\n");
  await writeFile(path.join(pack, "items/light-bank/hints.md"), Buffer.from([0xff, 0xfe, 0x00]));
  const loaded = await load(pack);
  assert.equal(loaded.items[0]?.hints, "## 1. A\nOne\n## 2. B\nTwo\n");
  assert.deepEqual(messages(loaded.diagnostics), ["error: items/light-bank/hints.md is not valid UTF-8 text"]);
});

test("unlisted item folders and unnamed files are warnings", async (t) => {
  const pack = await temporaryPack(t);
  await mkdir(path.join(pack, "items/spare"));
  await writeFile(path.join(pack, "items/drive-high/wrong/forgotten.v"), "module top_module; endmodule\n");
  await writeFile(path.join(pack, "items/drive-high/README.txt"), "notes\n");
  const loaded = await load(pack);
  assert.deepEqual(messages(loaded.diagnostics), [
    "warning: items/spare is not listed in course.toml, so it is not part of the course",
    "warning: items/drive-high/README.txt is not part of the item format and is ignored",
    "warning: items/drive-high/wrong/forgotten.v is not named in item.toml and is not used",
  ]);
});

test("an item listed in course.toml without a folder is an error on course.toml", async (t) => {
  const pack = await temporaryPack(t);
  await editToml(path.join(pack, "course.toml"), (course) => {
    (course.item as unknown[]).push({ slug: "missing-item", prerequisites: [] });
  });
  const loaded = await load(pack);
  assert.deepEqual(
    loaded.diagnostics.map((d) => [d.file, d.message]),
    [["course.toml", "items/missing-item does not exist; course.toml lists the item missing-item"]],
  );
});
