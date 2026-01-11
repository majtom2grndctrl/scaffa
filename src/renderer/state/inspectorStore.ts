// ─────────────────────────────────────────────────────────────────────────────
// Inspector Store (Renderer)
// ─────────────────────────────────────────────────────────────────────────────
// Maintains selected instance state, component registry, and overrides for Inspector UI.

import { create } from 'zustand';
import type {
  InstanceDescriptor,
  ComponentRegistry,
  PersistedOverride,
} from '../../shared/index.js';

interface InspectorState {
  // Selected instance
  selectedInstance: InstanceDescriptor | null;

  // Component registry (cached)
  registry: ComponentRegistry | null;
  isRegistryLoading: boolean;

  // Override state for current session
  overrides: PersistedOverride[];

  // Actions
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useInspectorStore = create<InspectorState>((set, get) => ({
  selectedInstance: null,
  registry: null,
  isRegistryLoading: false,
  overrides: [],

  /**
   * Initialize the inspector by:
   * 1. Fetching the component registry
   * 2. Subscribing to selection events
   * 3. Subscribing to override events
   */
  initialize: async () => {
    console.log('[InspectorStore] Initializing...');

    // Fetch registry
    set({ isRegistryLoading: true });
    try {
      const response = await window.scaffa.registry.get({});
      console.log('[InspectorStore] Loaded registry:', response.registry);
      set({ registry: response.registry, isRegistryLoading: false });
    } catch (error) {
      console.error('[InspectorStore] Failed to load registry:', error);
      set({ isRegistryLoading: false });
    }

    // Subscribe to selection changes
    window.scaffa.selection.onSelectionChanged((event) => {
      console.log('[InspectorStore] Selection changed:', event);
      set({ selectedInstance: event.selected });
    });

    // Subscribe to override changes
    window.scaffa.overrides.onOverridesChanged((event) => {
      console.log('[InspectorStore] Overrides changed:', event);
      set({ overrides: event.overrides });
    });
  },

  /**
   * Reset the inspector store.
   */
  reset: () => {
    set({
      selectedInstance: null,
      registry: null,
      isRegistryLoading: false,
      overrides: [],
    });
  },
}));
