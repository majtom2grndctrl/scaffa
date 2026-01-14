import { z } from 'zod';
import {
  PreviewSessionTargetSchema,
  PreviewSessionIdSchema,
  InstanceIdSchema,
  ComponentTypeIdSchema,
  PreviewLauncherDescriptorSchema,
} from './preview-session.js';
import { OverrideOpSchema, PropPathSchema } from './override.js';
import {
  GraphQuerySchema,
  GraphPatchSchema,
  GraphSnapshotSchema,
} from './project-graph.js';
import { JsonValueSchema } from './common.js';
import { SaveResultSchema } from './save.js';

// ─────────────────────────────────────────────────────────────────────────────
// IPC Request/Response Schemas (v0)
// ─────────────────────────────────────────────────────────────────────────────
// These define the payloads for window.scaffa.* APIs exposed via preload.

// ─────────────────────────────────────────────────────────────────────────────
// Preview APIs
// ─────────────────────────────────────────────────────────────────────────────

export const StartSessionRequestSchema = z.object({
  target: PreviewSessionTargetSchema,
});

export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;

export const StartSessionResponseSchema = z.object({
  sessionId: PreviewSessionIdSchema,
});

export type StartSessionResponse = z.infer<typeof StartSessionResponseSchema>;

export const StopSessionRequestSchema = z.object({
  sessionId: PreviewSessionIdSchema,
});

export type StopSessionRequest = z.infer<typeof StopSessionRequestSchema>;

export const GetLaunchersRequestSchema = z.object({});

export type GetLaunchersRequest = z.infer<typeof GetLaunchersRequestSchema>;

export const GetLaunchersResponseSchema = z.object({
  launchers: z.array(PreviewLauncherDescriptorSchema),
});

export type GetLaunchersResponse = z.infer<typeof GetLaunchersResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Override APIs
// ─────────────────────────────────────────────────────────────────────────────

export const SetOverrideRequestSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: PropPathSchema,
  value: JsonValueSchema,
  componentTypeId: ComponentTypeIdSchema.optional(),
  instanceLocator: JsonValueSchema.optional(),
});

export type SetOverrideRequest = z.infer<typeof SetOverrideRequestSchema>;

export const ClearOverrideRequestSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: PropPathSchema,
});

export type ClearOverrideRequest = z.infer<typeof ClearOverrideRequestSchema>;

export const ClearInstanceOverridesRequestSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
});

export type ClearInstanceOverridesRequest = z.infer<
  typeof ClearInstanceOverridesRequestSchema
>;

export const ClearAllOverridesRequestSchema = z.object({
  sessionId: PreviewSessionIdSchema,
});

export type ClearAllOverridesRequest = z.infer<typeof ClearAllOverridesRequestSchema>;

export const SaveOverridesRequestSchema = z.object({});

export type SaveOverridesRequest = z.infer<typeof SaveOverridesRequestSchema>;

export const SaveOverridesResponseSchema = SaveResultSchema;

export type SaveOverridesResponse = z.infer<typeof SaveOverridesResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph APIs
// ─────────────────────────────────────────────────────────────────────────────

export const GetGraphSnapshotRequestSchema = z.object({});

export type GetGraphSnapshotRequest = z.infer<typeof GetGraphSnapshotRequestSchema>;

export const GetGraphSnapshotResponseSchema = GraphSnapshotSchema;

export type GetGraphSnapshotResponse = z.infer<typeof GetGraphSnapshotResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Structured Error Response
// ─────────────────────────────────────────────────────────────────────────────

export const IpcErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type IpcError = z.infer<typeof IpcErrorSchema>;
