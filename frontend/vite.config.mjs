// vite.config.mjs  (ESM!)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': 'http://localhost:8080',
      '/d':      'http://localhost:8080'
    }
  }
});

