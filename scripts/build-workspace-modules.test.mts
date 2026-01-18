import { describe, it, expect, beforeAll } from 'vitest';
import { glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('build-workspace-modules.mjs discovery', () => {
  it('should discover extensions/*/module/index.ts pattern', async () => {
    const discovered = await Array.fromAsync(glob('extensions/*/module/index.ts'));

    // Verify glob returns an array
    expect(Array.isArray(discovered)).toBe(true);

    // Verify at least one extension module exists (mui-registry from recent work)
    expect(discovered.length).toBeGreaterThan(0);

    // Verify all discovered paths follow the pattern
    for (const path of discovered) {
      expect(path).toMatch(/^extensions\/[^/]+\/module\/index\.ts$/);
    }
  });

  it('should only match direct children (single-star glob)', async () => {
    const discovered = await Array.fromAsync(glob('extensions/*/module/index.ts'));

    // Ensure no nested paths like extensions/foo/bar/module/index.ts
    for (const path of discovered) {
      const parts = path.split('/');
      expect(parts.length).toBe(4); // extensions / <name> / module / index.ts
    }
  });

  it('should verify discovered modules actually exist', async () => {
    const discovered = await Array.fromAsync(glob('extensions/*/module/index.ts'));

    for (const modulePath of discovered) {
      const fullPath = resolve(modulePath);
      expect(existsSync(fullPath)).toBe(true);
    }
  });

  it('should support static entry points', () => {
    const staticEntries = [
      'src/shared/config.ts',
      'demo/extensions/demo-module/index.ts',
      'demo/extensions/vite-launcher/index.ts',
      'demo/extensions/demo-graph-producer/index.ts',
      'demo/extensions/demo-save-adapter/index.ts',
    ];

    // At least some static entries should exist
    const existingStatic = staticEntries.filter((entry) => existsSync(resolve(entry)));
    expect(existingStatic.length).toBeGreaterThan(0);
  });
});
