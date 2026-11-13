// Copies the pinned Sternbild release from vendor/ into public/, after checking it against its checksums.
// The release's CSS reaches its fonts at ../../assets/fonts/, so the copy keeps that shape:
//   public/sternbild/design/1.0.0/sternbild.css
//   public/sternbild/assets/fonts/
// The approved app marks in vendor/sternbild/marks/ are checked against their checksums and copied unchanged to
//   public/sternbild/marks/
// The theme files of packages/ui go to public/sternbild/themes/, for the circuit viewer.
// Then copies the browser assets of the circuit viewer (public/circuit/viewer.html), which runs in a sandboxed
// frame and so cannot use the app's bundle:
//   public/vendor/digitaljs/   DigitalJS's browser build and licences
//   public/vendor/elkjs/       the ELK layout and its worker
//   public/vendor/fonts/       Source Code Pro (latin, 400), the release ships no mono font
// Both target folders are ignored by git.
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

export const STERNBILD_VERSION = "1.0.0";

const web = path.resolve(import.meta.dirname, "..");
const release = path.resolve(web, "../../vendor/sternbild", STERNBILD_VERSION);
const target = path.join(web, "public/sternbild");

/** Checks every file named in a folder's SHA256SUMS and returns their names. */
async function verify(folder) {
  const sums = await readFile(path.join(folder, "SHA256SUMS"), "utf8");
  const names = [];
  for (const line of sums.split("\n").filter(Boolean)) {
    const [expected, name] = line.split(/\s+/);
    const actual = createHash("sha256")
      .update(await readFile(path.join(folder, name)))
      .digest("hex");
    if (actual !== expected)
      throw new Error(
        `${path.relative(path.resolve(web, "../.."), path.join(folder, name))} does not match its checksum.`,
      );
    names.push(name);
  }
  return names;
}

await verify(release);
const design = path.join(target, "design", STERNBILD_VERSION);
const fonts = path.join(target, "assets/fonts");
await mkdir(design, { recursive: true });
await mkdir(fonts, { recursive: true });
for (const name of ["sternbild.css", "tokens.json"]) await cp(path.join(release, name), path.join(design, name));
for (const name of await readdir(path.join(release, "fonts")))
  await cp(path.join(release, "fonts", name), path.join(fonts, name));

// The packages are resolved from this app, wherever npm placed them.
const require = createRequire(path.join(web, "package.json"));
const packageDirectory = (name) => {
  for (let directory = path.dirname(require.resolve(name)); ; directory = path.dirname(directory)) {
    if (path.basename(directory) === name.split("/").pop()) return directory;
    if (directory === path.dirname(directory)) throw new Error(`The package ${name} was not found.`);
  }
};
const vendor = path.join(web, "public/vendor");

const digitaljs = packageDirectory("digitaljs");
await mkdir(path.join(vendor, "digitaljs"), { recursive: true });
for (const name of await readdir(path.join(digitaljs, "dist")))
  if (name.endsWith(".js") || name.endsWith(".LICENSE.txt"))
    await cp(path.join(digitaljs, "dist", name), path.join(vendor, "digitaljs", name));
await cp(path.join(digitaljs, "LICENSE"), path.join(vendor, "digitaljs/LICENSE"));

const elkjs = packageDirectory("elkjs");
await mkdir(path.join(vendor, "elkjs"), { recursive: true });
for (const name of ["lib/elk.bundled.js", "lib/elk-worker.min.js", "LICENSE.md"])
  await cp(path.join(elkjs, name), path.join(vendor, "elkjs", path.basename(name)));

const mono = packageDirectory("@fontsource/source-code-pro");
await mkdir(path.join(vendor, "fonts"), { recursive: true });
await cp(
  path.join(mono, "files/source-code-pro-latin-400-normal.woff2"),
  path.join(vendor, "fonts/source-code-pro-latin-400-normal.woff2"),
);
await cp(path.join(mono, "LICENSE"), path.join(vendor, "fonts/OFL-source-code-pro.txt"));

// The themes, for the circuit viewer's sandboxed frame, which cannot use the app's bundle.
const themes = path.resolve(web, "../../packages/ui/src/themes");
await mkdir(path.join(target, "themes"), { recursive: true });
for (const name of await readdir(themes))
  if (name.endsWith(".css")) await cp(path.join(themes, name), path.join(target, "themes", name));

// The approved marks, unchanged.
const marks = path.resolve(web, "../../vendor/sternbild/marks");
await mkdir(path.join(target, "marks"), { recursive: true });
for (const name of await verify(marks)) await cp(path.join(marks, name), path.join(target, "marks", name));
