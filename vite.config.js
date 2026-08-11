import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite only serves the frontend. The /api/chat.js function is a
// Vercel-style serverless handler; in production Vercel runs it for you.
// For local development, `npm run server` runs the same handler under a
// tiny Express wrapper (see server.dev.js) on port 3001, and this proxy
// forwards /api/* requests to it so the frontend never talks to Gemini
// directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
