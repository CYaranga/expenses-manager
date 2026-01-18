import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/expenses-manager/',
  build: {
    outDir: 'dist/expenses-manager',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    proxy: {
      '/expenses-manager/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
