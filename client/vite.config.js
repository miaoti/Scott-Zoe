import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Define environment variables for build time
  define: {
    // Make environment variables available at build time
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8080'),
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});