// ─────────────────────────────────────────────────────────────────────────────
// Skaffa Project Configuration (v0 development)
// ─────────────────────────────────────────────────────────────────────────────

import { defineSkaffaConfig } from "./src/shared/config.js";

export default defineSkaffaConfig({
  schemaVersion: "v0",
  modules: [
    {
      id: "sample-graph-producer",
      path: "./extensions/sample-graph-producer/module/index.js",
    },
  ],
});
