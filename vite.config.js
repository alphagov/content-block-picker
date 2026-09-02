import { defineConfig } from "vite";
import { resolve } from "path";

const cbmEndpoint =
  process.env.CBM_ENDPOINT || "http://content-block-manager.dev.gov.uk";

export default defineConfig({
  assetsInclude: ["**/*.njk"],
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
    copyPublicDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/content-block-picker.ts"),
      name: "content-block-picker",
      fileName: "content-block-picker",
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].[format].js",
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        loadPaths: ["node_modules"],
      },
    },
    lightningcss: {
      errorRecovery: true,
    },
  },
  resolve: {
    alias: {
      govuk: resolve(
        import.meta.dirname,
        "node_modules/govuk-frontend/dist/govuk",
      ),
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
