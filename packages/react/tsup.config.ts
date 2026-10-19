import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  sourcemap: true,
  // No rollup treeshake pass: it strips the "use client" banner, and the client entry is
  // useless to a server component without it. esbuild already drops unused exports.
  target: "es2021" as const,
  external: ["react", "react-dom"],
};

export default defineConfig([
  {
    ...shared,
    entry: { core: "src/core.ts" },
  },
  {
    ...shared,
    entry: { index: "src/index.ts" },
    // The whole client entry is a client boundary, so a server component that imports the
    // board gets a client reference instead of code that would run during SSR. Server-safe
    // pieces also live in ./core, which a server component imports instead of this entry.
    banner: { js: '"use client";' },
  },
]);
