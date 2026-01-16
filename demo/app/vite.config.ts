import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      // Production-safe Scaffa runtime shim: switches between real adapter (dev) and no-ops (prod)
      '@/scaffa-runtime': path.resolve(
        __dirname,
        `src/scaffa-runtime.${mode === 'production' ? 'prod' : 'dev'}.ts`
      ),
    },
  },
}));
