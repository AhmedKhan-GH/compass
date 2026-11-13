// Copies the pinned Sternbild release from vendor/ into public/, after checking it against its checksums.
// The release's CSS reaches its fonts at ../../assets/fonts/, so the copy keeps that shape:
//   public/sternbild/design/1.0.0/sternbild.css
//   public/sternbild/assets/fonts/
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const STERNBILD_VERSION = "1.0.0";

const web = path.resolve(import.meta.dirname, "..");
const release = path.resolve(web, "../../vendor/sternbild", STERNBILD_VERSION);
const target = path.join(web, "public/sternbild");

async function verify() {
  const sums = await readFile(path.join(release, "SHA256SUMS"), "utf8");
  for (const line of sums.split("\n").filter(Boolean)) {
    const [expected, name] = line.split(/\s+/);
    const actual = createHash("sha256")
      .update(await readFile(path.join(release, name)))
      .digest("hex");
    if (actual !== expected)
      throw new Error(`vendor/sternbild/${STERNBILD_VERSION}/${name} does not match its checksum.`);
  }
}

await verify();
const design = path.join(target, "design", STERNBILD_VERSION);
const fonts = path.join(target, "assets/fonts");
await mkdir(design, { recursive: true });
await mkdir(fonts, { recursive: true });
for (const name of ["sternbild.css", "tokens.json"])
  await cp(path.join(release, name), path.join(design, name));
for (const name of await readdir(path.join(release, "fonts")))
  await cp(path.join(release, "fonts", name), path.join(fonts, name));
