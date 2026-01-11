import { z } from 'zod';
import { ComponentTypeIdSchema } from './preview-session.js';
import { JsonValueSchema } from './common.js';

// ─────────────────────────────────────────────────────────────────────────────
// Component Registry Schema (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Defines the canonical schema for component metadata.
// See: docs/scaffa_component_registry_schema.md

export type ComponentTypeId = z.infer<typeof ComponentTypeIdSchema>;
export type JsonValue = z.infer<typeof JsonValueSchema>;

export const InspectorGroupIdSchema = z.string();
export type InspectorGroupId = z.infer<typeof InspectorGroupIdSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Control Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const ControlDefinitionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('string'),
    placeholder: z.string().optional(),
    multiline: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('number'),
    step: z.number().optional(),
    unit: z.string().optional(),
  }),
  z.object({
    kind: z.literal('boolean'),
  }),
  z.object({
    kind: z.literal('select'),
    options: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })
    ),
  }),
  z.object({
    kind: z.literal('color'),
    format: z.enum(['hex', 'rgb', 'hsl']).optional(),
  }),
  z.object({
    kind: z.literal('slot'),
    slotName: z.string().optional(),
    editable: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('json'),
  }),
]);

export type ControlDefinition = z.infer<typeof ControlDefinitionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Prop Exposure
// ─────────────────────────────────────────────────────────────────────────────

export const PropExposureSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('editable'),
    control: ControlDefinitionSchema,
    uiDefaultValue: JsonValueSchema.optional(),
    constraints: z
      .object({
        required: z.boolean().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    kind: z.literal('inspectOnly'),
    displayHint: z.enum(['summary', 'json', 'code']).optional(),
  }),
  z.object({
    kind: z.literal('opaque'),
    reason: z.string().optional(),
  }),
]);

export type PropExposure = z.infer<typeof PropExposureSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Prop Definition
// ─────────────────────────────────────────────────────────────────────────────

export const PropDefinitionSchema = z.object({
  propName: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  group: InspectorGroupIdSchema.optional(),
  order: z.number().optional(),
  exposure: PropExposureSchema,
});

export type PropDefinition = z.infer<typeof PropDefinitionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Component Registry Entry
// ─────────────────────────────────────────────────────────────────────────────

export const ComponentRegistryEntrySchema = z.object({
  typeId: ComponentTypeIdSchema,
  displayName: z.string(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  props: z.record(PropDefinitionSchema),
});

export type ComponentRegistryEntry = z.infer<typeof ComponentRegistryEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Component Registry
// ─────────────────────────────────────────────────────────────────────────────

export const ComponentRegistrySchema = z.object({
  schemaVersion: z.literal('v0'),
  components: z.record(ComponentTypeIdSchema, ComponentRegistryEntrySchema),
});

export type ComponentRegistry = z.infer<typeof ComponentRegistrySchema>;
