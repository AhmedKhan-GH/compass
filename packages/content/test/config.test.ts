/** Configuration, environment overrides and the source layer. */
import assert from "node:assert/strict";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { ConfigError, findRepositoryRoot, loadConfig } from "../src/config.ts";
import { SOURCE_KINDS, packsUnder, resolveSources } from "../src/sources.ts";
import { temporaryDirectory, temporaryRepository } from "./helpers.ts";

test("the configuration is found by walking up from the working directory", async (t) => {
  const { root, pack } = await temporaryRepository(t);
  assert.equal(findRepositoryRoot(path.join(pack, "items/drive-high")), root);
  const config = await loadConfig(path.join(pack, "items"), {});
  assert.equal(config.root, root);
  assert.deepEqual(config.sources, [{ kind: "local", path: "packs" }]);
  assert.equal(config.runnerUrl, "http://127.0.0.1:3999");
  assert.equal(config.runnerPort, 3999);
  assert.equal(config.contentIndexPath, path.join(root, ".compass/content-index.json"));
  assert.equal(config.dataDirectory, path.join(root, ".compass"));
});

test("environment variables override the file", async (t) => {
  const { root } = await temporaryRepository(t);
  const url = await loadConfig(root, {
    COMPASS_RUNNER_URL: "http://127.0.0.1:3111/",
    COMPASS_CONTENT_INDEX: "out/index.json",
    COMPASS_DATA_DIR: "/var/tmp/compass-data",
  });
  assert.equal(url.runnerUrl, "http://127.0.0.1:3111");
  assert.equal(url.runnerPort, 3111);
  assert.equal(url.contentIndexPath, path.join(root, "out/index.json"));
  assert.equal(url.dataDirectory, "/var/tmp/compass-data");
  const port = await loadConfig(root, { COMPASS_RUNNER_PORT: "3111" });
  assert.equal(port.runnerPort, 3111);
  assert.equal(port.runnerUrl, "http://127.0.0.1:3111", "the client follows the service's port");
  const both = await loadConfig(root, { COMPASS_RUNNER_PORT: "4000", COMPASS_RUNNER_URL: "http://127.0.0.1:3111" });
  assert.equal(both.runnerUrl, "http://127.0.0.1:3111");
  assert.equal(both.runnerPort, 4000);
  await assert.rejects(loadConfig(root, { COMPASS_RUNNER_PORT: "80a" }), /COMPASS_RUNNER_PORT must be a port number/);
  await assert.rejects(loadConfig(root, { COMPASS_RUNNER_URL: "localhost" }), /COMPASS_RUNNER_URL must be a URL/);
});

test("a missing or invalid configuration is a ConfigError with a plain message", async (t) => {
  const directory = await temporaryDirectory(t);
  await assert.rejects(loadConfig(directory, {}), (error: unknown) => {
    // The temporary folder has no configuration above it on a normal system.
    return error instanceof ConfigError && /No compass\.config\.toml was found/.test(error.message);
  });
  await writeFile(path.join(directory, "compass.config.toml"), "[[content.source]]\nkind = 'svn'\npath = 'x'\n");
  await assert.rejects(loadConfig(directory, {}), /compass\.config\.toml is not valid: content\.source\[0\]\.kind/);
  await writeFile(path.join(directory, "compass.config.toml"), "[content\n");
  await assert.rejects(loadConfig(directory, {}), /not valid TOML: .*line 1/);
});

test("a local source yields every direct child with a course.toml, in name order", async (t) => {
  const { root } = await temporaryRepository(t);
  await mkdir(path.join(root, "packs/zeta"));
  await writeFile(path.join(root, "packs/zeta/course.toml"), "");
  await mkdir(path.join(root, "packs/not-a-pack"));
  await mkdir(path.join(root, "packs/.hidden"));
  await writeFile(path.join(root, "packs/.hidden/course.toml"), "");
  await symlink(path.join(root, "packs/verilog"), path.join(root, "packs/linked"));
  const context = { root, cwd: root, cacheDirectory: path.join(root, ".compass/sources") };
  const result = await resolveSources([{ kind: "local", path: "packs" }], context);
  assert.deepEqual(
    result.packs.map((pack) => [pack.label, pack.source]),
    [
      ["packs/verilog", "local:packs/verilog"],
      ["packs/zeta", "local:packs/zeta"],
    ],
  );
  assert.deepEqual(
    result.diagnostics.map((d) => d.message),
    ["linked is a symbolic link and is skipped; a pack must be a real folder"],
  );
  assert.equal(typeof SOURCE_KINDS.local, "function");
  const missing = await packsUnder(path.join(root, "nowhere"), context, "local:nowhere");
  assert.deepEqual(
    missing.diagnostics.map((d) => [d.severity, d.message]),
    [["error", "nowhere does not exist"]],
  );
});
