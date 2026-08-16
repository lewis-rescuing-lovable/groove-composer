import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // When deploying to GitHub Pages as a project site, the app is hosted under
  // a subpath (e.g. https://<user>.github.io/groove-composer/). Set base
  // accordingly for builds; leave it "/" for local development.
  base: mode === "production" ? "/groove-composer/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}));
