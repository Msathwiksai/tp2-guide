import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
      server: {
        port: 3000,
        // Without this, a busy port 3000 makes Vite silently fall through to
        // 3001 - the API port - and the /api proxy below then points at Vite
        // itself. That self-proxy loop never resolves, so the UI spins forever.
        // Failing loudly is far easier to diagnose than a hanging request.
        strictPort: true,
        // 0.0.0.0 keeps the dev server reachable from other devices on your
        // network (phone, tablet) via the Network URL Vite prints on startup.
        host: '0.0.0.0',
        proxy: {
          // Derived from the same env var the API server reads, so the two
          // cannot drift apart.
          '/api': process.env.API_ORIGIN || `http://localhost:${process.env.API_PORT || 3001}`,
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
});
