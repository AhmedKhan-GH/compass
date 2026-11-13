/** The `compass` command: output and exit codes. */
import assert from "node:assert/strict";
import { access, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { ContentIndex } from "@compass/schema";
import { main, type CliOptions } from "../src/cli.ts";
import { FIXTURES, capture, fakeRunner, temporaryDirectory, temporaryRepository } from "./helpers.ts";

async function run(argv: string[], options: CliOptions & { tty?: boolean } = {}) {
  const stdout = capture(options.tty ?? false);
  const stderr = capture(false);
  const code = await main(argv, { env: {}, ...options, stdout, stderr });
  return { code, out: stdout.text(), err: stderr.text() };
}

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

test("help, usage errors and unknown commands", async () => {
  const help = await run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.out, /^Usage: compass <command>/);
  assert.match(help.out, /content check \[--static\] \[--source <dir>\] \[<course-id>\.\.\.\]/);
  assert.equal((await run(["content", "--help"])).code, 0);
  const none = await run([]);
  assert.equal(none.code, 2);
  assert.match(none.err, /^Usage/);
  const unknown = await run(["deploy"]);
  assert.equal(unknown.code, 2);
  assert.equal(unknown.err, "compass: unknown command deploy. Run compass --help for the commands.\n");
  assert.equal((await run(["content", "publish"])).code, 2);
  const option = await run(["content", "check", "--fast"], { cwd: FIXTURES });
  assert.equal(option.code, 2);
  assert.match(option.err, /Unknown option '--fast'/);
});

test("check --static --source checks packs under any folder, without a configuration", async (t) => {
  const cwd = await temporaryDirectory(t);
  const result = await run(["content", "check", "--static", "--source", FIXTURES], { cwd });
  assert.equal(result.code, 0, result.out + result.err);
  const lines = result.out.trimEnd().split("\n");
  assert.match(lines[0] ?? "", /^fixture\/plan {2}\S*fixtures\/plan {2}ok {2}\(in development, 3 planned\)$/);
  assert.match(lines[1] ?? "", /^fixture\/verilog {2}\S*fixtures\/verilog {2}ok$/);
  assert.deepEqual(lines.slice(2), [
    "  drive-high  ok",
    "  light-bank  ok",
    "Checked 2 packs and 2 items (static checks only): no errors.",
  ]);
  assert.equal(result.out.includes("\u001b["), false, "no colour codes when stdout is not a terminal");
  const coloured = await run(["content", "check", "--static", "--source", FIXTURES], { cwd, tty: true });
  assert.ok(coloured.out.includes("\u001b[32mok\u001b[0m"));
  const single = await run(["content", "check", "--static", "--source", path.join(FIXTURES, "verilog")], { cwd });
  assert.equal(single.code, 0, "a single pack folder is accepted too");
});

test("check exits 1 on errors and prints each with its location", async (t) => {
  const { root, pack } = await temporaryRepository(t);
  await rm(path.join(pack, "items/drive-high/wrong/low.v"));
  await writeFile(path.join(pack, "items/light-bank/hints.md"), "See [nothing](nothing.md).\n");
  const result = await run(["content", "check", "--static"], { cwd: root });
  assert.equal(result.code, 1);
  assert.deepEqual(result.out.trimEnd().split("\n"), [
    "fixture/verilog  packs/verilog  2 errors",
    "  drive-high  1 error",
    "  light-bank  1 error",
    "",
    "packs/verilog/items/drive-high/item.toml: error: checks.wrong names wrong/low.v, which does not exist",
    "packs/verilog/items/light-bank/hints.md: error: the link nothing.md (line 1) points to items/light-bank/nothing.md, which the pack does not have",
    "Checked 1 pack and 2 items (static checks only): 2 errors.",
  ]);
});

