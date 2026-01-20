/**
 * Selection Flow Integration Tests (Renderer Perspective)
 *
 * These tests verify the end-to-end selection flow from the renderer's perspective:
 *
 *   IPC Event (selection:changed) → Inspector Store → UI Update
 *
 * This is a critical Scaffa workflow:
 * - User clicks element in preview → element appears in Inspector
 * - Selection changes propagate correctly to the store
 * - Session context is preserved throughout the flow
 *
 * Note: The main process broadcasting tests are in a separate file
 * (selectionBroadcast.integration.test.ts) because they require Node/Electron mocks.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InstanceDescriptor } from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// End-to-End Selection Flow Tests (Renderer Perspective)
// ─────────────────────────────────────────────────────────────────────────────
// These tests verify that selection events received via IPC correctly update
// the Inspector store and trigger UI updates.

describe('Selection Flow - Renderer Integration (End-to-End)', () => {
  // Capture the selection callback registered by the store
  let selectionCallback: ((event: any) => void) | null = null;

  const mockOnSelectionChanged = vi.fn((cb) => {
    selectionCallback = cb;
  });

  const mockRegistryGet = vi.fn().mockResolvedValue({
    registry: {
      schemaVersion: 'v0',
      components: {
        'demo.button': {
          displayName: 'Demo Button',
          props: {
            label: {
              propName: 'label',
              exposure: { kind: 'editable', control: { kind: 'string' } },
            },
            variant: {
              propName: 'variant',
              exposure: {
                kind: 'editable',
                control: {
                  kind: 'select',
                  options: [
                    { value: 'primary', label: 'Primary' },
                    { value: 'secondary', label: 'Secondary' },
                  ],
                },
              },
            },
          },
        },
        'demo.card': {
          displayName: 'Demo Card',
          props: {
            title: {
              propName: 'title',
              exposure: { kind: 'editable', control: { kind: 'string' } },
            },
          },
        },
      },
    },
  });

  const mockGetSections = vi.fn().mockResolvedValue({ sections: [] });
  const mockOnOverridesChanged = vi.fn();

  // Import the real store for these tests
  let useInspectorStore: typeof import('../state/inspectorStore.js').useInspectorStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    selectionCallback = null;

    if (!globalThis.window) {
      (globalThis as any).window = {};
    }

    // Set up window.scaffa mock without clobbering jsdom window
    (globalThis.window as any).scaffa = {
      registry: { get: mockRegistryGet },
      inspector: { getSections: mockGetSections },
      selection: { onSelectionChanged: mockOnSelectionChanged },
      overrides: { onOverridesChanged: mockOnOverridesChanged },
    };

    // Fresh import of the store
    vi.resetModules();
    const module = await import('../state/inspectorStore.js');
    useInspectorStore = module.useInspectorStore;

    // Reset store to clean state
    useInspectorStore.setState({
      selectedInstance: null,
      registry: null,
      isRegistryLoading: false,
      inspectorSections: [],
      isSectionsLoading: false,
      overrides: [],
      isInitialized: false,
    });
  });

  afterEach(() => {
    delete (globalThis.window as any).scaffa;
    vi.resetModules();
  });

  /**
   * WORKFLOW: Click element in preview → Inspector shows element
   *
   * This is the primary user journey:
   * 1. User clicks on a DemoButton in the preview
   * 2. Runtime adapter captures click and emits selection event
   * 3. Session manager broadcasts to renderer
   * 4. Inspector store updates selectedInstance
   * 5. Inspector UI shows the button's properties
   */
  it('should update Inspector when user clicks element in preview', async () => {
    // Initialize the store (this registers the selection listener)
    await useInspectorStore.getState().initialize();

    // Verify subscription was set up
    expect(mockOnSelectionChanged).toHaveBeenCalled();
    expect(selectionCallback).not.toBeNull();

    // Simulate the IPC event that would come from main process
    // This is what happens when broadcastSelectionChanged sends the event
    const clickedInstance: InstanceDescriptor = {
      sessionId: 'session_demo' as any,
      instanceId: 'inst_r1_button' as any,
      componentTypeId: 'demo.button' as any,
      displayName: 'Primary Button',
      instanceLocator: { kind: 'renderIndex', index: 0 },
      props: {
        label: 'Click me',
        variant: 'primary',
      },
    };

    selectionCallback!({ selected: clickedInstance });

    // VERIFY: Store now has the selected instance
    const state = useInspectorStore.getState();
    expect(state.selectedInstance).toEqual(clickedInstance);
    expect(state.selectedInstance?.componentTypeId).toBe('demo.button');
    expect(state.selectedInstance?.props?.label).toBe('Click me');
  });

  /**
   * WORKFLOW: Click different element → Inspector updates to new element
   *
   * User clicks Button A, then clicks Card B. Inspector should show Card B.
   */
  it('should update Inspector when user selects different element', async () => {
    await useInspectorStore.getState().initialize();

    // First selection: a button
    const button: InstanceDescriptor = {
      sessionId: 'session_demo' as any,
      instanceId: 'inst_button_0' as any,
      componentTypeId: 'demo.button' as any,
      displayName: 'First Button',
      props: { label: 'Button A' },
    };

    selectionCallback!({ selected: button });
    expect(useInspectorStore.getState().selectedInstance?.displayName).toBe('First Button');

    // Second selection: a card
    const card: InstanceDescriptor = {
      sessionId: 'session_demo' as any,
      instanceId: 'inst_card_0' as any,
      componentTypeId: 'demo.card' as any,
      displayName: 'Welcome Card',
      props: { title: 'Card B' },
    };

    selectionCallback!({ selected: card });

    // VERIFY: Inspector now shows the card
    const state = useInspectorStore.getState();
    expect(state.selectedInstance?.displayName).toBe('Welcome Card');
    expect(state.selectedInstance?.componentTypeId).toBe('demo.card');
    expect(state.selectedInstance?.props?.title).toBe('Card B');
  });

  /**
   * WORKFLOW: Click empty area → Inspector clears selection
   *
   * User clicks on empty area (not on any component). Selection should clear.
   */
  it('should clear Inspector when user clicks empty area', async () => {
    await useInspectorStore.getState().initialize();

    // First, select something
    const button: InstanceDescriptor = {
      sessionId: 'session_demo' as any,
      instanceId: 'inst_button_0' as any,
      componentTypeId: 'demo.button' as any,
    };
    selectionCallback!({ selected: button });
    expect(useInspectorStore.getState().selectedInstance).not.toBeNull();

    // User clicks empty area
    selectionCallback!({ selected: null });

    // VERIFY: Selection is cleared
    expect(useInspectorStore.getState().selectedInstance).toBeNull();
  });

  /**
   * WORKFLOW: Esc key clears selection → Inspector receives null
   *
   * When user presses Esc, runtime adapter emits null selection.
   * This should clear the Inspector just like clicking empty area.
   */
  it('should clear Inspector when Esc key is pressed (null selection from runtime)', async () => {
    await useInspectorStore.getState().initialize();

    // Select an element
    const card: InstanceDescriptor = {
      sessionId: 'session_demo' as any,
      instanceId: 'inst_card_0' as any,
      componentTypeId: 'demo.card' as any,
      displayName: 'Card to escape',
    };
    selectionCallback!({ selected: card });
    expect(useInspectorStore.getState().selectedInstance?.displayName).toBe('Card to escape');

    // Esc key triggers null selection from runtime
    selectionCallback!({ selected: null });

    // VERIFY: Inspector is cleared
    expect(useInspectorStore.getState().selectedInstance).toBeNull();
  });

  /**
   * WORKFLOW: Selection includes session context
   *
   * Selected instance must include sessionId so overrides can be scoped correctly.
   * This is critical for multi-session support (multiple preview tabs).
   */
  it('should preserve session context in selection', async () => {
    await useInspectorStore.getState().initialize();

    const sessionId = 'session_unique_abc' as any;
    const instance: InstanceDescriptor = {
      sessionId,
      instanceId: 'inst_scoped_0' as any,
      componentTypeId: 'demo.button' as any,
      displayName: 'Session-Scoped Button',
    };

    selectionCallback!({ selected: instance });

    // VERIFY: Session ID is preserved
    expect(useInspectorStore.getState().selectedInstance?.sessionId).toBe(sessionId);
  });

  /**
   * WORKFLOW: Multiple rapid selections → Final selection wins
   *
   * If user clicks multiple elements quickly, store should reflect the final selection.
   * No race conditions or stale state.
   */
  it('should handle rapid selection changes without race conditions', async () => {
    await useInspectorStore.getState().initialize();

    // Simulate rapid clicks
    for (let i = 0; i < 10; i++) {
      const instance: InstanceDescriptor = {
        sessionId: 'session_rapid' as any,
        instanceId: `inst_item_${i}` as any,
        componentTypeId: 'demo.button' as any,
        displayName: `Button ${i}`,
      };
      selectionCallback!({ selected: instance });
    }

    // VERIFY: Final selection is correct
    expect(useInspectorStore.getState().selectedInstance?.displayName).toBe('Button 9');
  });

  /**
   * WORKFLOW: Selection with complete instance descriptor
   *
   * Verify that all fields of the InstanceDescriptor are preserved when
   * the selection flows through the system.
   */
  it('should preserve complete instance descriptor including props and locator', async () => {
    await useInspectorStore.getState().initialize();

    const instance: InstanceDescriptor = {
      sessionId: 'session_complete' as any,
      instanceId: 'inst_full_0' as any,
      componentTypeId: 'demo.button' as any,
      displayName: 'Full Instance',
      instanceLocator: { kind: 'renderIndex', index: 3 },
      props: {
        label: 'Test Label',
        variant: 'secondary',
        disabled: true,
        count: 42,
      },
    };

    selectionCallback!({ selected: instance });

    const selected = useInspectorStore.getState().selectedInstance;

    // VERIFY: All fields preserved
    expect(selected?.sessionId).toBe('session_complete');
    expect(selected?.instanceId).toBe('inst_full_0');
    expect(selected?.componentTypeId).toBe('demo.button');
    expect(selected?.displayName).toBe('Full Instance');
    expect(selected?.instanceLocator).toEqual({ kind: 'renderIndex', index: 3 });
    expect(selected?.props).toEqual({
      label: 'Test Label',
      variant: 'secondary',
      disabled: true,
      count: 42,
    });
  });

  /**
   * WORKFLOW: Selection before store initialization
   *
   * Edge case: What happens if selection events arrive before the store
   * has finished initializing? The callback shouldn't be set yet.
   */
  it('should not receive selection events before initialization', () => {
    // Store is not initialized yet
    expect(selectionCallback).toBeNull();

    // VERIFY: No callback registered means no events will be processed
    // This is the expected behavior - events are only processed after init
  });
});
