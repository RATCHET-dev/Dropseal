import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local development, the Vite dev server proxies /api requests
// to a locally running PocketBase instance (pocketbase serve, default
// port 8090) so the browser never makes a cross-origin request and we
// never have to think about CORS.
//
// In production the built files are copied into PocketBase's
// pb_public folder, so the same PocketBase process serves both the
// static app and the /api/* endpoints from one origin -- no proxy
// needed there at all.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
