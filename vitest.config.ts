// vitest.config.ts
//
// Ring 5 (test + CI floor): pure-logic unit tests for the money-path lib/
// chokepoints. node environment only (no DOM needed, these are server-only
// lib functions), path alias mirrors tsconfig's "@/*" -> "./*" so test files
// can import "@/lib/..." exactly like app code.

// NOTE: this deliberately does NOT import `defineConfig` from "vitest/config".
// vitest is resolved from the npx cache (not physically installed in this
// repo's shared node_modules, see CLAUDE.md), and this config file's own
// module resolution walks up from the project root, which cannot see the
// npx-cache copy of "vitest/config". A plain object has the exact shape
// vitest's config loader expects, so no import is needed.
import path from "node:path";

const config = {
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
};

export default config;
