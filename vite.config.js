import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Project root is the repo root, not src/
  root: '.',

  // Static assets served as-is (favicons, manifest, sw.js, etc.)
  publicDir: 'public',

  resolve: {
    alias: {
      // Import from '@/...' resolves to 'src/...'
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
