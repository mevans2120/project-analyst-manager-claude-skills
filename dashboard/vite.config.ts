import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Keep output clean for production
    minify: 'terser',
    sourcemap: true,
  },

  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from project root
      allow: ['..'],
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
      '@services': resolve(__dirname, './src/services'),
    },
  },

  // Enable HMR for Lit components
  optimizeDeps: {
    include: ['lit'],
  },
});
