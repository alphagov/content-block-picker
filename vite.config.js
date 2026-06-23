import { defineConfig } from "vite";
import { resolve } from "path";

const cbmEndpoint =
  process.env.CBM_ENDPOINT || "http://content-block-manager.dev.gov.uk";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: cbmEndpoint,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/content-block-editor.ts"),
      name: "Content Block Editor",
      fileName: "content-block-editor",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  resolve: {
    alias: {
      govuk: resolve(__dirname, "node_modules/govuk-frontend/dist/govuk"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "jsdom",
    deps: {
      inline: ["vitest-canvas-mock"],
    },
    threads: false,
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
