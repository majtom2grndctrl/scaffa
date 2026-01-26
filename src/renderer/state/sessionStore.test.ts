/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeSessionListeners, useSessionStore } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    // Ensure window.scaffa is undefined to reproduce the error
    // Note: Vitest/JSDOM might have it undefined by default, but let's be explicit
    if (globalThis.window) {
      (globalThis.window as any).scaffa = undefined;
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('does not crash when initializeSessionListeners is called and window.scaffa is missing', () => {
    expect(() => {
      initializeSessionListeners();
    }).not.toThrow();
  });
});
