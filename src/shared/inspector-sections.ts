import { z } from "zod";
import {
  PreviewSessionIdSchema,
  InstanceIdSchema,
  ComponentTypeIdSchema,
} from "./preview-session.js";
import { ComponentRegistryEntrySchema } from "./registry.js";
import { JsonValueSchema } from "./common.js";
import { PropPathSchema } from "./override.js";

// ─────────────────────────────────────────────────────────────────────────────
// Inspector Section Contribution Schema (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Extensions can contribute custom UI sections to the Inspector.
// See: docs/skaffa_extension_api.md

/**
 * Unique identifier for an inspector section.
 */
export const InspectorSectionIdSchema = z.string().brand("InspectorSectionId");
export type InspectorSectionId = z.infer<typeof InspectorSectionIdSchema>;

/**
 * Context payload provided to inspector sections.
 * Contains read-only selection state and registry info.
 */
export const InspectorSectionContextSchema = z.object({
  /**
   * Session ID of the preview runtime.
   */
  sessionId: PreviewSessionIdSchema,

  /**
   * Selected instance descriptor.
   */
  selected: z
    .object({
      instanceId: InstanceIdSchema,
      componentTypeId: ComponentTypeIdSchema,
      displayName: z.string().optional(),
      instanceLocator: JsonValueSchema.optional(),
      props: z.record(JsonValueSchema).optional(),
    })
    .nullable(),

  /**
   * Registry entry for the selected component type (if available).
   */
  registryEntry: ComponentRegistryEntrySchema.nullable(),

  /**
   * Current override state for the selected instance.
   */
  overrides: z.array(
    z.object({
      instanceId: InstanceIdSchema,
      path: PropPathSchema,
      value: JsonValueSchema,
    }),
  ),
});

export type InspectorSectionContext = z.infer<
  typeof InspectorSectionContextSchema
>;

/**
 * Inspector section contribution descriptor.
 * Extensions provide this to register a section.
 */
export const InspectorSectionContributionSchema = z.object({
  /**
   * Unique ID for this section (scoped to extension).
   */
  id: InspectorSectionIdSchema,

  /**
   * Display title for the section.
   */
  title: z.string(),

  /**
   * Display order (lower = higher in the panel).
   * Core sections use 100-900. Extensions should use 1000+.
   */
  order: z.number(),

  /**
   * Extension ID that registered this section.
   */
  extensionId: z.string(),

  /**
   * Path to the extension-provided UI component bundle.
   * This is a workspace-relative path to a bundled React component.
   *
   * SECURITY NOTE: This path cannot be directly loaded by the renderer due to process
   * isolation. A future implementation must use one of:
   * - Custom protocol handler (skaffa://extension/<extensionId>/<path>)
   * - HTTP endpoint served from extension-host
   * - Pre-bundled components in renderer build
   *
   * Example: "extensions/layout/module/inspector-sections/GridSection.js"
   */
  componentPath: z.string(),

  /**
   * Named export from the component module.
   */
  componentExport: z.string(),
});

export type InspectorSectionContribution = z.infer<
  typeof InspectorSectionContributionSchema
>;
