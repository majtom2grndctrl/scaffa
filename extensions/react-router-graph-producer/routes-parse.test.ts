import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('React Router Graph Producer - routes.tsx integration', () => {
  it('demo/app/src/routes.tsx exists and is readable', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../demo');
    const routesPath = path.join(workspaceRoot, 'app/src/routes.tsx');

    // Verify file exists
    expect(fs.existsSync(routesPath)).toBe(true);

    // Verify file is readable
    const content = await fs.promises.readFile(routesPath, 'utf-8');
    expect(content).toBeTruthy();

    // Verify it exports routes array
    expect(content).toContain('export const routes');
    expect(content).toContain('RouteObject[]');
  });

  it('routes.tsx contains required route shape with id field', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../demo');
    const routesPath = path.join(workspaceRoot, 'app/src/routes.tsx');

    const content = await fs.promises.readFile(routesPath, 'utf-8');

    // Verify routes have id field (required for graph producer)
    expect(content).toContain("id: 'home'");

    // Verify routes have path field
    expect(content).toContain("path: '/'");
  });
});
