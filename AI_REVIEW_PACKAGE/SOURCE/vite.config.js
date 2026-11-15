import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'entry.html'),
    },
    assetsInlineLimit: 100000000,
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: '/entry.html'
  }
});
