import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { useInspectorStore } from "./inspectorStore";
import type {
  ComponentRegistry,
  InstanceDescriptor,
} from "../../shared/index.js";

// Capture subscription callbacks for testing
let selectionCallback: ((event: any) => void) | null = null;
let overrideCallback: ((event: any) => void) | null = null;

const mockGet = vi.fn();
const mockGetSections = vi.fn();
const mockOnSelectionChanged = vi.fn((cb) => {
  selectionCallback = cb;
});
const mockOnOverridesChanged = vi.fn((cb) => {
  overrideCallback = cb;
});

const skaffaApi = {
  registry: { get: mockGet },
  inspector: { getSections: mockGetSections },
  selection: { onSelectionChanged: mockOnSelectionChanged },
  overrides: { onOverridesChanged: mockOnOverridesChanged },
};

describe("inspectorStore - Real Lifecycle Tests", () => {
  beforeAll(() => {
    if (!globalThis.window) {
      (globalThis as any).window = {};
    }
    (globalThis.window as any).skaffa = skaffaApi;
  });

  afterAll(() => {
    delete (globalThis.window as any).skaffa;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    selectionCallback = null;
    overrideCallback = null;
    // Default mock return for inspector sections
    mockGetSections.mockResolvedValue({ sections: [] });
  });

  afterEach(() => {
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

  it("should fetch and cache component registry on initialization", async () => {
    const mockRegistry: ComponentRegistry = {
      schemaVersion: "v0",
      components: {
        "ui.button": {
          displayName: "Button",
          props: {
            variant: {
              propName: "variant",
              exposure: { kind: "editable", control: { kind: "string" } },
            },
          },
        },
      },
    };

    mockGet.mockResolvedValue({ registry: mockRegistry });

    await useInspectorStore.getState().initialize();

    // Verify IPC was called to fetch registry
    expect(mockGet).toHaveBeenCalledWith({});

    // Verify registry was stored
    const state = useInspectorStore.getState();
    expect(state.registry).toEqual(mockRegistry);
    expect(state.isInitialized).toBe(true);
    expect(state.isRegistryLoading).toBe(false);
  });

  it("should register selection change listener and update state when selection changes", async () => {
    mockGet.mockResolvedValue({
      registry: { schemaVersion: "v0", components: {} },
    });

    await useInspectorStore.getState().initialize();

    // Verify selection listener was registered
    expect(mockOnSelectionChanged).toHaveBeenCalled();
    expect(selectionCallback).not.toBeNull();

    // Simulate selection change from extension host
    const newSelection: InstanceDescriptor = {
      sessionId: "preview-session-1",
      instanceId: "button-instance-42",
      componentTypeId: "ui.button",
      instanceLocator: { type: "instancePath", path: "/app/page/button[0]" },
      displayName: "Submit Button",
      props: { variant: "primary", disabled: false },
    } as any;

    selectionCallback!({ selected: newSelection });

    // Verify store was updated
    expect(useInspectorStore.getState().selectedInstance).toEqual(newSelection);
  });

  it("should register override change listener and update state when overrides change", async () => {
    mockGet.mockResolvedValue({
      registry: { schemaVersion: "v0", components: {} },
    });

    await useInspectorStore.getState().initialize();

    // Verify override listener was registered
    expect(mockOnOverridesChanged).toHaveBeenCalled();
    expect(overrideCallback).not.toBeNull();

    // Simulate override changes from extension host
    const newOverrides = [
      {
        sessionId: "preview-session-1",
        instanceId: "button-instance-42",
        path: "/variant",
        value: "secondary",
      },
      {
        sessionId: "preview-session-1",
        instanceId: "button-instance-42",
        path: "/disabled",
        value: true,
      },
    ] as any;

    overrideCallback!({ overrides: newOverrides });

    // Verify store was updated
    expect(useInspectorStore.getState().overrides).toEqual(newOverrides);
  });

  it("should handle deselection (null selection)", async () => {
    mockGet.mockResolvedValue({
      registry: { schemaVersion: "v0", components: {} },
    });

    await useInspectorStore.getState().initialize();

    // Set a selection first
    const selection: InstanceDescriptor = {
      sessionId: "session-1",
      instanceId: "instance-1",
      componentTypeId: "ui.button",
      instanceLocator: { type: "instancePath", path: "/app/button[0]" },
    } as any;

    selectionCallback!({ selected: selection });
    expect(useInspectorStore.getState().selectedInstance).toEqual(selection);

    // Now deselect
    selectionCallback!({ selected: null });
    expect(useInspectorStore.getState().selectedInstance).toBeNull();
  });

  it("should handle clearing all overrides", async () => {
    mockGet.mockResolvedValue({
      registry: { schemaVersion: "v0", components: {} },
    });

    await useInspectorStore.getState().initialize();

    // Set some overrides first
    overrideCallback!({
      overrides: [
        { sessionId: "s1", instanceId: "i1", path: "/prop1", value: "val1" },
      ] as any,
    });
    expect(useInspectorStore.getState().overrides.length).toBe(1);

    // Clear all overrides
    overrideCallback!({ overrides: [] });
    expect(useInspectorStore.getState().overrides).toEqual([]);
  });

  it("should refresh registry without re-subscribing to events", async () => {
    const initialRegistry: ComponentRegistry = {
      schemaVersion: "v0",
      components: { "ui.button": { displayName: "Button", props: {} } },
    };

    const updatedRegistry: ComponentRegistry = {
      schemaVersion: "v0",
      components: {
        "ui.button": { displayName: "Button", props: {} },
        "ui.input": { displayName: "Input", props: {} },
      },
    };

    mockGet.mockResolvedValueOnce({ registry: initialRegistry });
    await useInspectorStore.getState().initialize();

    const initialCallCount = mockOnSelectionChanged.mock.calls.length;

    // Refresh with new registry
    mockGet.mockResolvedValueOnce({ registry: updatedRegistry });
    await useInspectorStore.getState().refresh();

    // Verify registry was updated
    expect(useInspectorStore.getState().registry).toEqual(updatedRegistry);

    // Verify we didn't re-subscribe (call count should be the same)
    expect(mockOnSelectionChanged.mock.calls.length).toBe(initialCallCount);
  });

  it("should reset inspector state while preserving initialization flag", async () => {
    mockGet.mockResolvedValue({
      registry: { schemaVersion: "v0", components: {} },
    });
    await useInspectorStore.getState().initialize();

    // Set some state
    selectionCallback!({
      selected: {
        sessionId: "s1",
        instanceId: "i1",
        componentTypeId: "ui.button",
        instanceLocator: { type: "instancePath", path: "/button" },
      } as any,
    });

    overrideCallback!({
      overrides: [
        {
          sessionId: "s1",
          instanceId: "i1",
          path: "/variant",
          value: "primary",
        },
      ] as any,
    });

    // Reset
    useInspectorStore.getState().reset();

    const state = useInspectorStore.getState();
    expect(state.selectedInstance).toBeNull();
    expect(state.registry).toBeNull();
    expect(state.overrides).toEqual([]);
    // Note: isInitialized is intentionally not reset to prevent re-subscription
  });
});
