import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { convert, repoRoot } from "./convert.ts";

const USAGE =
  "usage: convert --from <old repo> --track <track> --out <pack dir> (--all | <slug>...)";

function main(): number {
  const { values, positionals } = parseArgs({
    options: {
      from: { type: "string" },
      track: { type: "string" },
      out: { type: "string" },
      all: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });
  if (!values.from || !values.track || !values.out || (!values.all && positionals.length === 0)) {
    console.error(USAGE);
    return 2;
  }
  const out = resolve(repoRoot(process.cwd()), values.out);
  const result = convert({
    from: values.from,
    track: values.track,
    out,
    slugs: values.all ? "all" : positionals,
  });
  for (const e of result.exercises) console.log(`${e.status.padEnd(9)} ${e.slug}: ${e.message}`);
  const count = (s: string) => result.exercises.filter((e) => e.status === s).length;
  for (const s of result.substitutions) console.log(`substituted ${s.count} x ${s.from} -> ${s.to}`);
  console.log(
    `${count("converted")} converted, ${count("refused")} refused, ${count("failed")} failed; ` +
      `${result.items.length} items and ${result.concepts.length} concepts in ${out}`,
  );
  return count("refused") + count("failed") > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
