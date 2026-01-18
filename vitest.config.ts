import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    // Include test files from entire workspace
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'extensions/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
      'scripts/**/*.{test,spec}.{ts,mts,mjs}',
      'demo/**/*.{test,spec}.{ts,tsx}',
    ],
    // Exclude build outputs and node_modules
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    // Support multiple environments
    environment: 'node', // Default to node
    // React/UI tests use jsdom - configured per test file with @vitest-environment jsdom comment
    // Setup files
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{ts,tsx}',
        'extensions/**/*.{ts,tsx}',
        'scripts/**/*.{ts,mts,mjs}',
      ],
      exclude: [
        '**/*.{test,spec}.{ts,tsx,mts,mjs}',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
    // Globals for easier testing
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@main': resolve(__dirname, './src/main'),
      '@renderer': resolve(__dirname, './src/renderer'),
      '@extension-host': resolve(__dirname, './src/extension-host'),
    },
  },
});
