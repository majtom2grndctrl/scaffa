#!/usr/bin/env node

// ─────────────────────────────────────────────────────────────────────────────
// Extension Host Process Entry Point (v0)
// ─────────────────────────────────────────────────────────────────────────────
// This process runs all extension modules in isolation from the main process.

import type {
  MainToExtHostMessage,
  ExtHostToMainMessage,
  InitMessage,
  ConfigChangedMessage,
  StartPreviewLauncherMessage,
  StopPreviewLauncherMessage,
  PromoteOverridesMessage,
} from './ipc-protocol.js';
import { ModuleLoader } from './module-loader.js';
import type { SkaffaConfig } from '../shared/config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Extension Host State
// ─────────────────────────────────────────────────────────────────────────────

let moduleLoader: ModuleLoader | null = null;
let isInitialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// IPC Communication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send message to main process.
 */
function sendToMain(message: ExtHostToMainMessage): void {
  if (!process.send) {
    console.error('[ExtHost] Cannot send message: process.send is not available');
    return;
  }
  process.send(message);
}

/**
 * Handle incoming message from main process.
 */
function handleMessage(message: MainToExtHostMessage): void {
  switch (message.type) {
    case 'init':
      handleInit(message);
      break;

    case 'config-changed':
      handleConfigChanged(message);
      break;

    case 'shutdown':
      handleShutdown();
      break;

    case 'start-preview-launcher':
      handleStartPreviewLauncher(message);
      break;

    case 'stop-preview-launcher':
      handleStopPreviewLauncher(message);
      break;

    case 'promote-overrides':
      handlePromoteOverrides(message);
      break;

    default:
      console.warn('[ExtHost] Unknown message type:', (message as any).type);
  }
}

/**
 * Initialize the extension host with workspace and config.
 */
async function handleInit(message: InitMessage): Promise<void> {
  if (isInitialized) {
    console.warn('[ExtHost] Already initialized, ignoring init message');
    return;
  }

  try {
    console.log('[ExtHost] Initializing...');
    console.log('[ExtHost] Workspace:', message.workspacePath ?? '(none)');
    console.log('[ExtHost] Modules:', message.config.modules?.length ?? 0);

    moduleLoader = new ModuleLoader(message.workspacePath, message.config);
    await moduleLoader.loadAndActivateModules();

    isInitialized = true;
    sendToMain({ type: 'ready' });
    console.log('[ExtHost] Ready');
  } catch (error) {
    console.error('[ExtHost] Initialization failed:', error);
    sendToMain({
      type: 'error',
      error: {
        code: 'INIT_FAILED',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
}

/**
 * Handle config change.
 */
async function handleConfigChanged(message: ConfigChangedMessage): Promise<void> {
  if (!isInitialized || !moduleLoader) {
    console.warn('[ExtHost] Not initialized, ignoring config-changed message');
    return;
  }

  try {
    console.log('[ExtHost] Config changed, reloading modules...');
    await moduleLoader.reload(message.config);
    console.log('[ExtHost] Modules reloaded');
  } catch (error) {
    console.error('[ExtHost] Config reload failed:', error);
    sendToMain({
      type: 'error',
      error: {
        code: 'CONFIG_RELOAD_FAILED',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
}

/**
 * Shutdown the extension host gracefully.
 */
async function handleShutdown(): Promise<void> {
  console.log('[ExtHost] Shutting down...');

  if (moduleLoader) {
    await moduleLoader.deactivateAll();
    moduleLoader = null;
  }

  isInitialized = false;
  process.exit(0);
}

/**
 * Handle start preview launcher request.
 */
async function handleStartPreviewLauncher(message: StartPreviewLauncherMessage): Promise<void> {
  if (!isInitialized || !moduleLoader) {
    console.warn('[ExtHost] Not initialized, ignoring start-preview-launcher message');
    sendToMain({
      type: 'preview-launcher-error',
      requestId: message.requestId,
      launcherId: message.launcherId,
      error: {
        code: 'NOT_INITIALIZED',
        message: 'Extension host not initialized',
      },
    });
    return;
  }

  await moduleLoader.startPreviewLauncher(
    message.launcherId,
    message.options,
    message.requestId
  );
}

/**
 * Handle stop preview launcher request.
 */
async function handleStopPreviewLauncher(message: StopPreviewLauncherMessage): Promise<void> {
  if (!isInitialized || !moduleLoader) {
    console.warn('[ExtHost] Not initialized, ignoring stop-preview-launcher message');
    sendToMain({
      type: 'preview-launcher-error',
      requestId: message.requestId,
      launcherId: message.launcherId,
      error: {
        code: 'NOT_INITIALIZED',
        message: 'Extension host not initialized',
      },
    });
    return;
  }

  await moduleLoader.stopPreviewLauncher(message.launcherId, message.requestId);
}

/**
 * Handle promote overrides request.
 */
async function handlePromoteOverrides(message: PromoteOverridesMessage): Promise<void> {
  if (!isInitialized || !moduleLoader) {
    console.warn('[ExtHost] Not initialized, ignoring promote-overrides message');
    sendToMain({
      type: 'promote-overrides-error',
      requestId: message.requestId,
      error: {
        code: 'NOT_INITIALIZED',
        message: 'Extension host not initialized',
      },
    });
    return;
  }

  try {
    const result = await moduleLoader.promoteOverrides(message.overrides);
    sendToMain({
      type: 'promote-overrides-result',
      requestId: message.requestId,
      result,
    });
  } catch (error) {
    sendToMain({
      type: 'promote-overrides-error',
      requestId: message.requestId,
      error: {
        code: 'PROMOTION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

// Listen for messages from main process
process.on('message', (message: MainToExtHostMessage) => {
  handleMessage(message);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('[ExtHost] Uncaught exception:', error);
  sendToMain({
    type: 'error',
    error: {
      code: 'UNCAUGHT_EXCEPTION',
      message: error.message,
      stack: error.stack,
    },
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[ExtHost] Unhandled rejection:', reason);
  sendToMain({
    type: 'error',
    error: {
      code: 'UNHANDLED_REJECTION',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    },
  });
});

// Notify main that we're alive and waiting for init
console.log('[ExtHost] Process started, waiting for init...');
