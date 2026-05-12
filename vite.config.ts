import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Absolute base so /samples/... resolves the same regardless of current
  // route. When deploying to a GH Pages subpath, set VITE_BASE=/cue/ via env.
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3333,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3333,
    strictPort: true,
  },
});
