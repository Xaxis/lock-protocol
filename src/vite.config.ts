import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './frontend',
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend'),
      '@shared': resolve(__dirname, './shared'),
      '@backend': resolve(__dirname, './backend')
    }
  },
  define: {
    global: 'globalThis'
  }
});
