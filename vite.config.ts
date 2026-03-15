import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/cocomo_estimator/",
  build: {
    sourcemap: false,
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
