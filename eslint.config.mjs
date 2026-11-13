import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";

const web = ["apps/web/**/*.{ts,tsx,js,jsx,mjs}"];

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/dist/**",
    ".compass/**",
    "**/next-env.d.ts",
    "apps/web/public/**",
    "vendor/**",
    "content/**",
    "services/runner/images/**",
  ]),
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({
    ...config,
    files: web,
    settings: { ...config.settings, next: { rootDir: "apps/web" } },
  })),
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
