// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Extension SDK (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Stable import surface for extension authors.
//
// Usage:
//   import type { ExtensionContext, ComponentRegistry } from '../../extension-sdk.js';
//
// This entrypoint re-exports all extension-facing types from Scaffa core.
// Extension modules should import from this file instead of deep paths into src/.

// ─────────────────────────────────────────────────────────────────────────────
// Extension Context API (extension-host)
// ─────────────────────────────────────────────────────────────────────────────

export type {
  ExtensionContext,
  ExtensionModule,
  Disposable,
  WorkspaceAPI,
  RegistryAPI,
  GraphAPI,
  GraphProducer,
  PreviewAPI,
  PreviewLauncher,
} from './src/extension-host/extension-context.js';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Protocol Types
// ─────────────────────────────────────────────────────────────────────────────

// Component Registry
export type {
  ComponentRegistry,
  ComponentRegistryEntry,
  PropDefinition,
  PropExposure,
  EditableExposure,
  InspectOnlyExposure,
  OpaqueExposure,
  ControlConfig,
  TextInputControl,
  NumberInputControl,
  CheckboxControl,
  SelectControl,
  RadioGroupControl,
  TextareaControl,
  ColorPickerControl,
  SliderControl,
  ComponentTypeId,
} from './src/shared/index.js';

// Project Graph
export type {
  GraphSnapshot,
  GraphPatch,
  GraphNode,
  RouteNode,
  ComponentTypeNode,
  ComponentInstanceNode,
  GraphEdge,
  RouteUsesComponentTypeEdge,
  ComponentTypeUsesComponentTypeEdge,
  GraphOp,
  RouteId,
  ComponentInstanceId,
} from './src/shared/project-graph.js';

// Preview Sessions
export type {
  PreviewSessionId,
  PreviewSessionTarget,
  PreviewLauncherDescriptor,
  PreviewLauncherOptions,
  PreviewLaunchResult,
  PreviewLogEntry,
  PreviewLogLevel,
  PreviewLauncherId,
} from './src/shared/preview-session.js';

// Overrides
export type {
  OverrideOp,
  PersistedOverride,
  PersistedOverridesFile,
  InstanceId,
  PropPath,
  JsonValue,
} from './src/shared/override.js';

// Config
export type {
  ScaffaConfig,
  ScaffaModule,
  WorkspacePath,
} from './src/shared/config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schemas (for runtime validation)
// ─────────────────────────────────────────────────────────────────────────────

export {
  ComponentTypeIdSchema,
  RouteIdSchema,
  ComponentInstanceIdSchema,
  InstanceIdSchema,
  PropPathSchema,
  PreviewSessionIdSchema,
  PreviewLauncherIdSchema,
} from './src/shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Graph Construction Helpers
// ─────────────────────────────────────────────────────────────────────────────

export {
  createRouteId,
  createComponentTypeId,
  createRouteNode,
  createComponentTypeNode,
  createRouteUsesComponentTypeEdge,
  createComponentTypeUsesComponentTypeEdge,
} from './src/extension-host/graph-helpers.js';

export type {
  CreateRouteNodeOptions,
  CreateComponentTypeNodeOptions,
  CreateRouteUsesComponentTypeEdgeOptions,
  CreateComponentTypeUsesComponentTypeEdgeOptions,
} from './src/extension-host/graph-helpers.js';
