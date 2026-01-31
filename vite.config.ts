import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: ['@zoomus/websdk'],
    },
  },
  server: {
    port: 3000,
    open: true,
  }
});