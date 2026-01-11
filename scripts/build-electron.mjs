import { build } from 'esbuild';
import { rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const distRoot = resolve('dist');
const mainOutdir = resolve(distRoot, 'main');
const preloadOutdir = resolve(distRoot, 'preload');
const extensionHostOutdir = resolve(distRoot, 'extension-host');

rmSync(mainOutdir, { recursive: true, force: true });
rmSync(preloadOutdir, { recursive: true, force: true });
rmSync(extensionHostOutdir, { recursive: true, force: true });
mkdirSync(mainOutdir, { recursive: true });
mkdirSync(preloadOutdir, { recursive: true });
mkdirSync(extensionHostOutdir, { recursive: true });

await Promise.all([
  build({
    entryPoints: ['src/main/main.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: mainOutdir,
    target: 'node18',
    external: ['electron'],
  }),
  build({
    entryPoints: ['src/preload/preload.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: preloadOutdir,
    target: 'node18',
    external: ['electron'],
  }),
  build({
    entryPoints: ['src/extension-host/main.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: extensionHostOutdir,
    target: 'node18',
    external: [],
  }),
]);
