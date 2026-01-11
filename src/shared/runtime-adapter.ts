import { z } from 'zod';
import {
  PreviewSessionIdSchema,
  InstanceDescriptorSchema,
  type PreviewSessionId,
  type InstanceDescriptor,
} from './preview-session.js';
import { OverrideOpSchema, type OverrideOp } from './override.js';

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Adapter Protocol (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/scaffa_runtime_adapter_contract.md

/**
 * Adapter identifier (e.g., "react", "nextjs-react").
 */
export const AdapterIdSchema = z.string().brand('AdapterId');
export type AdapterId = z.infer<typeof AdapterIdSchema>;

/**
 * Runtime adapter capabilities.
 */
export const RuntimeCapabilitiesSchema = z.object({
  selection: z.boolean(),
  overrides: z.boolean(),
});

export type RuntimeCapabilities = z.infer<typeof RuntimeCapabilitiesSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Runtime → Host Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emitted by runtime adapter when it's ready to receive commands.
 */
export const RuntimeReadyEventSchema = z.object({
  type: z.literal('runtime.ready'),
  adapterId: AdapterIdSchema,
  adapterVersion: z.string(),
  capabilities: RuntimeCapabilitiesSchema,
});

export type RuntimeReadyEvent = z.infer<typeof RuntimeReadyEventSchema>;

/**
 * Emitted by runtime adapter when selection changes (click-to-select).
 */
export const RuntimeSelectionChangedEventSchema = z.object({
  type: z.literal('runtime.selectionChanged'),
  sessionId: PreviewSessionIdSchema,
  selected: InstanceDescriptorSchema.nullable(),
  causedBy: z.enum(['click', 'programmatic']),
});

export type RuntimeSelectionChangedEvent = z.infer<
  typeof RuntimeSelectionChangedEventSchema
>;

/**
 * Union of all runtime → host events.
 */
export const RuntimeEventSchema = z.discriminatedUnion('type', [
  RuntimeReadyEventSchema,
  RuntimeSelectionChangedEventSchema,
]);

export type RuntimeEvent = z.infer<typeof RuntimeEventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Host → Runtime Commands
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent by host to runtime after runtime.ready to initialize the session.
 */
export const HostInitCommandSchema = z.object({
  type: z.literal('host.init'),
  sessionId: PreviewSessionIdSchema,
  initialOverrides: z.array(OverrideOpSchema),
});

export type HostInitCommand = z.infer<typeof HostInitCommandSchema>;

/**
 * Sent by host to runtime to apply override operations.
 */
export const HostApplyOverridesCommandSchema = z.object({
  type: z.literal('host.applyOverrides'),
  sessionId: PreviewSessionIdSchema,
  ops: z.array(OverrideOpSchema),
});

export type HostApplyOverridesCommand = z.infer<typeof HostApplyOverridesCommandSchema>;

/**
 * Union of all host → runtime commands.
 */
export const HostCommandSchema = z.discriminatedUnion('type', [
  HostInitCommandSchema,
  HostApplyOverridesCommandSchema,
]);

export type HostCommand = z.infer<typeof HostCommandSchema>;
