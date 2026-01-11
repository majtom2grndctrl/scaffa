import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Types (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Defines workspace selection, persistence, and current workspace state.

/**
 * Absolute path to a workspace folder.
 */
export const WorkspacePathSchema = z.string().brand('WorkspacePath');

export type WorkspacePath = z.infer<typeof WorkspacePathSchema>;

/**
 * Workspace metadata.
 */
export const WorkspaceInfoSchema = z.object({
  path: WorkspacePathSchema,
  name: z.string(),
  lastOpened: z.string().datetime().optional(),
});

export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// IPC Request/Response Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request to select a workspace folder via native folder chooser.
 */
export const SelectWorkspaceRequestSchema = z.object({});

export type SelectWorkspaceRequest = z.infer<typeof SelectWorkspaceRequestSchema>;

/**
 * Response with selected workspace, or null if cancelled.
 */
export const SelectWorkspaceResponseSchema = z.object({
  workspace: WorkspaceInfoSchema.nullable(),
});

export type SelectWorkspaceResponse = z.infer<typeof SelectWorkspaceResponseSchema>;

/**
 * Request to get the current workspace.
 */
export const GetWorkspaceRequestSchema = z.object({});

export type GetWorkspaceRequest = z.infer<typeof GetWorkspaceRequestSchema>;

/**
 * Response with current workspace, or null if none selected.
 */
export const GetWorkspaceResponseSchema = z.object({
  workspace: WorkspaceInfoSchema.nullable(),
});

export type GetWorkspaceResponse = z.infer<typeof GetWorkspaceResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Event emitted when the workspace changes.
 */
export const WorkspaceChangedEventSchema = z.object({
  workspace: WorkspaceInfoSchema.nullable(),
});

export type WorkspaceChangedEvent = z.infer<typeof WorkspaceChangedEventSchema>;
