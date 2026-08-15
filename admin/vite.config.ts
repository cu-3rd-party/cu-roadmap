import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

import manifest from "./manifest";

const isDevHost = process.env.npm_lifecycle_event === "dev:host";
const DEV_ENABLE_HTTPS = isDevHost;
const DEV_ENABLE_PWA = false;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Backend the dev server proxies /api/v1 to. Same-origin requests from the
  // browser hit localhost; Vite forwards them server-side, sidestepping CORS.
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || "https://roadmap.cu3rd.ru";

  return {
    // Served behind nginx at /admin/; the router uses the matching basename.
    base: "/admin/",
    plugins: [
      react(),
      tsconfigPaths(),
      lingui(),
      tailwindcss(),
      DEV_ENABLE_HTTPS && basicSsl(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico"],
        manifest: manifest,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: DEV_ENABLE_PWA,
        },
      }),
    ].filter(Boolean),
    server: {
      port: 5174,
      proxy: {
        "/api/v1": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: "esnext",
    },
    // Port intentionally unset: nginx proxies to admin:5173 in the container,
    // and the Dockerfile CMD passes --port. Dev uses 5174 (see server.port) so
    // both apps can run side by side locally.
    preview: {
      allowedHosts: ["roadmap.cu3rd.ru"],
    },
  };
});
