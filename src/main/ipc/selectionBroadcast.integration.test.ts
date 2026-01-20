/**
 * Selection Broadcast Integration Tests (Main Process)
 *
 * These tests verify the main process selection broadcasting:
 *
 *   Session Manager → broadcastSelectionChanged → IPC to all windows
 *
 * This is the critical bridge that was previously missing (TODO was commented out).
 * Now that it's enabled, these tests verify the broadcast works correctly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PreviewSessionId, InstanceDescriptor } from '../../shared/index.js';

// Mock Electron's BrowserWindow - must be at module level for vi.mock hoisting
vi.mock('electron', () => {
  const mockSend = vi.fn();
  return {
    BrowserWindow: {
      getAllWindows: vi.fn(() => [
        { webContents: { send: mockSend } },
      ]),
      // Expose mock for test access
      _mockSend: mockSend,
    },
  };
});

// Mock the validation function to pass through events
vi.mock('../../main/ipc/validation.js', () => ({
  validateEvent: vi.fn((schema, event) => event),
}));

// Import modules after mocks
import { BrowserWindow } from 'electron';
import { broadcastSelectionChanged } from '../../main/ipc/selection.js';

describe('Selection Broadcast - Main Process (Integration)', () => {
  const mockSend = (BrowserWindow as any)._mockSend;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * WORKFLOW: Runtime emits selection → Main broadcasts to renderer
   *
   * This is the core selection flow that was previously broken (TODO was commented out).
   * The broadcastSelectionChanged function should send the selection event to all
   * renderer windows via IPC.
   */
  it('should broadcast selection changed event to renderer windows', () => {
    const sessionId = 'session_abc123' as PreviewSessionId;
    const selected: InstanceDescriptor = {
      sessionId,
      instanceId: 'inst_button_0' as any,
      componentTypeId: 'demo.button' as any,
      displayName: 'Primary Button',
      instanceLocator: { kind: 'renderIndex', index: 0 },
      props: {
        label: 'Click me',
        variant: 'primary',
      },
    };

    // Call the broadcast function (this is what session manager now calls)
    broadcastSelectionChanged({ sessionId, selected });

    // VERIFY: Event was sent to renderer via IPC
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith('selection:changed', {
      sessionId,
      selected,
    });
  });

  /**
   * WORKFLOW: Deselection (clicking empty area) → Main broadcasts null selection
   *
   * When user clicks outside any selectable element, the runtime emits a null
   * selection. This should be broadcast to the renderer to clear the Inspector.
   */
  it('should broadcast null selection when user deselects', () => {
    const sessionId = 'session_xyz789' as PreviewSessionId;

    broadcastSelectionChanged({ sessionId, selected: null });

    expect(mockSend).toHaveBeenCalledWith('selection:changed', {
      sessionId,
      selected: null,
    });
  });

  /**
   * WORKFLOW: Broadcast with complete instance data
   *
   * Verify that all instance descriptor fields are preserved in the broadcast.
   */
  it('should preserve complete instance descriptor in broadcast', () => {
    const sessionId = 'session_full' as PreviewSessionId;
    const selected: InstanceDescriptor = {
      sessionId,
      instanceId: 'inst_complex_0' as any,
      componentTypeId: 'ui.complex-component' as any,
      displayName: 'Complex Component',
      instanceLocator: {
        kind: 'renderIndex',
        index: 2,
      },
      props: {
        title: 'Hello World',
        variant: 'primary',
        disabled: false,
        count: 42,
        nested: { key: 'value' },
      },
    };

    broadcastSelectionChanged({ sessionId, selected });

    const broadcastedEvent = mockSend.mock.calls[0][1];

    // VERIFY: All fields are preserved
    expect(broadcastedEvent.sessionId).toBe(sessionId);
    expect(broadcastedEvent.selected.instanceId).toBe('inst_complex_0');
    expect(broadcastedEvent.selected.componentTypeId).toBe('ui.complex-component');
    expect(broadcastedEvent.selected.displayName).toBe('Complex Component');
    expect(broadcastedEvent.selected.instanceLocator).toEqual({
      kind: 'renderIndex',
      index: 2,
    });
    expect(broadcastedEvent.selected.props).toEqual({
      title: 'Hello World',
      variant: 'primary',
      disabled: false,
      count: 42,
      nested: { key: 'value' },
    });
  });

  /**
   * WORKFLOW: IPC channel name is correct
   *
   * The renderer listens on 'selection:changed' - verify the broadcast uses
   * this exact channel name.
   */
  it('should broadcast on the correct IPC channel', () => {
    const sessionId = 'session_channel_test' as PreviewSessionId;

    broadcastSelectionChanged({ sessionId, selected: null });

    // VERIFY: Correct channel name
    expect(mockSend.mock.calls[0][0]).toBe('selection:changed');
  });
});

describe('Selection Broadcast - Multi-Window Support (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * WORKFLOW: Multiple windows → Broadcast reaches all
   *
   * If multiple workbench windows are open, all should receive the selection event.
   * This ensures Inspector panels in all windows stay synchronized.
   */
  it('should broadcast selection to all open windows', () => {
    const firstWindowSend = vi.fn();
    const secondWindowSend = vi.fn();

    (BrowserWindow.getAllWindows as any).mockReturnValueOnce([
      { webContents: { send: firstWindowSend } },
      { webContents: { send: secondWindowSend } },
    ]);

    const sessionId = 'session_multi' as PreviewSessionId;
    const selected: InstanceDescriptor = {
      sessionId,
      instanceId: 'inst_card_0' as any,
      componentTypeId: 'demo.card' as any,
      displayName: 'Welcome Card',
    };

    broadcastSelectionChanged({ sessionId, selected });

    // VERIFY: Both windows received the event
    expect(firstWindowSend).toHaveBeenCalledTimes(1);
    expect(secondWindowSend).toHaveBeenCalledTimes(1);

    expect(firstWindowSend).toHaveBeenCalledWith('selection:changed', {
      sessionId,
      selected,
    });
    expect(secondWindowSend).toHaveBeenCalledWith('selection:changed', {
      sessionId,
      selected,
    });
  });

  /**
   * WORKFLOW: No windows open → No error
   *
   * Handle edge case where broadcast is called but no windows exist.
   */
  it('should handle broadcast when no windows are open', () => {
    (BrowserWindow.getAllWindows as any).mockReturnValueOnce([]);

    const sessionId = 'session_no_windows' as PreviewSessionId;

    // Should not throw
    expect(() => {
      broadcastSelectionChanged({ sessionId, selected: null });
    }).not.toThrow();
  });
});
