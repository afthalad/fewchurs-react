import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Point the board at this proxy instead of passing a key in the browser:
    // <FewchursProvider baseUrl="/api/fewchurs">
    proxy: {
      "/api/fewchurs": {
        target: "https://www.fewchurs.shop/api/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fewchurs/, ""),
        headers: { Authorization: `Bearer ${process.env.FEWCHURS_API_KEY ?? ""}` },
      },
    },
  },
});
