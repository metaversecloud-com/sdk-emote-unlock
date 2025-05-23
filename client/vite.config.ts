import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
// https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3030/",
    },
  },
  build: {
    outDir: "./build",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  }
});
