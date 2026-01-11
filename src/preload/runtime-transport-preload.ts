// ─────────────────────────────────────────────────────────────────────────────
// Runtime Transport Preload (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Minimal preload for preview runtime WebContents to enable runtime adapter transport.

import { contextBridge, ipcRenderer } from 'electron';
import type { RuntimeEvent, HostCommand } from '../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Transport API
// ─────────────────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('scaffaRuntimeTransport', {
  /**
   * Send an event from runtime adapter to the host (main process).
   */
  sendToHost(event: RuntimeEvent): void {
    ipcRenderer.send('runtime:event', event);
  },

  /**
   * Receive commands from the host (main process).
   */
  onCommand(callback: (command: HostCommand) => void): void {
    // Store callback for host commands
    (window as any).__scaffaHostCommandCallback = callback;
  },
});

// Make the callback receiver available for executeJavaScript injection
(window as any).__scaffaHostCommand = (command: HostCommand) => {
  const callback = (window as any).__scaffaHostCommandCallback;
  if (callback) {
    callback(command);
  }
};
