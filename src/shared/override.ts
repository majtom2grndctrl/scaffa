import { z } from "zod";
import {
  PreviewSessionIdSchema,
  InstanceIdSchema,
  ComponentTypeIdSchema,
  type PreviewSessionId,
  type InstanceId,
} from "./preview-session.js";
import { JsonValueSchema, type JsonValue } from "./common.js";

// ─────────────────────────────────────────────────────────────────────────────
// Override Model (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/skaffa_override_model.md

/**
 * JSON Pointer path (RFC 6901).
 * Example: "/variant" or "/children/0/text"
 */
export const PropPathSchema = z.string().brand("PropPath");
export type PropPath = z.infer<typeof PropPathSchema>;

/**
 * Runtime reference to an instance (session-scoped).
 */
export const InstanceRefSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
});

export type InstanceRef = z.infer<typeof InstanceRefSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Override Operations
// ─────────────────────────────────────────────────────────────────────────────

export const OverrideOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set"),
    instanceId: InstanceIdSchema,
    path: PropPathSchema,
    value: JsonValueSchema,
    componentTypeId: ComponentTypeIdSchema.optional(),
    instanceLocator: JsonValueSchema.optional(),
  }),
  z.object({
    op: z.literal("clear"),
    instanceId: InstanceIdSchema,
    path: PropPathSchema,
  }),
  z.object({
    op: z.literal("clearInstance"),
    instanceId: InstanceIdSchema,
  }),
  z.object({
    op: z.literal("clearAll"),
  }),
]);

export type OverrideOp = z.infer<typeof OverrideOpSchema>;

export const OverridePatchSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  ops: z.array(OverrideOpSchema),
});

export type OverridePatch = z.infer<typeof OverridePatchSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Persisted Override Format (v0)
// ─────────────────────────────────────────────────────────────────────────────

export const PersistedOverrideSchema = z.object({
  instanceId: z.string(),
  path: z.string(),
  value: JsonValueSchema,
  componentTypeId: z.string().optional(),
  instanceLocator: JsonValueSchema.optional(),
});

export type PersistedOverride = z.infer<typeof PersistedOverrideSchema>;

export const PersistedOverridesFileSchema = z.object({
  schemaVersion: z.literal("v0"),
  updatedAt: z.string().datetime(),
  app: z
    .object({
      overrides: z.array(PersistedOverrideSchema),
    })
    .optional(),
  component: z
    .object({
      overrides: z.array(PersistedOverrideSchema),
    })
    .optional(),
});

export type PersistedOverridesFile = z.infer<
  typeof PersistedOverridesFileSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// Override State Events
// ─────────────────────────────────────────────────────────────────────────────

export const OverridesChangedEventSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  overrides: z.array(PersistedOverrideSchema),
});

export type OverridesChangedEvent = z.infer<typeof OverridesChangedEventSchema>;
