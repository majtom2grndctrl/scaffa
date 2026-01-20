import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentRegistry } from '../../shared/index.js';

// Mock electron - must be before any imports that use it
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock the registryManager
vi.mock('../registry/registry-manager.js', () => ({
  registryManager: {
    getEffectiveRegistry: vi.fn(),
  },
}));

// Mock validation to passthrough
vi.mock('./validation.js', () => ({
  validated: vi.fn((_reqSchema, _resSchema, handler) => handler),
}));

// Import after mocks
import { ipcMain } from 'electron';

describe('Registry IPC Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return registry wrapped in response object', async () => {
    // Import after mocks are set up
    const { registryManager } = await import('../registry/registry-manager.js');
    const { registerRegistryHandlers } = await import('./registry.js');

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'demo.button': {
          displayName: 'Button',
          props: {},
        },
      },
    };

    // Mock the registry manager to return a known registry
    vi.mocked(registryManager.getEffectiveRegistry).mockReturnValue(mockRegistry);

    // Register the handlers
    registerRegistryHandlers();

    // Get the handler that was registered
    const handleCall = vi.mocked(ipcMain.handle).mock.calls.find(
      (call) => call[0] === 'registry:get'
    );
    expect(handleCall).toBeDefined();

    const handler = handleCall![1];

    // Call the handler
    const response = await handler({} as any, {});

    // CRITICAL: Verify response shape matches what renderer expects
    expect(response).toHaveProperty('registry');
    expect(response).toEqual({
      registry: mockRegistry,
    });

    // Verify registryManager was called
    expect(registryManager.getEffectiveRegistry).toHaveBeenCalledTimes(1);
  });

  it('should match GetRegistryResponse schema shape', async () => {
    const { GetRegistryResponseSchema } = await import('./registry.js');

    // Verify the schema expects a wrapped object
    const testData = {
      registry: {
        schemaVersion: 'v0' as const,
        components: {},
      },
    };

    const result = GetRegistryResponseSchema.safeParse(testData);
    expect(result.success).toBe(true);
  });
});
