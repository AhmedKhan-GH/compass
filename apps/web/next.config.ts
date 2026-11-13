import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@compass/schema", "@compass/ui", "@compass/runner-client"],
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
};

export default nextConfig;
