import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Preview Session Protocol (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/scaffa_preview_session_protocol.md

export const PreviewSessionIdSchema = z.string().brand('PreviewSessionId');
export type PreviewSessionId = z.infer<typeof PreviewSessionIdSchema>;

export const PreviewSessionTypeSchema = z.enum(['app', 'component', 'variant']);
export type PreviewSessionType = z.infer<typeof PreviewSessionTypeSchema>;

export const PreviewSessionTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('app'),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal('component'),
    componentTypeId: z.string(),
    harnessUrl: z.string().url().optional(),
  }),
  z.object({
    type: z.literal('variant'),
    variantId: z.string(),
  }),
]);

export type PreviewSessionTarget = z.infer<typeof PreviewSessionTargetSchema>;

export const PreviewSessionStateSchema = z.enum([
  'creating',
  'loading',
  'ready',
  'reloading',
  'stopped',
  'disposed',
  'error',
]);

export type PreviewSessionState = z.infer<typeof PreviewSessionStateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Instance Descriptor (Selection)
// ─────────────────────────────────────────────────────────────────────────────

export const InstanceIdSchema = z.string().brand('InstanceId');
export type InstanceId = z.infer<typeof InstanceIdSchema>;

export const ComponentTypeIdSchema = z.string().brand('ComponentTypeId');
export type ComponentTypeId = z.infer<typeof ComponentTypeIdSchema>;

export const InstanceDescriptorSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  componentTypeId: ComponentTypeIdSchema,
  displayName: z.string().optional(),
  props: z.record(z.unknown()).optional(),
});

export type InstanceDescriptor = z.infer<typeof InstanceDescriptorSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Session Lifecycle Events
// ─────────────────────────────────────────────────────────────────────────────

export const SessionCreatedEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  target: PreviewSessionTargetSchema,
});

export type SessionCreatedEvent = z.infer<typeof SessionCreatedEventSchema>;

export const SessionReadyEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  type: PreviewSessionTypeSchema,
});

export type SessionReadyEvent = z.infer<typeof SessionReadyEventSchema>;

export const SessionErrorEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  error: z.string(),
});

export type SessionErrorEvent = z.infer<typeof SessionErrorEventSchema>;

export const SessionStoppedEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
});

export type SessionStoppedEvent = z.infer<typeof SessionStoppedEventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Selection Events
// ─────────────────────────────────────────────────────────────────────────────

export const SelectionChangedEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  selected: InstanceDescriptorSchema.nullable(),
});

export type SelectionChangedEvent = z.infer<typeof SelectionChangedEventSchema>;
