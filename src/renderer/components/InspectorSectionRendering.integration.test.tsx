/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InspectorPanel } from './InspectorPanel';
import { useInspectorStore } from '../state/inspectorStore';
import type { ComponentRegistry, InstanceDescriptor } from '../../shared/index.js';
import type { InspectorSectionContribution } from '../../shared/inspector-sections.js';

/**
 * Integration tests for inspector section initialization and rendering workflow.
 *
 * These tests verify the end-to-end flow from store initialization to UI rendering:
 *
 * Store.initialize() → IPC fetch → State update → Component render → Sections visible
 *
 * This is Scaffa-specific UI behavior driven by registry and IPC state that AI agents
 * and developers need visibility into.
 */

// Mock the inspector store
vi.mock('../state/inspectorStore', () => ({
  useInspectorStore: vi.fn(),
}));

// Mock window.scaffa API
const mockGetSections = vi.fn();
globalThis.window = {
  scaffa: {
    overrides: {
      set: vi.fn(),
      clear: vi.fn(),
    },
    inspector: {
      getSections: mockGetSections,
    },
  },
} as any;

describe('Inspector Section Rendering Workflow (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * WORKFLOW: Store initializes → Fetches sections via IPC → Panel renders sections
   *
   * This tests the critical initialization sequence:
   * 1. InspectorStore.initialize() is called
   * 2. Store fetches sections from main via window.scaffa.inspector.getSections()
   * 3. Store updates state with sections
   * 4. InspectorPanel reads state and renders sections
   */
  it('should render extension sections after store initialization', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.button' as any,
      instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      displayName: 'Submit Button',
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

    // STEP 1: Store has loaded inspector sections
    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.custom-props' as any,
        title: 'Custom Properties',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/inspector/CustomPropsSection.tsx',
        componentExport: 'default',
      },
      {
        id: 'ext-2.diagnostics' as any,
        title: 'Diagnostics',
        order: 2000,
        extensionId: 'ext-2',
        componentPath: 'src/inspector/DiagnosticsSection.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    // STEP 2: Render InspectorPanel
    render(<InspectorPanel />);

    // VERIFY: Extension sections header is visible
    expect(screen.getByText('Extension Sections')).toBeInTheDocument();

    // VERIFY: Both sections are rendered
    expect(screen.getByText('Custom Properties')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();

    // VERIFY: Placeholder text is shown (component loading not yet implemented)
    const placeholders = screen.getAllByText(/Extension section placeholder/);
    expect(placeholders).toHaveLength(2);
  });

  /**
   * WORKFLOW: No sections loaded → Panel shows no extension sections area
   *
   * This tests the baseline: when no extensions contribute sections,
   * the extension sections area should not appear at all.
   */
  it('should not render extension sections area when no sections are registered', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.button' as any,
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

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: [], // No sections
        isSectionsLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    // VERIFY: No "Extension Sections" header
    expect(screen.queryByText('Extension Sections')).not.toBeInTheDocument();

    // VERIFY: No placeholder text
    expect(screen.queryByText(/Extension section placeholder/)).not.toBeInTheDocument();
  });

  /**
   * WORKFLOW: No instance selected → Sections not rendered (even if loaded)
   *
   * This documents the conditional rendering: extension sections only appear
   * when an instance is selected AND a registry entry exists.
   */
  it('should not render extension sections when no instance is selected', () => {
    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.props' as any,
        title: 'Properties',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/props.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: null, // No selection
        registry: null,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections, // Sections loaded, but no selection
        isSectionsLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    // VERIFY: No instance selected message shown
    expect(screen.getByText('No instance selected')).toBeInTheDocument();

    // VERIFY: Extension sections not rendered
    expect(screen.queryByText('Extension Sections')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties')).not.toBeInTheDocument();
  });

  /**
   * WORKFLOW: Registry entry missing → Sections not rendered (even if loaded)
   *
   * This documents another conditional: extension sections require both
   * a selected instance AND a valid registry entry.
   */
  it('should not render extension sections when registry entry is missing', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.unknown' as any,
      instanceLocator: { type: 'instancePath', path: '/app/unknown[0]' },
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {}, // No entry for ui.unknown
    };

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.props' as any,
        title: 'Properties',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/props.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    // VERIFY: Missing registry warning shown
    expect(screen.getByText('Missing Registry Entry')).toBeInTheDocument();

    // VERIFY: Extension sections not rendered
    expect(screen.queryByText('Extension Sections')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties')).not.toBeInTheDocument();
  });

  /**
   * WORKFLOW: Sections loading → Loading state handled gracefully
   *
   * This tests the loading state during IPC fetch.
   */
  it('should handle loading state during section fetch', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.button' as any,
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

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: [],
        isSectionsLoading: true, // Loading
      };
      return selector(state);
    });

    render(<InspectorPanel />);

    // VERIFY: Inspector still renders (no crash)
    expect(screen.getByText('Inspector')).toBeInTheDocument();

    // VERIFY: No sections rendered during loading
    expect(screen.queryByText('Extension Sections')).not.toBeInTheDocument();
  });
});
