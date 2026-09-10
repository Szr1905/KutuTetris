import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroying: true,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Kutu Tetris",
        short_name: "KutuTetris",
        description: "Renkli blokları yerleştir, satırları temizle, yüksek skor yap!",
        theme_color: "#0f1525",
        background_color: "#0f1525",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        categories: ["games", "puzzle"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workboxConfig: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
