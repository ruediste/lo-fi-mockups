import react from "@vitejs/plugin-react";
import * as path from "path";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";

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
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: "**/*",
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff,woff2,png}"],
      },
      manifest: {
        name: "Lo Fi Mockups",
        short_name: "LoFi",
        description: "Quickly Sketch UIs in Lo Fidelity",
        theme_color: "#ffffff",
        launch_handler: {
          client_mode: "focus-existing",
        },
        icons: [
          {
            src: "icon192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
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
