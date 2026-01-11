// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Project Configuration (v0 development)
// ─────────────────────────────────────────────────────────────────────────────

import { defineScaffaConfig } from './src/shared/config.js';

export default defineScaffaConfig({
  schemaVersion: 'v0',
  modules: [
    {
      id: 'sample-graph-producer',
      path: './modules/sample-graph-producer/index.ts',
    },
  ],
});
