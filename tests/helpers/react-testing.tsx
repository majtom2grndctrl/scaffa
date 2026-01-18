import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

/**
 * Custom render function with common providers
 * Can be extended to include theme providers, query clients, etc.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
    // Add wrapper providers here as needed
  });
}

/**
 * Mock component registry for testing
 */
export function createMockRegistry() {
  return {
    components: new Map(),
    getComponent: (typeId: string) => undefined,
    registerComponent: (typeId: string, metadata: any) => { },
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
