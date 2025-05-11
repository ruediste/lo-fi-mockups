import react from "@vitejs/plugin-react";
import * as path from "path";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    checker({
      typescript: {
        tsconfigPath: "tsconfig.app.json",
      },
    }),
  ],
  resolve: {
    alias: {
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    open: true,
    proxy: {
      "/xwikiApi": {
        target: "http://localhost:8078",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xwikiApi/, ""),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ["import"],
      },
    },
  },
  build: {
    sourcemap: true,
  },
});
