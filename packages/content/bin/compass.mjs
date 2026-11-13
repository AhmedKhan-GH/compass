#!/usr/bin/env node
// The `compass` command. It loads the TypeScript CLI through tsx.
import { register } from "tsx/esm/api";

register();
const { main } = await import("../src/cli.ts");
process.exitCode = await main(process.argv.slice(2));
