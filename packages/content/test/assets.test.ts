/** Icons in the index: asset names, the files beside the index, pruning, categories and the unchanged revision. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { checkAcrossPacks } from "../src/checks.ts";
import { compileContent, compileIndex, writeContent } from "../src/compile.ts";
import { loadPack, type LoadedPack } from "../src/loader.ts";
import { FIXTURE_PACK, editToml, temporaryDirectory, temporaryPack } from "./helpers.ts";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

async function at(directory: string, label = "verilog"): Promise<LoadedPack> {
  return loadPack({ directory, label, source: `local:${label}` });
}

test("each icon is named in the index by the SHA-256 of its bytes", async () => {
  const { index, assets } = compileContent([await at(FIXTURE_PACK)]);
  const course = index.courses[0];
  assert.ok(course);
  const read = (relative: string) => readFile(path.join(FIXTURE_PACK, relative), "utf8");
  assert.equal(course.icon, `${sha(await read("icon.svg"))}.svg`);
  assert.deepEqual(course.category, {
    id: "fixture-design",
    title: "Fixture design",
    icon: `${sha(await read("category-icon.svg"))}.svg`,
  });
  assert.equal(course.items[0]?.icon, `${sha(await read("items/drive-high/icon.svg"))}.svg`);
  assert.equal(course.items[1]?.icon, undefined);
  assert.equal("icon" in (course.items[1] ?? {}), false, "an item without an icon has no icon key");
  assert.deepEqual([...assets.keys()].sort(), [course.icon, course.category?.icon, course.items[0]?.icon].sort());
  for (const [name, content] of assets) assert.equal(name, `${sha(content)}.svg`);
});

test("an icon does not change the item revision", async (t) => {
  const pack = await temporaryPack(t);
  const revision = async () => compileIndex([await at(pack)]).courses[0]?.items[0]?.revision;
  const withIcon = await revision();
  await rm(path.join(pack, "items/drive-high/icon.svg"));
  assert.equal(await revision(), withIcon);
  await writeFile(path.join(pack, "items/drive-high/icon.svg"), (await readFile(path.join(pack, "icon.svg"), "utf8")));
  assert.equal(await revision(), withIcon);
});

test("the build writes the icons beside the index; identical icons share one file", async (t) => {
  const pack = await temporaryPack(t);
  await cp(path.join(pack, "icon.svg"), path.join(pack, "category-icon.svg"));
  const output = await temporaryDirectory(t);
  const target = path.join(output, "content-index.json");
  const compiled = compileContent([await at(pack)]);
  assert.equal(compiled.assets.size, 2);
  const result = await writeContent(target, compiled);
  assert.deepEqual(result, { written: 2, removed: 0 });
  const course = compiled.index.courses[0];
  assert.equal(course?.icon, course?.category?.icon);
  const files = (await readdir(path.join(output, "content-assets"))).sort();
  assert.deepEqual(files, [...compiled.assets.keys()].sort());
  for (const name of files) assert.equal(name, `${sha(await readFile(path.join(output, "content-assets", name), "utf8"))}.svg`);
  assert.deepEqual(await writeContent(target, compiled), { written: 0, removed: 0 }, "unchanged icons are not rewritten");
});

test("the build removes stale assets, and nothing else", async (t) => {
  const output = await temporaryDirectory(t);
  const target = path.join(output, "content-index.json");
  const assets = path.join(output, "content-assets");
  const stale = `${"a".repeat(64)}.svg`;
  await mkdir(path.join(assets, `${"b".repeat(64)}.svg`), { recursive: true });
  await writeFile(path.join(assets, stale), "<svg/>");
  await writeFile(path.join(assets, "README.txt"), "kept");
  await writeFile(path.join(assets, `${"C".repeat(64)}.svg`), "kept: not a lower-case hash");
  const compiled = compileContent([await at(FIXTURE_PACK)]);
  assert.deepEqual(await writeContent(target, compiled), { written: 3, removed: 1 });
  const left = (await readdir(assets)).sort();
  assert.deepEqual(left, [`${"C".repeat(64)}.svg`, "README.txt", ...[...compiled.assets.keys(), `${"b".repeat(64)}.svg`].sort()].sort());

  const pack = await temporaryPack(t);
  await rm(path.join(pack, "items/drive-high/icon.svg"));
  const smaller = compileContent([await at(pack)]);
  assert.deepEqual(await writeContent(target, smaller), { written: 0, removed: 1 });
  assert.deepEqual(
    (await readdir(assets)).filter((name) => /^[0-9a-f]{64}\.svg$/.test(name)).sort(),
    [...smaller.assets.keys(), `${"b".repeat(64)}.svg`].sort(),
    "the folder named like an asset is never removed",
  );
});

test("packs that share a category agree on its title, and share the first source's icon", async (t) => {
  const first = await temporaryPack(t);
  const second = path.join(path.dirname(first), "second");
  await cp(first, second, { recursive: true });
  await editToml(path.join(second, "course.toml"), (course) => {
    course.id = "fixture/second";
  });
  await writeFile(path.join(second, "category-icon.svg"), await readFile(path.join(second, "icon.svg"), "utf8"));
  await rm(path.join(first, "category-icon.svg"));
  const plain = await at(first, "packs/first");
  const carrying = await at(second, "packs/second");
  assert.deepEqual(checkAcrossPacks([plain, carrying]), []);
  const { index } = compileContent([plain, carrying]);
  const icons = index.courses.map((course) => course.category?.icon);
  assert.ok(icons[0]);
  assert.equal(icons[0], icons[1], "the pack without a category icon shows the other's");

  const third = path.join(path.dirname(first), "third");
  await cp(second, third, { recursive: true });
  await editToml(path.join(third, "course.toml"), (course) => {
    course.id = "fixture/third";
  });
  await writeFile(path.join(third, "category-icon.svg"), await readFile(path.join(FIXTURE_PACK, "category-icon.svg"), "utf8"));
  const later = await at(third, "packs/third");
  const chosen = compileContent([carrying, later]).index.courses.map((course) => course.category?.icon);
  assert.deepEqual(chosen, [icons[0], icons[0]], "the first source's icon wins");

  await editToml(path.join(third, "course.toml"), (course) => {
    course.category = { id: "fixture-design", title: "Another title" };
  });
  const disagreeing = await at(third, "packs/third");
  assert.deepEqual(
    checkAcrossPacks([carrying, disagreeing]).map((d) => [d.pack, d.message]),
    [
      ["packs/second", 'the category fixture-design has the title "Fixture design" here but "Another title" in packs/third'],
      ["packs/third", 'the category fixture-design has the title "Another title" here but "Fixture design" in packs/second'],
    ],
  );
});
