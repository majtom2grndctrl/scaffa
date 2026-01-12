import { z } from 'zod';
import { ComponentTypeIdSchema } from './preview-session.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Config Schema (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Defines the shape of scaffa.config.ts project configuration.
// See: docs/scaffa_project_configuration_scaffa_config.md

/**
 * Module instance contributed to the project.
 * v0: Simple path-based loading. Future: factory functions + npm packages.
 */
export const ScaffaModuleSchema = z.object({
  id: z.string(),
  path: z.string().optional(),
  /**
   * Optional npm package specifier for package-based modules.
   * When provided, the extension host will resolve it using Node's module resolution
   * anchored at the workspace root (directory containing scaffa.config.*).
   *
   * Examples:
   * - "@scaffa/module-react-router"
   * - "./relative-package" (workspace local via package.json "name")
   */
  package: z.string().optional(),
  // Module contributions are resolved at runtime by the extension host
  contributions: z.unknown().optional(),
});

export type ScaffaModule = z.infer<typeof ScaffaModuleSchema>;

/**
 * Preview decorator function (opaque at config layer).
 */
export const PreviewDecoratorSchema = z.unknown();

export type PreviewDecorator = z.infer<typeof PreviewDecoratorSchema>;

/**
 * Preview configuration.
 */
export const PreviewConfigSchema = z.object({
  decorators: z.array(PreviewDecoratorSchema).optional(),
  environment: z.record(z.unknown()).optional(),
});

export type PreviewConfig = z.infer<typeof PreviewConfigSchema>;

/**
 * Control definition override for a prop.
 */
export const ControlOverrideSchema = z.object({
  kind: z.enum(['string', 'number', 'boolean', 'select', 'color', 'slot', 'json']).optional(),
  // Additional control-specific options can be partially overridden
  options: z.unknown().optional(),
});

export type ControlOverride = z.infer<typeof ControlOverrideSchema>;

/**
 * Prop exposure override.
 */
export const PropExposureOverrideSchema = z.object({
  kind: z.enum(['editable', 'inspectOnly', 'opaque']).optional(),
  control: ControlOverrideSchema.optional(),
  uiDefaultValue: z.unknown().optional(),
});

export type PropExposureOverride = z.infer<typeof PropExposureOverrideSchema>;

/**
 * Prop-level override.
 */
export const PropOverrideSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  group: z.string().optional(),
  order: z.number().optional(),
  exposure: PropExposureOverrideSchema.optional(),
});

export type PropOverride = z.infer<typeof PropOverrideSchema>;

/**
 * Component-level override.
 */
export const ComponentOverrideSchema = z.object({
  disabled: z.boolean().optional(),
  displayName: z.string().optional(),
  props: z.record(PropOverrideSchema).optional(),
});

export type ComponentOverride = z.infer<typeof ComponentOverrideSchema>;

/**
 * Component registry overrides.
 */
export const ComponentsConfigSchema = z.object({
  overrides: z.record(ComponentTypeIdSchema, ComponentOverrideSchema).optional(),
});

export type ComponentsConfig = z.infer<typeof ComponentsConfigSchema>;

/**
 * AI prompt template (Phase 1 placeholder).
 */
export const PromptTemplateSchema = z.object({
  name: z.string(),
  template: z.string(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * AI configuration.
 */
export const AiConfigSchema = z.object({
  prompts: z.array(PromptTemplateSchema).optional(),
});

export type AiConfig = z.infer<typeof AiConfigSchema>;

/**
 * Full scaffa.config.ts schema.
 */
export const ScaffaConfigSchema = z.object({
  schemaVersion: z.literal('v0').optional().default('v0'),
  modules: z.array(ScaffaModuleSchema).optional().default([]),
  preview: PreviewConfigSchema.optional(),
  components: ComponentsConfigSchema.optional(),
  ai: AiConfigSchema.optional(),
});

export type ScaffaConfig = z.infer<typeof ScaffaConfigSchema>;

/**
 * Helper function for user-facing config definition.
 * This will be exported from @scaffa/config package.
 */
export function defineScaffaConfig(config: ScaffaConfig): ScaffaConfig {
  return ScaffaConfigSchema.parse(config);
}
