/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectorPanel } from './InspectorPanel';
import { useInspectorStore } from '../state/inspectorStore';
import type { ComponentRegistry } from '../../shared/index.js';

// Mock the inspector store
vi.mock('../state/inspectorStore', () => ({
  useInspectorStore: vi.fn(),
}));

// Mock window.skaffa API
const skaffaApi = {
  overrides: {
    set: vi.fn(),
    clear: vi.fn(),
  },
};

describe('InspectorPanel', () => {
  beforeAll(() => {
    (globalThis.window as any).skaffa = skaffaApi;
  });

  afterAll(() => {
    delete (globalThis.window as any).skaffa;
  });

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
        inspectorSections: [],
        isSectionsLoading: false,
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
        inspectorSections: [],
        isSectionsLoading: false,
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
        inspectorSections: [],
        isSectionsLoading: false,
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
        inspectorSections: [],
        isSectionsLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    expect(screen.getByText('2 overrides')).toBeInTheDocument();
  });

  describe('prop grouping and sorting', () => {
    it('should group props by group property', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-grouped',
        componentTypeId: 'ui.card',
        instanceLocator: { type: 'instancePath', path: '/app/card[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.card': {
            displayName: 'Card',
            props: {
              title: {
                propName: 'title',
                exposure: { kind: 'editable', control: { kind: 'string' } },
                group: 'Content',
              },
              description: {
                propName: 'description',
                exposure: { kind: 'editable', control: { kind: 'string', multiline: true } },
                group: 'Content',
              },
              variant: {
                propName: 'variant',
                exposure: { kind: 'editable', control: { kind: 'select', options: [] } },
                group: 'Style',
              },
            },
          },
        },
      };

      vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
        const state = {
          selectedInstance: mockInstance,
          registry: mockRegistry,
          overrides: [],
          isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: false,
        };
        return selector(state);
      });

      render(<InspectorPanel />);

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Style')).toBeInTheDocument();
    });

    it('should sort props by order within groups', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-sorted',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {
              variant: {
                propName: 'variant',
                exposure: { kind: 'editable', control: { kind: 'string' } },
                order: 2,
              },
              size: {
                propName: 'size',
                exposure: { kind: 'editable', control: { kind: 'string' } },
                order: 1,
              },
              disabled: {
                propName: 'disabled',
                exposure: { kind: 'editable', control: { kind: 'boolean' } },
                order: 3,
              },
            },
          },
        },
      };

      vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
        const state = {
          selectedInstance: mockInstance,
          registry: mockRegistry,
          overrides: [],
          isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: false,
        };
        return selector(state);
      });

      const { container } = render(<InspectorPanel />);

      // Get all labels in order
      const labels = Array.from(container.querySelectorAll('label')).map((el) =>
        el.textContent?.trim().split('Editable')[0].trim()
      );

      // Verify order: size (1), variant (2), disabled (3)
      const propLabels = labels.filter((label) => ['size', 'variant', 'disabled'].includes(label ?? ''));
      expect(propLabels).toEqual(['size', 'variant', 'disabled']);
    });
  });

  describe('override detection', () => {
    it('should detect orphaned overrides', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-current',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {},
          },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-current', path: '/variant', value: 'primary' },
        { sessionId: 'session-1', instanceId: 'instance-old', path: '/size', value: 'large' },
        { sessionId: 'session-1', instanceId: 'instance-old', path: '/disabled', value: true },
      ];

      vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
        const state = {
          selectedInstance: mockInstance,
          registry: mockRegistry,
          overrides: mockOverrides,
          isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: false,
        };
        return selector(state);
      });

      render(<InspectorPanel />);

      expect(screen.getByText('2 orphaned overrides')).toBeInTheDocument();
      expect(screen.getByText('instance-old → /size')).toBeInTheDocument();
      expect(screen.getByText('instance-old → /disabled')).toBeInTheDocument();
    });

    it('should show clear button for orphaned overrides', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-current',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {},
          },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-old', path: '/size', value: 'large' },
      ];

      vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
        const state = {
          selectedInstance: mockInstance,
          registry: mockRegistry,
          overrides: mockOverrides,
          isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: false,
        };
        return selector(state);
      });

      render(<InspectorPanel />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should not show orphaned override warning when all overrides belong to current instance', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-current',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {},
          },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-current', path: '/variant', value: 'primary' },
        { sessionId: 'session-1', instanceId: 'instance-current', path: '/size', value: 'large' },
      ];

      vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
        const state = {
          selectedInstance: mockInstance,
          registry: mockRegistry,
          overrides: mockOverrides,
          isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: false,
        };
        return selector(state);
      });

      render(<InspectorPanel />);

      expect(screen.queryByText(/orphaned override/)).not.toBeInTheDocument();
    });
  });
});
