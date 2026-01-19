import { ipcMain } from 'electron';
import { validated } from './validation.js';
import { inspectorSectionRegistry } from '../inspector/inspector-section-registry.js';
import {
  GetInspectorSectionsRequestSchema,
  GetInspectorSectionsResponseSchema,
  type GetInspectorSectionsRequest,
  type GetInspectorSectionsResponse,
} from '../../shared/ipc.js';

// ─────────────────────────────────────────────────────────────────────────────
// Inspector IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register inspector IPC handlers.
 */
export function registerInspectorHandlers() {
  ipcMain.handle(
    'inspector:getSections',
    validated(
      GetInspectorSectionsRequestSchema,
      GetInspectorSectionsResponseSchema,
      async (
        _event,
        _request: GetInspectorSectionsRequest
      ): Promise<GetInspectorSectionsResponse> => {
        console.log('[IPC] inspector:getSections');
        const sections = inspectorSectionRegistry.getSections();
        return { sections };
      }
    )
  );
}
