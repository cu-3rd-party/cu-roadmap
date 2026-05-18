import type { ManifestOptions } from "vite-plugin-pwa";

export default {
  name: "CU Roadmap",
  description: "CU student roadmap",
  short_name: "CUR",
  theme_color: "#ffffff",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  icons: [
    {
      src: "pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
} satisfies Partial<ManifestOptions>;
