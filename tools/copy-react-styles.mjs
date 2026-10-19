// Copies @fewchurs/react's stylesheet into @fewchurs/next's dist, so a Next app that only
// installed @fewchurs/next can `import "@fewchurs/next/styles.css"`. npm hoists the react
// package and would let the deeper path work anyway; pnpm and Yarn PnP do not.
//
// It reads the workspace source rather than react's dist, so the copy does not depend on
// the two packages building in a particular order.

import { copyFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Resolved from the package that runs this script, not from tools/, so it finds the
// @fewchurs/react that package depends on.
const require = createRequire(resolve("package.json"));
const source = join(dirname(require.resolve("@fewchurs/react/package.json")), "src/styles.css");
const target = resolve("dist/styles.css");

copyFileSync(source, target);
console.log(`[copy-react-styles] ${readFileSync(target, "utf8").length} bytes -> dist/styles.css`);
