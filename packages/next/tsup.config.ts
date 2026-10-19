import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  sourcemap: true,
  target: "es2021" as const,
  external: ["react", "next", "server-only", "@fewchurs/react", "@fewchurs/react/core"],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", handler: "src/handler.ts", identity: "src/identity.ts" },
  },
  {
    ...shared,
    entry: { actions: "src/actions.ts" },
    // Next only treats these as Server Actions if the directive survives the bundle.
    banner: { js: '"use server";' },
  },
]);
