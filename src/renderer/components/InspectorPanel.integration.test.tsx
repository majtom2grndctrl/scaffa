/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InspectorPanel } from '../components/InspectorPanel';
import { useInspectorStore } from '../state/inspectorStore';
import type { ComponentRegistry } from '../../shared/index.js';

vi.mock('../state/inspectorStore', () => ({
  useInspectorStore: vi.fn(),
}));

const mockOverrideSet = vi.fn();
const mockOverrideClear = vi.fn();

const scaffaApi = {
  overrides: {
    set: mockOverrideSet,
    clear: mockOverrideClear,
  },
};

describe('Inspector Integration Tests', () => {
  beforeAll(() => {
    (globalThis.window as any).scaffa = scaffaApi;
  });

  afterAll(() => {
    delete (globalThis.window as any).scaffa;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Override set operation', () => {
    it('should call IPC to set override when string input changes', async () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-123',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {
              label: {
                propName: 'label',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string', placeholder: 'Enter label' },
                },
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

      mockOverrideSet.mockResolvedValue({});

      render(<InspectorPanel />);

      const input = screen.getByPlaceholderText('Enter label') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Click me' } });

      await waitFor(() => {
        expect(mockOverrideSet).toHaveBeenCalledWith({
          sessionId: 'session-1',
          instanceId: 'instance-123',
          path: '/label',
          value: 'Click me',
          componentTypeId: 'ui.button',
          instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        });
      });
    });
  });

  describe('Override clear operation', () => {
    it('should call IPC to clear override when reset button is clicked', async () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-reset',
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
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string' },
                  uiDefaultValue: 'default',
                },
              },
            },
          },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-reset', path: '/variant', value: 'primary' },
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

      mockOverrideClear.mockResolvedValue({});

      render(<InspectorPanel />);

      const resetButton = screen.getByText('Reset to default');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockOverrideClear).toHaveBeenCalledWith({
          sessionId: 'session-1',
          instanceId: 'instance-reset',
          path: '/variant',
        });
      });
    });
  });

  describe('Orphaned override clearing', () => {
    it('should call IPC to clear all orphaned overrides when Clear all is clicked', async () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-current',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': { displayName: 'Button', props: {} },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-current', path: '/variant', value: 'primary' },
        { sessionId: 'session-1', instanceId: 'instance-old-1', path: '/size', value: 'large' },
        { sessionId: 'session-1', instanceId: 'instance-old-2', path: '/disabled', value: true },
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

      mockOverrideClear.mockResolvedValue({});

      render(<InspectorPanel />);

      const clearAllButton = screen.getByText('Clear all');
      fireEvent.click(clearAllButton);

      await waitFor(() => {
        expect(mockOverrideClear).toHaveBeenCalledTimes(2);
      });

      expect(mockOverrideClear).toHaveBeenCalledWith({
        sessionId: 'session-1',
        instanceId: 'instance-old-1',
        path: '/size',
      });

      expect(mockOverrideClear).toHaveBeenCalledWith({
        sessionId: 'session-1',
        instanceId: 'instance-old-2',
        path: '/disabled',
      });
    });
  });

  describe('Registry-driven prop list rendering', () => {
    it('should render all props from registry with correct controls', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-full',
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
                label: 'Title',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string', placeholder: 'Enter title' },
                },
                group: 'Content',
                order: 1,
              },
              disabled: {
                propName: 'disabled',
                label: 'Disabled',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'boolean' },
                },
                group: 'State',
                order: 1,
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
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText('Enter title')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('Exposure kind behaviors', () => {
    it('should render inspect-only props as read-only with escape hatch', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-readonly',
        componentTypeId: 'ui.complex',
        instanceLocator: { type: 'instancePath', path: '/app/complex[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.complex': {
            displayName: 'Complex Component',
            props: {
              computedValue: {
                propName: 'computedValue',
                label: 'Computed Value',
                exposure: {
                  kind: 'inspectOnly',
                },
              },
            },
          },
        },
      };

      const mockOverrides = [
        {
          sessionId: 'session-1',
          instanceId: 'instance-readonly',
          path: '/computedValue',
          value: 'calculated-result',
        },
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

      // Should show the value but indicate it's read-only
      expect(screen.getByText('Read-only')).toBeInTheDocument();
      expect(screen.getByText('View source →')).toBeInTheDocument();

      // Should not have editable controls
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('should render opaque props with warning and escape hatch', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-opaque',
        componentTypeId: 'ui.advanced',
        instanceLocator: { type: 'instancePath', path: '/app/advanced[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.advanced': {
            displayName: 'Advanced Component',
            props: {
              complexConfig: {
                propName: 'complexConfig',
                label: 'Complex Config',
                exposure: {
                  kind: 'opaque',
                  reason: 'Requires JSX or function',
                },
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

      // Should show opaque warning with reason
      expect(screen.getByText(/Opaque value/)).toBeInTheDocument();
      expect(screen.getByText(/Requires JSX or function/)).toBeInTheDocument();

      // Should provide escape hatch to source
      expect(screen.getByText('View source →')).toBeInTheDocument();

      // Should not have any editable controls
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should only allow editing on editable props', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-mixed',
        componentTypeId: 'ui.mixed',
        instanceLocator: { type: 'instancePath', path: '/app/mixed[0]' },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.mixed': {
            displayName: 'Mixed Exposure Component',
            props: {
              title: {
                propName: 'title',
                label: 'Title',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string' },
                },
                order: 1,
              },
              status: {
                propName: 'status',
                label: 'Status',
                exposure: {
                  kind: 'inspectOnly',
                },
                order: 2,
              },
              onAction: {
                propName: 'onAction',
                label: 'On Action',
                exposure: {
                  kind: 'opaque',
                  reason: 'Event handler',
                },
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

      render(<InspectorPanel />);

      // Editable prop should have control
      expect(screen.getByText('Editable')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Inspect-only should show read-only indicator
      const readOnlyIndicators = screen.getAllByText('Read-only');
      expect(readOnlyIndicators.length).toBeGreaterThan(0);

      // Opaque should show opaque indicator
      expect(screen.getByText('Opaque')).toBeInTheDocument();
    });
  });

  describe('Baseline value resolution (runtime props)', () => {
    it('should show runtime-provided baseline value when no override exists for editable prop', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-baseline',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        // Runtime provides current prop values
        props: {
          variant: 'secondary',
          label: 'Runtime Label',
        },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {
              variant: {
                propName: 'variant',
                label: 'Variant',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string' },
                  uiDefaultValue: 'primary', // uiDefault differs from runtime
                },
              },
              label: {
                propName: 'label',
                label: 'Label',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string', placeholder: 'Enter label' },
                },
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

      // Should show runtime baseline values in inputs, not uiDefaultValue
      const variantInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
      const labelInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;

      expect(variantInput.value).toBe('secondary'); // runtime value, not 'primary'
      expect(labelInput.value).toBe('Runtime Label');
    });

    it('should show runtime-provided baseline value for inspect-only props', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-inspect',
        componentTypeId: 'ui.status',
        instanceLocator: { type: 'instancePath', path: '/app/status[0]' },
        props: {
          connectionStatus: 'connected',
          lastUpdated: '2026-01-19T12:00:00Z',
        },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.status': {
            displayName: 'Status',
            props: {
              connectionStatus: {
                propName: 'connectionStatus',
                label: 'Connection Status',
                exposure: {
                  kind: 'inspectOnly',
                },
              },
              lastUpdated: {
                propName: 'lastUpdated',
                label: 'Last Updated',
                exposure: {
                  kind: 'inspectOnly',
                },
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

      // Should display runtime baseline values for inspect-only props
      expect(screen.getByText('"connected"')).toBeInTheDocument();
      expect(screen.getByText('"2026-01-19T12:00:00Z"')).toBeInTheDocument();
    });

    it('should reset to runtime baseline after clearing override', async () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-reset-baseline',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        props: {
          variant: 'outline', // runtime baseline
        },
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {
              variant: {
                propName: 'variant',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string' },
                  uiDefaultValue: 'primary', // different from runtime
                },
              },
            },
          },
        },
      };

      const mockOverrides = [
        { sessionId: 'session-1', instanceId: 'instance-reset-baseline', path: '/variant', value: 'danger' },
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

      mockOverrideClear.mockResolvedValue({});

      render(<InspectorPanel />);

      // Initial state shows override value
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('danger');

      // Click reset
      const resetButton = screen.getByText('Reset to default');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockOverrideClear).toHaveBeenCalledWith({
          sessionId: 'session-1',
          instanceId: 'instance-reset-baseline',
          path: '/variant',
        });
      });

      await waitFor(() => {
        expect(input.value).toBe('outline');
      });
    });

    it('should fall back to uiDefaultValue when no runtime props available', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-no-props',
        componentTypeId: 'ui.button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        // No props provided by runtime
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.button': {
            displayName: 'Button',
            props: {
              variant: {
                propName: 'variant',
                exposure: {
                  kind: 'editable',
                  control: { kind: 'string' },
                  uiDefaultValue: 'primary',
                },
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

      // Should fall back to uiDefaultValue when no runtime props
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('primary');
    });

    it('should show "Value not available" for inspect-only props when no runtime baseline', () => {
      const mockInstance = {
        sessionId: 'session-1',
        instanceId: 'instance-no-baseline',
        componentTypeId: 'ui.status',
        instanceLocator: { type: 'instancePath', path: '/app/status[0]' },
        // No props provided
      } as any;

      const mockRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.status': {
            displayName: 'Status',
            props: {
              unknownProp: {
                propName: 'unknownProp',
                label: 'Unknown Prop',
                exposure: {
                  kind: 'inspectOnly',
                },
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

      // Should show unknown baseline indicator
      expect(screen.getByText('Value not available')).toBeInTheDocument();
    });
  });
});
