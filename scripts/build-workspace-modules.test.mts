import { describe, it, expect, beforeAll } from 'vitest';
import { glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('build-workspace-modules.mjs discovery', () => {
  it('should no longer discover TS entrypoints for extensions', async () => {
    const discovered = await Array.fromAsync(glob('extensions/*/module/index.ts'));

    // JS entrypoints now live in-place; TS entrypoints should be gone.
    expect(Array.isArray(discovered)).toBe(true);
    expect(discovered.length).toBe(0);
  });

  it('should no longer require static TS entry points', () => {
    const staticEntries = [
      'src/shared/config.ts',
      'demo/extensions/demo-module/index.ts',
      'demo/extensions/vite-launcher/index.ts',
      'demo/extensions/demo-graph-producer/index.ts',
      'demo/extensions/demo-save-adapter/index.ts',
    ];

    const existingStatic = staticEntries.filter((entry) => existsSync(resolve(entry)));
    expect(existingStatic.length).toBe(0);
  });
});
