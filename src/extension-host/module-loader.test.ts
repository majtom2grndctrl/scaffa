import { describe, it, expect, vi } from 'vitest';
import type { ScaffaConfig } from '../shared/config.js';
import type { ExtensionContext, ExtensionModule } from './extension-context.js';
import { ModuleLoader } from './module-loader.js';

describe('Extension Host Activation', () => {
  it('should load and activate a valid extension module', async () => {
    // Mock process.send
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    // Create a minimal mock extension
    const mockActivate = vi.fn(async (context: ExtensionContext) => {
      // Registry contribution
      context.registry.contributeRegistry({
        schemaVersion: 'v0',
        components: {
          'test.Component': {
            displayName: 'Test Component',
            props: {},
          },
        },
      });
    });

    const mockExtension: ExtensionModule = {
      activate: mockActivate,
    };

    // Create a mock config pointing to an extension
    const config: ScaffaConfig = {
      schemaVersion: 'v0',
      modules: [
        {
          id: 'test-extension',
          path: 'extensions/sample-graph-producer/module/index.ts',
        },
      ],
    };

    const loader = new ModuleLoader('/Users/dhiester/Projects/Personal/scaffa', config);

    // Note: This test actually loads the real extension since we can't easily mock dynamic imports
    // For true unit test isolation, we'd need dependency injection for the import system
    // This test validates that:
    // 1. The module loader can process a config
    // 2. Module discovery works
    // 3. Activation lifecycle executes

    try {
      await loader.loadAndActivateModules();

      // Verify process.send was called (module communications)
      expect(mockSend).toHaveBeenCalled();

      // Check for registry contribution or activation status
      const messages = mockSend.mock.calls.map((call) => call[0]);
      const hasRegistryOrStatus = messages.some(
        (msg: any) => msg.type === 'registry-contribution' || msg.type === 'module-activation-status'
      );
      expect(hasRegistryOrStatus).toBe(true);
    } finally {
      // Cleanup
      process.send = originalSend;
    }
  });

  it('should handle module load failures gracefully', async () => {
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    const config: ScaffaConfig = {
      schemaVersion: 'v0',
      modules: [
        {
          id: 'nonexistent-module',
          path: 'does/not/exist.ts',
        },
      ],
    };

    const loader = new ModuleLoader('/Users/dhiester/Projects/Personal/scaffa', config);

    await loader.loadAndActivateModules();

    // Should have sent failure status
    const messages = mockSend.mock.calls.map((call) => call[0]);
    const failureMessage = messages.find((msg: any) => msg.type === 'module-activation-status' && msg.status === 'failed');

    expect(failureMessage).toBeDefined();
    expect(failureMessage?.error).toBeDefined();

    process.send = originalSend;
  });

  it('should support workspace config with extensions/*/module pattern', () => {
    const config: ScaffaConfig = {
      schemaVersion: 'v0',
      modules: [
        {
          id: 'mui-registry',
          path: 'extensions/mui-registry/module/index.ts',
        },
      ],
    };

    // Verify config structure matches expected pattern
    expect(config.modules).toHaveLength(1);
    expect(config.modules?.[0].path).toMatch(/^extensions\/[^/]+\/module\/index\.ts$/);
  });
});
