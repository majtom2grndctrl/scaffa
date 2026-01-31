import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';
import { existsSync } from 'node:fs';

test.describe('Skaffa Electron Smoke Test', () => {
  // Check if app is built before running tests
  const appPath = path.join(process.cwd(), 'dist/main/main.js');
  const isBuilt = existsSync(appPath);

  test.skip(!isBuilt, 'App must be built before running E2E tests (run: pnpm build)');

  test('should launch Skaffa and show launcher window', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for the first window (launcher or workbench)
    const window = await electronApp.firstWindow();

    // Verify window is visible
    expect(window).toBeTruthy();

    // Wait for content to load (basic smoke test)
    await window.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Basic verification: window title should contain "Skaffa"
    const title = await window.title();
    expect(title).toContain('Skaffa');

    // Take a screenshot for debugging
    await window.screenshot({ path: 'tests/e2e/screenshots/smoke-test.png' });

    // Check that the app has loaded some content
    const bodyHandle = await window.$('body');
    expect(bodyHandle).toBeTruthy();

    // Cleanup
    await electronApp.close();
  });

  test('should handle graceful shutdown', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    await electronApp.firstWindow();

    // Close the app and verify it closes cleanly
    await electronApp.close();

    // If we reach here without hanging, shutdown was successful
    expect(true).toBe(true);
  });
});
