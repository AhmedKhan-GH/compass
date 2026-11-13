import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CIRCUIT_PROFILE } from "../src/circuit-launcher.ts";
import { readBounded, readOptional, sandboxArguments } from "../src/sandbox.ts";
import { TEST_PROFILE } from "../src/test-launcher.ts";

test("the container runs without network, privileges or a writable root, with bounded resources", () => {
  const args = sandboxArguments({
    name: "compass-run-x",
    imageId: "sha256:abc",
    input: "/scratch/input",
    output: "/scratch/output",
    profile: TEST_PROFILE,
    command: ["top_module", "/solution", "/output"],
  });
  const flag = (name: string) => {
    const index = args.indexOf(name);
    assert.ok(index >= 0, `Missing ${name}.`);
    return args[index + 1];
  };
  assert.equal(args[0], "run");
  for (const name of ["--rm", "--init", "--read-only"]) assert.ok(args.includes(name), `Missing ${name}.`);
  assert.equal(flag("--pull"), "never");
  assert.equal(flag("--network"), "none");
  assert.equal(flag("--cpus"), "1");
  assert.equal(flag("--memory"), "256m");
  assert.equal(flag("--memory-swap"), "256m", "Memory plus swap equal to memory means no swap.");
  assert.equal(flag("--pids-limit"), "64");
  assert.equal(flag("--cap-drop"), "ALL");
  assert.equal(flag("--security-opt"), "no-new-privileges");
  assert.equal(flag("--user"), "65534:65534");
  assert.equal(flag("--ulimit"), "fsize=1048576:1048576");
  assert.equal(flag("--tmpfs"), "/tmp:rw,nosuid,size=64m");
  const mounts = args.flatMap((arg, i) => (arg === "--mount" ? [args[i + 1]] : []));
  assert.deepEqual(mounts, [
    "type=bind,source=/scratch/input,target=/solution,readonly",
    "type=bind,source=/scratch/output,target=/output",
  ]);
  assert.deepEqual(args.slice(-4), ["sha256:abc", "top_module", "/solution", "/output"]);
  assert.equal(CIRCUIT_PROFILE.memory, "512m");
});

test("bounded reads return small regular files and refuse symlinks, special files and large files", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "compass-read-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "results.json");
  await writeFile(file, '{"ok":true}');
  assert.equal(await readBounded(file, 64), '{"ok":true}');
  await assert.rejects(readBounded(file, 4), /too large/);

  const secret = path.join(directory, "secret.txt");
  await writeFile(secret, "host data");
  const link = path.join(directory, "link.json");
  await symlink(secret, link);
  await assert.rejects(readBounded(link, 1024), /unsafe/);
  assert.equal(await readOptional(link, 1024), undefined);

  await assert.rejects(readBounded(directory, 1024), /unsafe/);
  await assert.rejects(readBounded(path.join(directory, "missing.json"), 1024));

  const fifo = path.join(directory, "fifo.json");
  execFileSync("mkfifo", [fifo]);
  await assert.rejects(readBounded(fifo, 1024), /unsafe/, "A FIFO is refused without blocking.");
});
