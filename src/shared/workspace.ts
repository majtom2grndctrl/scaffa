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

/**
 * Workspace open error details.
 */
export const WorkspaceOpenErrorSchema = z.object({
  code: z.enum([
    'NOT_FOUND',
    'NOT_A_DIRECTORY',
    'INVALID_SYNTAX',
    'VALIDATION_ERROR',
    'UNKNOWN_ERROR',
    'DEMO_NOT_FOUND',
  ]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type WorkspaceOpenError = z.infer<typeof WorkspaceOpenErrorSchema>;

/**
 * Workspace open response.
 */
export const WorkspaceOpenResponseSchema = z.object({
  workspace: WorkspaceInfoSchema.nullable(),
  error: WorkspaceOpenErrorSchema.nullable(),
});

export type WorkspaceOpenResponse = z.infer<typeof WorkspaceOpenResponseSchema>;

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
export const SelectWorkspaceResponseSchema = WorkspaceOpenResponseSchema;

export type SelectWorkspaceResponse = WorkspaceOpenResponse;

/**
 * Request to get recent workspaces.
 */
export const GetRecentWorkspacesRequestSchema = z.object({});

export type GetRecentWorkspacesRequest = z.infer<
  typeof GetRecentWorkspacesRequestSchema
>;

/**
 * Response with recent workspaces.
 */
export const GetRecentWorkspacesResponseSchema = z.object({
  recents: z.array(WorkspaceInfoSchema),
});

export type GetRecentWorkspacesResponse = z.infer<
  typeof GetRecentWorkspacesResponseSchema
>;

/**
 * Request to open a recent workspace.
 */
export const OpenRecentWorkspaceRequestSchema = z.object({
  path: WorkspacePathSchema,
});

export type OpenRecentWorkspaceRequest = z.infer<
  typeof OpenRecentWorkspaceRequestSchema
>;

/**
 * Response from opening a recent workspace.
 */
export const OpenRecentWorkspaceResponseSchema = WorkspaceOpenResponseSchema;

export type OpenRecentWorkspaceResponse = WorkspaceOpenResponse;

/**
 * Request to remove a recent workspace.
 */
export const RemoveRecentWorkspaceRequestSchema = z.object({
  path: WorkspacePathSchema,
});

export type RemoveRecentWorkspaceRequest = z.infer<
  typeof RemoveRecentWorkspaceRequestSchema
>;

/**
 * Response with updated recent workspaces.
 */
export const RemoveRecentWorkspaceResponseSchema = z.object({
  recents: z.array(WorkspaceInfoSchema),
});

export type RemoveRecentWorkspaceResponse = z.infer<
  typeof RemoveRecentWorkspaceResponseSchema
>;

/**
 * Request to open the demo workspace.
 */
export const OpenDemoWorkspaceRequestSchema = z.object({});

export type OpenDemoWorkspaceRequest = z.infer<
  typeof OpenDemoWorkspaceRequestSchema
>;

/**
 * Response from opening the demo workspace.
 */
export const OpenDemoWorkspaceResponseSchema = WorkspaceOpenResponseSchema;

export type OpenDemoWorkspaceResponse = WorkspaceOpenResponse;

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
