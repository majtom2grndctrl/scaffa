import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Demo Workspace Structure Validation
 *
 * Purpose: Validate that the demo workspace is correctly configured for
 * package resolution and config loading.
 *
 * Why this matters (Scaffa-specific behavior):
 * - scaffa.config.js imports from @scaffa/config package
 * - Package must be resolvable via pnpm workspace + vendored tarballs
 * - Missing pnpm-workspace.yaml breaks config loading with "Cannot find package" error
 *
 * This documents a critical cross-boundary interaction:
 * workspace structure → package resolution → config loading → extension activation
 */
describe('Demo Workspace Structure', () => {
  const demoRoot = path.resolve(__dirname);

  describe('workspace configuration', () => {
    it('should have pnpm-workspace.yaml defining workspace packages', async () => {
      const workspacePath = path.join(demoRoot, 'pnpm-workspace.yaml');

      // Check file exists
      const exists = await fs
        .access(workspacePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      // Validate content includes required packages
      const content = await fs.readFile(workspacePath, 'utf-8');
      expect(content).toContain('packages:');
      expect(content).toContain('app'); // Should include app subproject
    });

    it('should have package.json with vendored @scaffa/* extension packages', async () => {
      const packageJsonPath = path.join(demoRoot, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      // Verify devDependencies exist
      expect(pkg.devDependencies).toBeDefined();

      // Verify all required @scaffa packages are declared
      const requiredPackages = [
        '@scaffa/config',
        '@scaffa/layout-registry',
        '@scaffa/react-router-graph-producer',
        '@scaffa/shadcn-ui-registry',
      ];

      for (const packageName of requiredPackages) {
        expect(pkg.devDependencies[packageName]).toBeDefined();
        // Should reference vendored tarball
        expect(pkg.devDependencies[packageName]).toMatch(/file:\.\/vendor\//);
      }
    });
  });

  describe('vendored extension packages', () => {
    it('should have all required extension tarballs in vendor/', async () => {
      const vendorPath = path.join(demoRoot, 'vendor');

      // Check vendor directory exists
      const vendorExists = await fs
        .access(vendorPath)
        .then(() => true)
        .catch(() => false);
      expect(vendorExists).toBe(true);

      // List files
      const files = await fs.readdir(vendorPath);

      // Verify required tarballs exist
      const requiredTarballs = [
        'scaffa-config-0.1.0.tgz',
        'scaffa-layout-registry-0.1.0.tgz',
        'scaffa-react-router-graph-producer-0.1.0.tgz',
        'scaffa-shadcn-ui-registry-0.1.0.tgz',
      ];

      for (const tarball of requiredTarballs) {
        expect(files).toContain(tarball);
      }
    });
  });

  describe('config loading integration', () => {
    it('should successfully import scaffa.config.js with @scaffa/config package', async () => {
      const configPath = path.join(demoRoot, 'scaffa.config.js');

      // This tests the full package resolution chain:
      // 1. Node module resolution finds @scaffa/config
      // 2. pnpm resolves it via workspace + vendored tarball
      // 3. defineScaffaConfig function is available
      // 4. Config exports valid default
      let configModule;
      try {
        configModule = await import(configPath);
      } catch (err: any) {
        throw new Error(
          `Failed to load demo/scaffa.config.js. ` +
            `This usually means @scaffa/config package is not resolvable. ` +
            `Ensure pnpm install has been run in demo/ workspace. ` +
            `Original error: ${err.message}`
        );
      }

      // Validate config structure
      expect(configModule.default).toBeDefined();
      expect(configModule.default.schemaVersion).toBe('v0');
      expect(configModule.default.modules).toBeDefined();
      expect(Array.isArray(configModule.default.modules)).toBe(true);
    });

    it('should have valid module declarations in config', async () => {
      const configPath = path.join(demoRoot, 'scaffa.config.js');
      const configModule = await import(configPath);
      const config = configModule.default;

      // Verify expected modules are declared
      const moduleIds = config.modules.map((m: any) => m.id);

      // Workspace-local modules (path-based)
      expect(moduleIds).toContain('demo-module');
      expect(moduleIds).toContain('demo-graph-producer');
      expect(moduleIds).toContain('vite-launcher');
      expect(moduleIds).toContain('demo-save-adapter');

      // Vendored package modules (package-based)
      expect(moduleIds).toContain('shadcn-ui-registry');
      expect(moduleIds).toContain('layout-registry');
      expect(moduleIds).toContain('react-router-graph-producer');
    });

    it('should have valid preview configuration', async () => {
      const configPath = path.join(demoRoot, 'scaffa.config.js');
      const configModule = await import(configPath);
      const config = configModule.default;

      // Verify preview config
      expect(config.preview).toBeDefined();
      expect(config.preview.entry).toBeDefined();
      expect(config.preview.styles).toBeDefined();
      expect(Array.isArray(config.preview.styles)).toBe(true);
    });
  });

  describe('workspace-local extension modules', () => {
    it('should have all workspace-local extension modules as files', async () => {
      const extensionsPath = path.join(demoRoot, 'extensions');

      // Check extensions directory exists
      const exists = await fs
        .access(extensionsPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Verify workspace-local modules exist
      const localModules = [
        'demo-module/index.js',
        'demo-graph-producer/index.js',
        'vite-launcher/index.js',
        'demo-save-adapter/index.js',
      ];

      for (const modulePath of localModules) {
        const fullPath = path.join(extensionsPath, modulePath);
        const moduleExists = await fs
          .access(fullPath)
          .then(() => true)
          .catch(() => false);

        expect(moduleExists).toBe(true);
      }
    });
  });
});
