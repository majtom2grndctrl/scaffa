import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { glob } from 'node:fs/promises';

// Static entries that don't follow the extensions/<name>/module pattern
const staticEntryPoints = [
  'src/shared/config.ts',
  'modules/sample-graph-producer/index.ts',
  'modules/react-router-graph-producer/index.ts',
  'modules/mui-registry/index.ts',
  'demo/extensions/demo-module/index.ts',
  'demo/extensions/vite-launcher/index.ts',
  // Note: runner.js is plain JavaScript (no compilation needed)
  'demo/extensions/demo-graph-producer/index.ts',
  'demo/extensions/demo-save-adapter/index.ts',
];

// Discover extension bundle modules from extensions/*/module/index.ts
// Note: Using single-star glob to match extensions/<name>/module pattern precisely
async function discoverExtensionModules() {
  try {
    return await Array.fromAsync(glob('extensions/*/module/index.ts'));
  } catch (error) {
    console.error('[WorkspaceModules] Failed to discover extension modules:', error);
    throw error; // Fail-fast: glob failures should abort the build
  }
}

// Filter static entries (glob already returns only existing files)
const validStaticEntries = staticEntryPoints.filter((entry) => existsSync(resolve(entry)));
const extensionModules = await discoverExtensionModules();
const entryPoints = [...validStaticEntries, ...extensionModules];

if (extensionModules.length > 0) {
  console.log(`[WorkspaceModules] Discovered ${extensionModules.length} extension bundle module(s):`);
  extensionModules.forEach((m) => console.log(`  - ${m}`));
}

if (entryPoints.length === 0) {
  console.log('[WorkspaceModules] No module entrypoints found, skipping build.');
  process.exit(0);
}

console.log('[WorkspaceModules] Building workspace modules...');

await build({
  entryPoints,
  outdir: '.',
  outbase: '.',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  packages: 'external',
  allowOverwrite: true,
  logLevel: 'info',
});
