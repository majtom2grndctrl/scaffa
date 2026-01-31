import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

// Demo App Vite Configuration
// 
// ARCHITECTURE NOTE:
// This is the production Vite config. When Skaffa runs preview sessions,
// the vite-launcher merges its own config (harness plugin) with this one.
// 
// No Skaffa-specific configuration needed here - the harness handles everything.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
});
