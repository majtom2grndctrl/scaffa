/**
 * @vitest-environment jsdom
 */
// ─────────────────────────────────────────────────────────────────────────────
// LayoutSection Tests
// ─────────────────────────────────────────────────────────────────────────────
// Tests for the Layout Inspector Section component.
// Focus: Scaffa-specific behavior - layout type detection, override flow, UI visibility.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutSection, isLayoutType } from './LayoutSection';
import type { ComponentRegistryEntry, InstanceDescriptor, PersistedOverride } from '../../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Mock window.scaffa
// ─────────────────────────────────────────────────────────────────────────────

const mockSetOverride = vi.fn().mockResolvedValue(undefined);
const mockClearOverride = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.scaffa in jsdom environment
  (window as any).scaffa = {
    overrides: {
      set: mockSetOverride,
      clear: mockClearOverride,
    },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const createBoxInstance = (overrides?: Partial<InstanceDescriptor>): InstanceDescriptor => ({
  sessionId: 'session-1' as any,
  instanceId: 'instance-1' as any,
  componentTypeId: 'layout.box' as any,
  displayName: 'Box',
  ...overrides,
});

const createRowInstance = (overrides?: Partial<InstanceDescriptor>): InstanceDescriptor => ({
  sessionId: 'session-1' as any,
  instanceId: 'instance-2' as any,
  componentTypeId: 'layout.row' as any,
  displayName: 'Row',
  ...overrides,
});

const createStackInstance = (overrides?: Partial<InstanceDescriptor>): InstanceDescriptor => ({
  sessionId: 'session-1' as any,
  instanceId: 'instance-3' as any,
  componentTypeId: 'layout.stack' as any,
  displayName: 'Stack',
  ...overrides,
});

const createLayoutRegistryEntry = (typeId: string): ComponentRegistryEntry => ({
  typeId: typeId as any,
  displayName: typeId === 'layout.box' ? 'Box' : typeId === 'layout.row' ? 'Row' : 'Stack',
  props: {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: isLayoutType helper
// ─────────────────────────────────────────────────────────────────────────────

describe('isLayoutType', () => {
  it('returns true for layout.box', () => {
    expect(isLayoutType('layout.box')).toBe(true);
  });

  it('returns true for layout.row', () => {
    expect(isLayoutType('layout.row')).toBe(true);
  });

  it('returns true for layout.stack', () => {
    expect(isLayoutType('layout.stack')).toBe(true);
  });

  it('returns false for non-layout types', () => {
    expect(isLayoutType('ui.button')).toBe(false);
    expect(isLayoutType('demo.button')).toBe(false);
    expect(isLayoutType('layout.other')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: LayoutSection visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('LayoutSection', () => {
  /**
   * WORKFLOW: Designer selects a Box → Inspector shows Layout section
   */
  it('renders Layout section header for Box selection', () => {
    render(
      <LayoutSection
        selectedInstance={createBoxInstance()}
        registryEntry={createLayoutRegistryEntry('layout.box')}
        overrides={[]}
      />
    );

    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Designer selects a Row → Inspector shows flex controls + Layout section
   */
  it('renders flex controls for Row selection', () => {
    render(
      <LayoutSection
        selectedInstance={createRowInstance()}
        registryEntry={createLayoutRegistryEntry('layout.row')}
        overrides={[]}
      />
    );

    // Use getAllByText for labels since they may appear with select options
    expect(screen.getByText('Gap')).toBeInTheDocument();
    expect(screen.getByText('Align')).toBeInTheDocument();
    expect(screen.getByText('Justify')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Designer selects a Stack → Inspector shows flex controls
   */
  it('renders flex controls for Stack selection', () => {
    render(
      <LayoutSection
        selectedInstance={createStackInstance()}
        registryEntry={createLayoutRegistryEntry('layout.stack')}
        overrides={[]}
      />
    );

    expect(screen.getByText('Gap')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Box does not have flex controls (only Row/Stack do)
   */
  it('does not render flex controls for Box selection', () => {
    render(
      <LayoutSection
        selectedInstance={createBoxInstance()}
        registryEntry={createLayoutRegistryEntry('layout.box')}
        overrides={[]}
      />
    );

    expect(screen.queryByText('Gap')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Margin toggle visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('LayoutSection margin toggle', () => {
  /**
   * WORKFLOW: Margin controls are hidden by default → toggle reveals them
   * 
   * UX rationale: Margins are less commonly edited, so hiding them reduces
   * visual clutter. The toggle makes them discoverable without overwhelming.
   */
  it('hides margin controls by default and shows on toggle', () => {
    render(
      <LayoutSection
        selectedInstance={createBoxInstance()}
        registryEntry={createLayoutRegistryEntry('layout.box')}
        overrides={[]}
      />
    );

    // Margin toggle exists but controls are hidden
    const marginToggle = screen.getByRole('button', { name: /Margin/i });
    expect(marginToggle).toBeInTheDocument();

    // Only Padding section box visible initially
    const paddingBoxes = screen.getAllByText('Padding');
    expect(paddingBoxes.length).toBeGreaterThan(0);

    // No Margin section box visible initially (only the toggle text)
    const marginElements = screen.getAllByText('Margin');
    expect(marginElements).toHaveLength(1); // Just the toggle button text

    // Click toggle
    fireEvent.click(marginToggle);

    // Now Margin section box should be visible
    const marginBoxes = screen.getAllByText('Margin');
    expect(marginBoxes.length).toBeGreaterThan(1); // Toggle text + section label
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Override flow via IPC
// ─────────────────────────────────────────────────────────────────────────────

describe('LayoutSection override flow', () => {
  /**
   * WORKFLOW: Designer changes gap → IPC override.set called
   * 
   * This test verifies the critical flow:
   * User selects gap value → onChange fires → window.scaffa.overrides.set called
   */
  it('calls overrides.set when gap value is changed', async () => {
    render(
      <LayoutSection
        selectedInstance={createRowInstance()}
        registryEntry={createLayoutRegistryEntry('layout.row')}
        overrides={[]}
      />
    );

    // Find the Gap select (first select in the component for Row)
    const gapLabel = screen.getByText('Gap');
    const gapSelect = gapLabel.parentElement?.querySelector('select');
    expect(gapSelect).not.toBeNull();

    // Change to value "4"
    fireEvent.change(gapSelect!, { target: { value: '4' } });

    // Wait for async call to complete
    await vi.waitFor(() => {
      expect(mockSetOverride).toHaveBeenCalledWith({
        sessionId: 'session-1',
        instanceId: 'instance-2',
        path: '/gap',
        value: '4',
        componentTypeId: 'layout.row',
        instanceLocator: undefined,
      });
    });
  });

  /**
   * WORKFLOW: Designer selects "unset" → IPC override.clear called
   * 
   * UX rationale: "Unset" means remove the override, not set a literal value.
   */
  it('calls overrides.clear when "unset" is selected', async () => {
    // Start with an existing override
    const overrides: PersistedOverride[] = [
      {
        instanceId: 'instance-2' as any,
        path: '/gap' as any,
        value: '4',
      },
    ];

    render(
      <LayoutSection
        selectedInstance={createRowInstance()}
        registryEntry={createLayoutRegistryEntry('layout.row')}
        overrides={overrides}
      />
    );

    // Find the Gap select
    const gapLabel = screen.getByText('Gap');
    const gapSelect = gapLabel.parentElement?.querySelector('select');
    expect(gapSelect).not.toBeNull();

    // Select "unset"
    fireEvent.change(gapSelect!, { target: { value: 'unset' } });

    await vi.waitFor(() => {
      expect(mockClearOverride).toHaveBeenCalledWith({
        sessionId: 'session-1',
        instanceId: 'instance-2',
        path: '/gap',
      });
    });
  });

  /**
   * WORKFLOW: Designer changes padding → IPC override.set called with correct prop path
   * 
   * Tests the side-specific padding controls work correctly.
   */
  it('calls overrides.set with correct path for all padding', async () => {
    render(
      <LayoutSection
        selectedInstance={createBoxInstance()}
        registryEntry={createLayoutRegistryEntry('layout.box')}
        overrides={[]}
      />
    );

    // Find All padding select (first one in the "All" row)
    const allLabel = screen.getByText('All');
    const allSelect = allLabel.parentElement?.querySelector('select');
    expect(allSelect).not.toBeNull();

    // Change to value "8"
    fireEvent.change(allSelect!, { target: { value: '8' } });

    await vi.waitFor(() => {
      expect(mockSetOverride).toHaveBeenCalledWith({
        sessionId: 'session-1',
        instanceId: 'instance-1',
        path: '/p',
        value: '8',
        componentTypeId: 'layout.box',
        instanceLocator: undefined,
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Existing override display
// ─────────────────────────────────────────────────────────────────────────────

describe('LayoutSection existing overrides', () => {
  /**
   * WORKFLOW: Instance has existing overrides → controls show current value
   */
  it('displays existing override values in controls', () => {
    const overrides: PersistedOverride[] = [
      {
        instanceId: 'instance-2' as any,
        path: '/gap' as any,
        value: '6',
      },
      {
        instanceId: 'instance-2' as any,
        path: '/align' as any,
        value: 'center',
      },
    ];

    render(
      <LayoutSection
        selectedInstance={createRowInstance()}
        registryEntry={createLayoutRegistryEntry('layout.row')}
        overrides={overrides}
      />
    );

    // Gap select should show "6"
    const gapLabel = screen.getByText('Gap');
    const gapSelect = gapLabel.parentElement?.querySelector('select') as HTMLSelectElement;
    expect(gapSelect.value).toBe('6');

    // Align select should show "center"
    const alignLabel = screen.getByText('Align');
    const alignSelect = alignLabel.parentElement?.querySelector('select') as HTMLSelectElement;
    expect(alignSelect.value).toBe('center');
  });
});
