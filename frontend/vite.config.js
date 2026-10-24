import { defineConfig } from "vite";

export default defineConfig({
  // Relative base ensures assets load properly on any GitHub Pages repo URL
  base: "./",
  server: {
    port: 5173,
  },
});
