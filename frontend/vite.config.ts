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
    plugins: [
      react(),
      tsconfigPaths(),
      lingui(),
      tailwindcss(),
      DEV_ENABLE_HTTPS && basicSsl(),
      VitePWA({
        // "autoUpdate": a new build activates and reloads automatically so users
        // always land on the latest version. skipWaiting + clientsClaim (below)
        // are what let the new SW take over immediately instead of parking in
        // "waiting". PwaUpdater still polls hourly so long-lived tabs notice new
        // deploys.
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico"],
        manifest: manifest,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          // /admin/* is part of this SPA now, so it must keep the navigate
          // fallback. Grafana is a separate upstream and must not get it.
          navigateFallbackDenylist: [/^\/grafana(?:\/|$)/],
          clientsClaim: true,
          // Activate a new SW immediately (paired with registerType autoUpdate)
          // so updates apply without waiting for every tab to close.
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // External resources (CDN fonts, libraries)
              urlPattern: ({ url }) => url.origin !== self.location.origin,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "external-resources",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                },
              },
            },
            {
              // API requests: use the network, fall back to cache when offline
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 10 * 60, // 10 minutes
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: DEV_ENABLE_PWA,
        },
      }),
    ].filter(Boolean),
    server: {
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
    preview: {
      allowedHosts: ["roadmap.cu3rd.ru"],
    },
  };
});
