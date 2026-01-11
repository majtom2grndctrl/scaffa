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
    url: z.string().url().optional(),
    launcherId: z.string().optional(),
    launcherOptions: z.record(z.unknown()).optional(),
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
]).refine(
  (data) => {
    // For app sessions, either url or launcherId must be provided (but not both)
    if (data.type === 'app') {
      return (data.url && !data.launcherId) || (!data.url && data.launcherId);
    }
    return true;
  },
  {
    message: 'App sessions must have either url (attached) or launcherId (managed), not both',
  }
);

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

// ─────────────────────────────────────────────────────────────────────────────
// Preview Launchers (Managed Sessions)
// ─────────────────────────────────────────────────────────────────────────────

export const PreviewLauncherIdSchema = z.string().brand('PreviewLauncherId');
export type PreviewLauncherId = z.infer<typeof PreviewLauncherIdSchema>;

/**
 * Preview launcher options.
 * Extensible per-launcher configuration (e.g. port, environment variables).
 */
export const PreviewLauncherOptionsSchema = z.record(z.unknown());
export type PreviewLauncherOptions = z.infer<typeof PreviewLauncherOptionsSchema>;

/**
 * Result of starting a managed preview.
 */
export const PreviewLaunchResultSchema = z.object({
  /**
   * The URL where the preview is running.
   */
  url: z.string().url(),

  /**
   * Optional process ID for the launched runtime.
   */
  pid: z.number().optional(),
});

export type PreviewLaunchResult = z.infer<typeof PreviewLaunchResultSchema>;

/**
 * Log entry from a managed preview process.
 */
export const PreviewLogEntrySchema = z.object({
  /**
   * Log level.
   */
  level: z.enum(['info', 'warn', 'error', 'debug']),

  /**
   * Log message.
   */
  message: z.string(),

  /**
   * Timestamp (ISO 8601).
   */
  timestamp: z.string(),
});

export type PreviewLogEntry = z.infer<typeof PreviewLogEntrySchema>;

/**
 * Preview launcher descriptor (contributed by modules).
 */
export const PreviewLauncherDescriptorSchema = z.object({
  /**
   * Unique launcher ID (e.g. "vite-react", "next-dev").
   */
  id: PreviewLauncherIdSchema,

  /**
   * Display name for UI.
   */
  displayName: z.string(),

  /**
   * Optional description.
   */
  description: z.string().optional(),

  /**
   * Supported session types (e.g. ["app"]).
   */
  supportedSessionTypes: z.array(PreviewSessionTypeSchema),
});

export type PreviewLauncherDescriptor = z.infer<typeof PreviewLauncherDescriptorSchema>;
