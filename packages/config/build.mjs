import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const sourceJs = resolve(root, 'src/shared/config.js');
const sourceDts = resolve(root, 'src/shared/config.d.ts');
const distDir = resolve(here, 'dist');

await mkdir(distDir, { recursive: true });
await copyFile(sourceJs, resolve(distDir, 'index.js'));
await copyFile(sourceDts, resolve(distDir, 'index.d.ts'));
