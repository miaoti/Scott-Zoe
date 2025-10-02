import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Define environment variables for build time - Railway deployment
  define: {
    // Force Railway URL for production deployment
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 
      process.env.VITE_API_URL || 'http://localhost:8080'
    ),
    // Fix for sockjs-client in browser environment
    global: 'globalThis',
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