test("check runs the dynamic checks through the runner client and skips items with static errors", async (t) => {
  const { root, pack } = await temporaryRepository(t);
  const client = fakeRunner();
  let askedFor: string | undefined;
  const createRunner = (url: string) => {
    askedFor = url;
    return client;
  };
  const passing = await run(["content", "check"], { cwd: root, createRunner, env: { COMPASS_RUNNER_URL: "http://127.0.0.1:3111" } });
  assert.equal(passing.code, 0, passing.out + passing.err);
  assert.equal(askedFor, "http://127.0.0.1:3111");
  assert.match(passing.out, /^ {2}drive-high {2}ok {2}\(4 runs\)$/m);
  assert.match(passing.out, /^ {2}light-bank {2}ok {2}\(2 runs\)$/m);
  assert.match(passing.err, /Running 6 checks on the runner service at http:\/\/127\.0\.0\.1:3999\./);

  await writeFile(path.join(pack, "items/light-bank/wrong/one_lamp.v"), await readFile(path.join(pack, "items/light-bank/reference/example.v"), "utf8"));
  await rm(path.join(pack, "items/drive-high/stages/task_2.v"));
  const failing = await run(["content", "check", "fixture/verilog"], { cwd: root, createRunner: () => fakeRunner() });
  assert.equal(failing.code, 1);
  assert.match(failing.out, /^ {2}drive-high {2}1 error {2}\(not run\)$/m);
  assert.match(
    failing.out,
    /^packs\/verilog\/items\/light-bank\/wrong\/one_lamp\.v: error: the wrong solution one_lamp\.v passes every test; a wrong solution must fail a test$/m,
  );
  const unknown = await run(["content", "check", "other/course"], { cwd: root, createRunner: () => fakeRunner() });
  assert.equal(unknown.code, 1);
  assert.equal(unknown.err, "compass: no pack has the course id other/course.\n");
});

test("check says plainly when the runner cannot be reached, and exits 1", async (t) => {
  const { root } = await temporaryRepository(t);
  const result = await run(["content", "check"], { cwd: root, createRunner: () => fakeRunner(undefined, { unreachable: true }) });
  assert.equal(result.code, 1);
  assert.match(
    result.err,
    /compass: The runner service at http:\/\/127\.0\.0\.1:3999 could not be reached\. Start it with npm run runner, or run compass content check --static\./,
  );
  assert.match(result.out, /drive-high {2}ok {2}\(not run\)/);
  assert.match(result.out, /^Checked 1 pack and 2 items: no errors; the runs did not take place\.$/m);
});

test("build writes a valid index under the repository root, or where it is told", async (t) => {
  const { root, pack } = await temporaryRepository(t);
  const result = await run(["content", "build"], { cwd: path.join(pack, "items") });
  assert.equal(result.code, 0, result.out + result.err);
  const target = path.join(root, ".compass/content-index.json");
  assert.match(result.out, /^Wrote .*\.compass\/content-index\.json: 1 course, 2 items, 3 icons\.$/m);
  const first = await readFile(target, "utf8");
  const assets = await readdir(path.join(root, ".compass/content-assets"));
  assert.equal(assets.length, 3);
  for (const name of assets) assert.ok(first.includes(`"${name}"`), `the index names ${name}`);
  assert.equal(ContentIndex.safeParse(JSON.parse(first)).success, true);
  assert.equal(JSON.parse(first).courses[0].source, "local:packs/verilog");
  assert.equal((await run(["content", "build"], { cwd: root })).code, 0);
  assert.equal(await readFile(target, "utf8"), first, "a second build gives the same bytes");

  assert.equal((await run(["content", "build", "--out", "out/index.json"], { cwd: root })).code, 0);
  assert.equal(await readFile(path.join(root, "out/index.json"), "utf8"), first);
  assert.equal((await run(["content", "build"], { cwd: root, env: { COMPASS_CONTENT_INDEX: "env/index.json" } })).code, 0);
  assert.equal(await readFile(path.join(root, "env/index.json"), "utf8"), first);
});

test("build refuses to write when there are errors", async (t) => {
  const { root, pack } = await temporaryRepository(t);
  await rm(path.join(pack, "items/drive-high/checks/test_output.py"));
  const result = await run(["content", "build"], { cwd: root });
  assert.equal(result.code, 1);
  assert.match(result.out, /items\/drive-high\/item\.toml: error: checks\.file names checks\/test_output\.py, which does not exist/);
  assert.match(result.out, /^The index was not written: 1 error\.$/m);
  assert.equal(await exists(path.join(root, ".compass/content-index.json")), false);
});

test("list shows the packs and their items", async (t) => {
  const { root } = await temporaryRepository(t);
  const result = await run(["content", "list"], { cwd: root });
  assert.equal(result.code, 0);
  assert.deepEqual(result.out.trimEnd().split("\n"), [
    "fixture/verilog  Fixture course  (0.1.0, published, 2 items, packs/verilog)",
    "  1  drive-high  concept   First Light",
    "  2  light-bank  practice  Light Bank",
  ]);
});

test("a missing configuration is a plain error", async (t) => {
  const cwd = await temporaryDirectory(t);
  const result = await run(["content", "build"], { cwd });
  assert.equal(result.code, 1);
  assert.match(result.err, /^compass: No compass\.config\.toml was found in .* or any folder above it\.\n$/);
});
