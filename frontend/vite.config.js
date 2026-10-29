import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.js'],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'https://localhost:3443',
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
