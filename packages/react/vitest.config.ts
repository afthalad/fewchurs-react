import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@fewchurs/react/core": new URL("./src/core.ts", import.meta.url).pathname,
    },
  },
});
