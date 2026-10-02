import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load properly on GitHub Pages or when opened locally
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
