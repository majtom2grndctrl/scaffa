// ─────────────────────────────────────────────────────────────────────────────
// Runtime Transport Preload (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Minimal preload for preview runtime WebContents to enable runtime adapter transport.

import { contextBridge, ipcRenderer } from "electron";
import type { RuntimeEvent, HostCommand } from "../shared/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Transport API
// ─────────────────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld("skaffaRuntimeTransport", {
  /**
   * Send an event from runtime adapter to the host (main process).
   */
  sendToHost(event: RuntimeEvent): void {
    ipcRenderer.send("runtime:event", event);
  },

  /**
   * Receive commands from the host (main process).
   * Uses IPC listener instead of window globals to work with context isolation.
   */
  onCommand(callback: (command: HostCommand) => void): void {
    // Remove any existing listeners to avoid duplicates
    ipcRenderer.removeAllListeners("host:command");

    // Set up IPC listener for commands from host
    ipcRenderer.on("host:command", (_event, command: HostCommand) => {
      callback(command);
    });
  },
});
