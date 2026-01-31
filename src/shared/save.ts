import { z } from 'zod';
import {
  PreviewSessionIdSchema,
  InstanceIdSchema,
  ComponentTypeIdSchema,
} from './preview-session.js';
import { JsonValueSchema } from './common.js';
import { FileEditSchema } from './workspace-edits.js';

// ─────────────────────────────────────────────────────────────────────────────
// Save-to-Disk Types (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/skaffa_save_to_disk_protocol.md

export const DraftOverrideAddressSchema = z.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: z.string(),
});

export type DraftOverrideAddress = z.infer<typeof DraftOverrideAddressSchema>;

export const DraftOverrideSchema = DraftOverrideAddressSchema.extend({
  value: JsonValueSchema,
  componentTypeId: ComponentTypeIdSchema.optional(),
  instanceLocator: JsonValueSchema.optional(),
});

export type DraftOverride = z.infer<typeof DraftOverrideSchema>;

export const ValidationResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    code: z.enum([
      'unpromotable',
      'notFound',
      'unsupportedPattern',
      'internalError',
    ]),
    message: z.string(),
  }),
]);

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const SaveFailureSchema = z.object({
  address: DraftOverrideAddressSchema,
  result: ValidationResultSchema,
});

export type SaveFailure = z.infer<typeof SaveFailureSchema>;

export const SavePlanSchema = z.object({
  edits: z.array(FileEditSchema),
  failed: z.array(SaveFailureSchema),
});

export type SavePlan = z.infer<typeof SavePlanSchema>;

export const SaveResultSchema = z.object({
  ok: z.boolean(),
  appliedCount: z.number().int().nonnegative(),
  failed: z.array(SaveFailureSchema),
});

export type SaveResult = z.infer<typeof SaveResultSchema>;
