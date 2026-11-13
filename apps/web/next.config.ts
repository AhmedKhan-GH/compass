import path from "node:path";
import type { NextConfig } from "next";

// The circuit viewer runs in a sandboxed frame with an opaque origin, so the fonts and assets it loads from this
// site are cross-origin requests. Fonts need a CORS header for that; nothing here is private.
const viewerAssets = ["/sternbild/:path*", "/vendor/:path*", "/circuit/:path*"].map((source) => ({
  source,
  headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
}));

const nextConfig: NextConfig = {
  transpilePackages: ["@compass/schema", "@compass/ui", "@compass/runner-client"],
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
  // The repository keeps its own rules for agents (AGENTS.md at the root); Next must not write more.
  agentRules: false,
  devIndicators: false,
  async headers() {
    return viewerAssets;
  },
};

export default nextConfig;
