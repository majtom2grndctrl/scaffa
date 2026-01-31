// @ts-check
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Skaffa Config Schema (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Defines the shape of skaffa.config.js project configuration.
// See: docs/skaffa_project_configuration_skaffa_config.md

// Local schema to avoid runtime dependency on other shared modules.
const ComponentTypeIdSchema = z.string();

/**
 * Module instance contributed to the project.
 * v0: Simple path-based loading. Future: factory functions + npm packages.
 */
export const SkaffaModuleSchema = z.object({
  id: z.string(),
  path: z.string().optional(),
  /**
   * Optional npm package specifier for package-based modules.
   * When provided, the extension host will resolve it using Node's module resolution
   * anchored at the workspace root (directory containing skaffa.config.js).
   *
   * Examples:
   * - "@skaffa/module-react-router"
   * - "./relative-package" (workspace local via package.json "name")
   */
  package: z.string().optional(),
  // Module contributions are resolved at runtime by the extension host
  contributions: z.unknown().optional(),
});

/** @typedef {import('zod').infer<typeof SkaffaModuleSchema>} SkaffaModule */

/**
 * Preview decorator function (opaque at config layer).
 */
export const PreviewDecoratorSchema = z.unknown();

/** @typedef {import('zod').infer<typeof PreviewDecoratorSchema>} PreviewDecorator */

/**
 * Preview configuration.
 */
export const PreviewConfigSchema = z.object({
  /**
   * Harness Model: module specifier for the preview root component.
   * Example: "./src/App.tsx"
   */
  entry: z.string().optional(),
  /**
   * Harness Model: list of style module specifiers to import before mounting.
   * Example: ["./src/index.css"]
   */
  styles: z.array(z.string()).optional(),
  decorators: z.array(PreviewDecoratorSchema).optional(),
  environment: z.record(z.unknown()).optional(),
  /**
   * Optional default launcher preference for `app` sessions.
   * The Preview Session Target still carries the authoritative `launcherId`.
   */
  launcher: z
    .object({
      id: z.string(),
      options: z.record(z.unknown()).optional(),
    })
    .optional(),
});

/** @typedef {import('zod').infer<typeof PreviewConfigSchema>} PreviewConfig */

/**
 * Control definition override for a prop.
 */
export const ControlOverrideSchema = z.object({
  kind: z.enum(['string', 'number', 'boolean', 'select', 'color', 'slot', 'json']).optional(),
  // Additional control-specific options can be partially overridden
  options: z.unknown().optional(),
});

/** @typedef {import('zod').infer<typeof ControlOverrideSchema>} ControlOverride */

/**
 * Prop exposure override.
 */
export const PropExposureOverrideSchema = z.object({
  kind: z.enum(['editable', 'inspectOnly', 'opaque']).optional(),
  control: ControlOverrideSchema.optional(),
  uiDefaultValue: z.unknown().optional(),
});

/** @typedef {import('zod').infer<typeof PropExposureOverrideSchema>} PropExposureOverride */

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

/** @typedef {import('zod').infer<typeof PropOverrideSchema>} PropOverride */

/**
 * Component-level override.
 */
export const ComponentOverrideSchema = z.object({
  disabled: z.boolean().optional(),
  displayName: z.string().optional(),
  props: z.record(PropOverrideSchema).optional(),
});

/** @typedef {import('zod').infer<typeof ComponentOverrideSchema>} ComponentOverride */

/**
 * Component registry overrides.
 */
export const ComponentsConfigSchema = z.object({
  overrides: z.record(ComponentTypeIdSchema, ComponentOverrideSchema).optional(),
});

/** @typedef {import('zod').infer<typeof ComponentsConfigSchema>} ComponentsConfig */

/**
 * AI prompt template (Phase 1 placeholder).
 */
export const PromptTemplateSchema = z.object({
  name: z.string(),
  template: z.string(),
});

/** @typedef {import('zod').infer<typeof PromptTemplateSchema>} PromptTemplate */

/**
 * AI configuration.
 */
export const AiConfigSchema = z.object({
  prompts: z.array(PromptTemplateSchema).optional(),
});

/** @typedef {import('zod').infer<typeof AiConfigSchema>} AiConfig */

/**
 * Full skaffa.config.js schema.
 */
export const SkaffaConfigSchema = z.object({
  schemaVersion: z.literal('v0').optional().default('v0'),
  modules: z.array(SkaffaModuleSchema).optional().default([]),
  preview: PreviewConfigSchema.optional(),
  components: ComponentsConfigSchema.optional(),
  ai: AiConfigSchema.optional(),
});

/** @typedef {import('zod').infer<typeof SkaffaConfigSchema>} SkaffaConfig */

/**
 * Helper function for user-facing config definition.
 * This will be exported from @skaffa/config package.
 *
 * @param {SkaffaConfig} config
 * @returns {SkaffaConfig}
 */
export function defineSkaffaConfig(config) {
  return SkaffaConfigSchema.parse(config);
}
