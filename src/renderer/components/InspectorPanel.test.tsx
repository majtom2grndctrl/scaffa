/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectorPanel } from './InspectorPanel';
import { useInspectorStore } from '../state/inspectorStore';
import type { ComponentRegistry } from '../../shared/index.js';

// Mock the inspector store
vi.mock('../state/inspectorStore', () => ({
  useInspectorStore: vi.fn(),
}));

// Mock window.scaffa API
globalThis.window = {
  scaffa: {
    overrides: {
      set: vi.fn(),
      clear: vi.fn(),
    },
  },
} as any;

describe('InspectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "No instance selected" when no instance is selected', () => {
    // Mock empty state
    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: null,
        registry: null,
        overrides: [],
        isRegistryLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('No instance selected')).toBeInTheDocument();
    expect(
      screen.getByText('Click a component in the preview to inspect and edit its properties.')
    ).toBeInTheDocument();
  });

  it('should render instance metadata when instance is selected', () => {
    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.button': {
          displayName: 'Button',
          props: {},
        },
      },
    };

    const mockInstance = {
      sessionId: 'session-1',
      instanceId: 'instance-123',
      componentTypeId: 'ui.button',
      displayName: 'Submit Button',
      instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
    } as any;

    // Mock selected instance state
    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument(); // displayName from registry
    expect(screen.getByText('ui.button')).toBeInTheDocument(); // componentTypeId
    expect(screen.getByText('instance-123')).toBeInTheDocument(); // instanceId
    expect(screen.getByText('Submit Button')).toBeInTheDocument(); // displayName from instance
  });

  it('should show warning when registry entry is missing', () => {
    const mockInstance = {
      sessionId: 'session-1',
      instanceId: 'instance-456',
      componentTypeId: 'ui.unknown',
      instanceLocator: { type: 'instancePath', path: '/app/unknown[0]' },
    } as any;

    const emptyRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {},
    };

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: emptyRegistry,
        overrides: [],
        isRegistryLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    expect(screen.getByText('Missing Registry Entry')).toBeInTheDocument();
    expect(screen.getByText(/No registry entry found for:/)).toBeInTheDocument();
    // ui.unknown appears multiple times (component type display + in warning)
    expect(screen.getAllByText('ui.unknown').length).toBeGreaterThan(0);
  });

  it('should display override count correctly', () => {
    const mockInstance = {
      sessionId: 'session-1',
      instanceId: 'instance-789',
      componentTypeId: 'ui.input',
      instanceLocator: { type: 'instancePath', path: '/app/input[0]' },
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.input': {
          displayName: 'Input',
          props: {},
        },
      },
    };

    const mockOverrides = [
      { sessionId: 'session-1', instanceId: 'instance-789', path: '/value', value: 'test' },
      { sessionId: 'session-1', instanceId: 'instance-789', path: '/disabled', value: true },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: mockOverrides,
        isRegistryLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    expect(screen.getByText('2 overrides')).toBeInTheDocument();
  });
});
