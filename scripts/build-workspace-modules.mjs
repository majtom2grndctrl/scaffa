import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const entryPoints = [
  'src/shared/config.ts',
  'modules/sample-graph-producer/index.ts',
  'modules/react-router-graph-producer/index.ts',
  'demo/extensions/demo-module/index.ts',
  'demo/extensions/vite-launcher/index.ts',
  'demo/extensions/demo-graph-producer/index.ts',
  'demo/extensions/demo-save-adapter/index.ts',
].filter((entry) => existsSync(resolve(entry)));

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
