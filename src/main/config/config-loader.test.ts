import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadConfig, getDefaultConfig } from './config-loader.js';

describe('Config Loader', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test configs
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffa-config-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getDefaultConfig', () => {
    it('should return a valid empty config', () => {
      const config = getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.schemaVersion).toBe('v0');
      expect(config.modules).toEqual([]);
    });
  });

  describe('loadConfig', () => {
    it('should successfully load a valid config', async () => {
      // Write a valid config
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'v0',
          modules: [
            { id: 'test-module', path: './modules/test.js' }
          ]
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.modules).toHaveLength(1);
      expect(result.config?.modules?.[0].id).toBe('test-module');
      expect(result.error).toBeUndefined();
    });

    it('should return NOT_FOUND when config file does not exist', async () => {
      const result = await loadConfig(tempDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toContain('Config file not found');
      expect(result.config).toBeUndefined();
    });

    it('should return INVALID_SYNTAX when config has syntax errors', async () => {
      // Write an invalid JavaScript file
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'v0',
          modules: [
            { id: 'test', // Missing closing brace and bracket
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SYNTAX');
      expect(result.error?.message).toContain('Failed to load scaffa.config.js');
      expect(result.config).toBeUndefined();
    });

    it('should return VALIDATION_ERROR when config has no default export', async () => {
      // Write a config with no default export
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export const someOtherExport = { foo: 'bar' };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('must export a default configuration');
      expect(result.config).toBeUndefined();
    });

    it('should return VALIDATION_ERROR when config fails Zod validation', async () => {
      // Write a config with invalid schema
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'invalid-version', // Should be 'v0'
          modules: 'not-an-array' // Should be an array
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Config validation failed');
      expect(result.error?.details).toBeDefined();
      expect(result.config).toBeUndefined();
    });

    it('should format Zod validation errors with paths', async () => {
      // Write a config with multiple validation errors
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'invalid',
          modules: [
            { id: 123 } // id should be string
          ]
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');

      // Check that error message contains formatted issues with paths
      expect(result.error?.message).toContain('Config validation failed');
      expect(result.error?.message).toContain('•'); // Bullet point formatting

      // Should mention the field paths
      const message = result.error?.message || '';
      expect(
        message.includes('schemaVersion') || message.includes('modules')
      ).toBe(true);
    });

    it('should handle module config with various path formats', async () => {
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'v0',
          modules: [
            { id: 'file-path-module', path: './extensions/module.js' },
            { id: 'package-module', package: '@scaffa/some-module' },
            { id: 'workspace-prefix', path: '@/extensions/module.js' },
            { id: 'workspace-protocol', path: 'workspace:/extensions/module.js' }
          ]
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(true);
      expect(result.config?.modules).toHaveLength(4);
      expect(result.config?.modules?.[0].path).toBe('./extensions/module.js');
      expect(result.config?.modules?.[1].package).toBe('@scaffa/some-module');
      expect(result.config?.modules?.[2].path).toBe('@/extensions/module.js');
      expect(result.config?.modules?.[3].path).toBe('workspace:/extensions/module.js');
    });

    it('should handle preview config with entry and styles', async () => {
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'v0',
          preview: {
            entry: './src/App.tsx',
            styles: ['./src/index.css', './src/theme.css']
          }
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(true);
      expect(result.config?.preview?.entry).toBe('./src/App.tsx');
      expect(result.config?.preview?.styles).toEqual(['./src/index.css', './src/theme.css']);
    });

    it('should handle component overrides', async () => {
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          schemaVersion: 'v0',
          components: {
            overrides: {
              'ui.button': {
                displayName: 'Custom Button',
                props: {
                  variant: {
                    exposure: { kind: 'editable' }
                  }
                }
              }
            }
          }
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(true);
      expect(result.config?.components?.overrides?.['ui.button']).toBeDefined();
      expect(result.config?.components?.overrides?.['ui.button']?.displayName).toBe('Custom Button');
    });

    it('should apply default schemaVersion when not specified', async () => {
      const configPath = path.join(tempDir, 'scaffa.config.js');
      await fs.writeFile(
        configPath,
        `
        export default {
          modules: [{ id: 'test', path: './test.js' }]
        };
        `
      );

      const result = await loadConfig(tempDir);

      expect(result.success).toBe(true);
      expect(result.config?.schemaVersion).toBe('v0'); // Should default to v0
      expect(result.config?.modules).toHaveLength(1);
    });
  });
});
