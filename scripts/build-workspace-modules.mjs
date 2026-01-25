import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { glob } from 'node:fs/promises';

// Static entries that don't follow the extensions/<name>/module pattern.
// The extension-sdk.ts provides a stable import surface for extension authors.
const staticEntryPoints = ['extension-sdk.ts'];

// Discover extension bundle modules from extensions/*/module/index.{ts,js}
// Note: Using single-star glob to match extensions/<name>/module pattern precisely
async function discoverExtensionModules() {
  try {
    // Look for both .ts and .js files, preferring .ts if both exist
    const tsModules = await Array.fromAsync(glob('extensions/*/module/index.ts'));
    const jsModules = await Array.fromAsync(glob('extensions/*/module/index.js'));

    // Filter out .js files that have a corresponding .ts file (to avoid duplicates)
    const tsPaths = new Set(tsModules.map(p => p.replace(/\.ts$/, '.js')));
    const uniqueJsModules = jsModules.filter(p => !tsPaths.has(p));

    return [...tsModules, ...uniqueJsModules];
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
