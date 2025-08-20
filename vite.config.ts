import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'https://antonioadmin.netlify.app/',
        changeOrigin: true,
      },
      '/ws': {
        target: 'wss://web-production-4bdb.up.railway.app',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
