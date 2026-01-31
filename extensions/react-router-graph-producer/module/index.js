// extensions/react-router-graph-producer/module/index.js
import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { z } from "zod";
import { z as z2 } from "zod";
import { z as z4 } from "zod";
import { z as z3 } from "zod";
import { z as z5 } from "zod";
import { z as z6 } from "zod";
import { z as z7 } from "zod";
import { z as z8 } from "zod";
import { z as z9 } from "zod";
import { z as z12 } from "zod";
import { z as z10 } from "zod";
import { z as z11 } from "zod";
var SourceRefSchema = z.object({
  filePath: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().positive().optional()
});
var JsonValueSchema = z.lazy(
  () => z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema)
  ])
);
var PreviewSessionIdSchema = z2.string().brand("PreviewSessionId");
var PreviewSessionTypeSchema = z2.enum(["app", "component", "variant"]);
var PreviewSessionTargetSchema = z2.discriminatedUnion("type", [
  z2.object({
    type: z2.literal("app"),
    url: z2.string().url().optional(),
    launcherId: z2.string().optional(),
    launcherOptions: z2.record(z2.unknown()).optional()
  }),
  z2.object({
    type: z2.literal("component"),
    componentTypeId: z2.string(),
    harnessUrl: z2.string().url().optional()
  }),
  z2.object({
    type: z2.literal("variant"),
    variantId: z2.string()
  })
]).refine(
  (data) => {
    if (data.type === "app") {
      return data.url && !data.launcherId || !data.url && data.launcherId;
    }
    return true;
  },
  {
    message: "App sessions must have either url (attached) or launcherId (managed), not both"
  }
);
var PreviewSessionStateSchema = z2.enum([
  "creating",
  "loading",
  "ready",
  "reloading",
  "stopped",
  "disposed",
  "error"
]);
var InstanceIdSchema = z2.string().brand("InstanceId");
var ComponentTypeIdSchema = z2.string().brand("ComponentTypeId");
var InstanceDescriptorSchema = z2.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  componentTypeId: ComponentTypeIdSchema,
  displayName: z2.string().optional(),
  props: z2.record(z2.unknown()).optional(),
  source: SourceRefSchema.optional(),
  instanceLocator: JsonValueSchema.optional()
});
var SessionCreatedEventSchema = z2.object({
  sessionId: PreviewSessionIdSchema,
  target: PreviewSessionTargetSchema
});
var SessionReadyEventSchema = z2.object({
  sessionId: PreviewSessionIdSchema,
  type: PreviewSessionTypeSchema
});
var SessionErrorEventSchema = z2.object({
  sessionId: PreviewSessionIdSchema,
  error: z2.string()
});
var SessionStoppedEventSchema = z2.object({
  sessionId: PreviewSessionIdSchema
});
var SelectionChangedEventSchema = z2.object({
  sessionId: PreviewSessionIdSchema,
  selected: InstanceDescriptorSchema.nullable()
});
var PreviewLauncherIdSchema = z2.string().brand("PreviewLauncherId");
var PreviewLauncherOptionsSchema = z2.record(z2.unknown());
var PreviewLaunchResultSchema = z2.object({
  /**
   * The URL where the preview is running.
   */
  url: z2.string().url(),
  /**
   * Optional process ID for the launched runtime.
   */
  pid: z2.number().optional()
});
var PreviewLogEntrySchema = z2.object({
  /**
   * Log level.
   */
  level: z2.enum(["info", "warn", "error", "debug"]),
  /**
   * Log message.
   */
  message: z2.string(),
  /**
   * Timestamp (ISO 8601).
   */
  timestamp: z2.string()
});
var PreviewLauncherDescriptorSchema = z2.object({
  /**
   * Unique launcher ID (e.g. "vite-react", "next-dev").
   */
  id: PreviewLauncherIdSchema,
  /**
   * Display name for UI.
   */
  displayName: z2.string(),
  /**
   * Optional description.
   */
  description: z2.string().optional(),
  /**
   * Supported session types (e.g. ["app"]).
   */
  supportedSessionTypes: z2.array(PreviewSessionTypeSchema)
});
var PropPathSchema = z3.string().brand("PropPath");
var InstanceRefSchema = z3.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema
});
var OverrideOpSchema = z3.discriminatedUnion("op", [
  z3.object({
    op: z3.literal("set"),
    instanceId: InstanceIdSchema,
    path: PropPathSchema,
    value: JsonValueSchema,
    componentTypeId: ComponentTypeIdSchema.optional(),
    instanceLocator: JsonValueSchema.optional()
  }),
  z3.object({
    op: z3.literal("clear"),
    instanceId: InstanceIdSchema,
    path: PropPathSchema
  }),
  z3.object({
    op: z3.literal("clearInstance"),
    instanceId: InstanceIdSchema
  }),
  z3.object({
    op: z3.literal("clearAll")
  })
]);
var OverridePatchSchema = z3.object({
  sessionId: PreviewSessionIdSchema,
  ops: z3.array(OverrideOpSchema)
});
var PersistedOverrideSchema = z3.object({
  instanceId: z3.string(),
  path: z3.string(),
  value: JsonValueSchema,
  componentTypeId: z3.string().optional(),
  instanceLocator: JsonValueSchema.optional()
});
var PersistedOverridesFileSchema = z3.object({
  schemaVersion: z3.literal("v0"),
  updatedAt: z3.string().datetime(),
  app: z3.object({
    overrides: z3.array(PersistedOverrideSchema)
  }).optional(),
  component: z3.object({
    overrides: z3.array(PersistedOverrideSchema)
  }).optional()
});
var OverridesChangedEventSchema = z3.object({
  sessionId: PreviewSessionIdSchema,
  overrides: z3.array(PersistedOverrideSchema)
});
var AdapterIdSchema = z4.string().brand("AdapterId");
var RuntimeCapabilitiesSchema = z4.object({
  selection: z4.boolean(),
  overrides: z4.boolean()
});
var RuntimeReadyEventSchema = z4.object({
  type: z4.literal("runtime.ready"),
  adapterId: AdapterIdSchema,
  adapterVersion: z4.string(),
  capabilities: RuntimeCapabilitiesSchema
});
var RuntimeSelectionChangedEventSchema = z4.object({
  type: z4.literal("runtime.selectionChanged"),
  sessionId: PreviewSessionIdSchema,
  selected: InstanceDescriptorSchema.nullable(),
  causedBy: z4.enum(["click", "programmatic"])
});
var RuntimeEventSchema = z4.discriminatedUnion("type", [
  RuntimeReadyEventSchema,
  RuntimeSelectionChangedEventSchema
]);
var HostInitCommandSchema = z4.object({
  type: z4.literal("host.init"),
  sessionId: PreviewSessionIdSchema,
  initialOverrides: z4.array(OverrideOpSchema)
});
var HostApplyOverridesCommandSchema = z4.object({
  type: z4.literal("host.applyOverrides"),
  sessionId: PreviewSessionIdSchema,
  ops: z4.array(OverrideOpSchema)
});
var HostCommandSchema = z4.discriminatedUnion("type", [
  HostInitCommandSchema,
  HostApplyOverridesCommandSchema
]);
var GraphRevisionSchema = z5.number().int().nonnegative();
var GraphSchemaVersionSchema = z5.literal("v0");
var RouteIdSchema = z5.string().brand("RouteId");
var GraphNodeSchema = z5.discriminatedUnion("kind", [
  z5.object({
    kind: z5.literal("route"),
    id: RouteIdSchema,
    path: z5.string(),
    source: SourceRefSchema.optional()
  }),
  z5.object({
    kind: z5.literal("componentType"),
    id: ComponentTypeIdSchema,
    displayName: z5.string(),
    source: SourceRefSchema.optional()
  }),
  z5.object({
    kind: z5.literal("instance"),
    sessionId: PreviewSessionIdSchema,
    instanceId: InstanceIdSchema,
    componentTypeId: ComponentTypeIdSchema,
    displayName: z5.string().optional(),
    source: SourceRefSchema.optional()
  })
]);
var GraphEdgeSchema = z5.discriminatedUnion("kind", [
  z5.object({
    kind: z5.literal("routeUsesComponentType"),
    routeId: RouteIdSchema,
    componentTypeId: ComponentTypeIdSchema
  }),
  z5.object({
    kind: z5.literal("componentTypeUsesComponentType"),
    from: ComponentTypeIdSchema,
    to: ComponentTypeIdSchema
  }),
  z5.object({
    kind: z5.literal("instanceChildOfInstance"),
    sessionId: PreviewSessionIdSchema,
    parentInstanceId: InstanceIdSchema,
    childInstanceId: InstanceIdSchema
  })
]);
var GraphOpSchema = z5.discriminatedUnion("op", [
  z5.object({
    op: z5.literal("upsertNode"),
    node: GraphNodeSchema
  }),
  z5.object({
    op: z5.literal("removeNode"),
    node: z5.discriminatedUnion("kind", [
      z5.object({
        kind: z5.literal("route"),
        id: RouteIdSchema
      }),
      z5.object({
        kind: z5.literal("componentType"),
        id: ComponentTypeIdSchema
      }),
      z5.object({
        kind: z5.literal("instance"),
        sessionId: PreviewSessionIdSchema,
        instanceId: InstanceIdSchema
      })
    ])
  }),
  z5.object({
    op: z5.literal("upsertEdge"),
    edge: GraphEdgeSchema
  }),
  z5.object({
    op: z5.literal("removeEdge"),
    edge: GraphEdgeSchema
  })
]);
var GraphPatchSchema = z5.object({
  schemaVersion: GraphSchemaVersionSchema,
  revision: GraphRevisionSchema,
  ops: z5.array(GraphOpSchema)
});
var GraphSnapshotSchema = z5.object({
  schemaVersion: GraphSchemaVersionSchema,
  revision: GraphRevisionSchema,
  nodes: z5.array(GraphNodeSchema),
  edges: z5.array(GraphEdgeSchema)
});
var GraphQuerySchema = z5.discriminatedUnion("type", [
  z5.object({
    type: z5.literal("getSnapshot")
  }),
  z5.object({
    type: z5.literal("getNode"),
    node: z5.discriminatedUnion("kind", [
      z5.object({
        kind: z5.literal("route"),
        id: RouteIdSchema
      }),
      z5.object({
        kind: z5.literal("componentType"),
        id: ComponentTypeIdSchema
      })
    ])
  })
]);
var WorkspacePathSchema = z6.string().brand("WorkspacePath");
var WorkspaceInfoSchema = z6.object({
  path: WorkspacePathSchema,
  name: z6.string(),
  lastOpened: z6.string().datetime().optional()
});
var WorkspaceOpenErrorSchema = z6.object({
  code: z6.enum([
    "NOT_FOUND",
    "NOT_A_DIRECTORY",
    "INVALID_SYNTAX",
    "VALIDATION_ERROR",
    "UNKNOWN_ERROR",
    "DEMO_NOT_FOUND"
  ]),
  message: z6.string(),
  details: z6.record(z6.unknown()).optional()
});
var WorkspaceOpenResponseSchema = z6.object({
  workspace: WorkspaceInfoSchema.nullable(),
  error: WorkspaceOpenErrorSchema.nullable()
});
var SelectWorkspaceRequestSchema = z6.object({});
var GetRecentWorkspacesRequestSchema = z6.object({});
var GetRecentWorkspacesResponseSchema = z6.object({
  recents: z6.array(WorkspaceInfoSchema)
});
var OpenRecentWorkspaceRequestSchema = z6.object({
  path: WorkspacePathSchema
});
var RemoveRecentWorkspaceRequestSchema = z6.object({
  path: WorkspacePathSchema
});
var RemoveRecentWorkspaceResponseSchema = z6.object({
  recents: z6.array(WorkspaceInfoSchema)
});
var OpenDemoWorkspaceRequestSchema = z6.object({});
var GetWorkspaceRequestSchema = z6.object({});
var GetWorkspaceResponseSchema = z6.object({
  workspace: WorkspaceInfoSchema.nullable()
});
var WorkspaceChangedEventSchema = z6.object({
  workspace: WorkspaceInfoSchema.nullable()
});
var TextRangeSchema = z7.object({
  start: z7.number().int().nonnegative(),
  end: z7.number().int().nonnegative()
}).refine((range) => range.end >= range.start, {
  message: "TextRange end must be >= start"
});
var TextEditSchema = z7.object({
  range: TextRangeSchema,
  newText: z7.string()
});
var FileEditSchema = z7.discriminatedUnion("kind", [
  z7.object({
    kind: z7.literal("text"),
    filePath: z7.string(),
    expectedSha256: z7.string().optional(),
    edits: z7.array(TextEditSchema)
  }),
  z7.object({
    kind: z7.literal("create"),
    filePath: z7.string(),
    contents: z7.string(),
    overwrite: z7.boolean().optional()
  }),
  z7.object({
    kind: z7.literal("delete"),
    filePath: z7.string(),
    allowMissing: z7.boolean().optional()
  })
]);
var ApplyEditsResultSchema = z7.discriminatedUnion("ok", [
  z7.object({
    ok: z7.literal(true),
    applied: z7.array(z7.object({ filePath: z7.string() }))
  }),
  z7.object({
    ok: z7.literal(false),
    error: z7.object({
      code: z7.enum([
        "conflict",
        "notFound",
        "permissionDenied",
        "invalidEdit",
        "ioError"
      ]),
      filePath: z7.string(),
      message: z7.string()
    })
  })
]);
var ComponentTypeIdSchema2 = z8.string();
var SkaffaModuleSchema = z8.object({
  id: z8.string(),
  path: z8.string().optional(),
  /**
   * Optional npm package specifier for package-based modules.
   * When provided, the extension host will resolve it using Node's module resolution
   * anchored at the workspace root (directory containing skaffa.config.js).
   *
   * Examples:
   * - "@skaffa/module-react-router"
   * - "./relative-package" (workspace local via package.json "name")
   */
  package: z8.string().optional(),
  // Module contributions are resolved at runtime by the extension host
  contributions: z8.unknown().optional()
});
var PreviewDecoratorSchema = z8.unknown();
var PreviewConfigSchema = z8.object({
  /**
   * Harness Model: module specifier for the preview root component.
   * Example: "./src/App.tsx"
   */
  entry: z8.string().optional(),
  /**
   * Harness Model: list of style module specifiers to import before mounting.
   * Example: ["./src/index.css"]
   */
  styles: z8.array(z8.string()).optional(),
  decorators: z8.array(PreviewDecoratorSchema).optional(),
  environment: z8.record(z8.unknown()).optional(),
  /**
   * Optional default launcher preference for `app` sessions.
   * The Preview Session Target still carries the authoritative `launcherId`.
   */
  launcher: z8.object({
    id: z8.string(),
    options: z8.record(z8.unknown()).optional()
  }).optional()
});
var ControlOverrideSchema = z8.object({
  kind: z8.enum(["string", "number", "boolean", "select", "color", "slot", "json"]).optional(),
  // Additional control-specific options can be partially overridden
  options: z8.unknown().optional()
});
var PropExposureOverrideSchema = z8.object({
  kind: z8.enum(["editable", "inspectOnly", "opaque"]).optional(),
  control: ControlOverrideSchema.optional(),
  uiDefaultValue: z8.unknown().optional()
});
var PropOverrideSchema = z8.object({
  label: z8.string().optional(),
  description: z8.string().optional(),
  group: z8.string().optional(),
  order: z8.number().optional(),
  exposure: PropExposureOverrideSchema.optional()
});
var ComponentOverrideSchema = z8.object({
  disabled: z8.boolean().optional(),
  displayName: z8.string().optional(),
  props: z8.record(PropOverrideSchema).optional()
});
var ComponentsConfigSchema = z8.object({
  overrides: z8.record(ComponentTypeIdSchema2, ComponentOverrideSchema).optional()
});
var PromptTemplateSchema = z8.object({
  name: z8.string(),
  template: z8.string()
});
var AiConfigSchema = z8.object({
  prompts: z8.array(PromptTemplateSchema).optional()
});
var SkaffaConfigSchema = z8.object({
  schemaVersion: z8.literal("v0").optional().default("v0"),
  modules: z8.array(SkaffaModuleSchema).optional().default([]),
  preview: PreviewConfigSchema.optional(),
  components: ComponentsConfigSchema.optional(),
  ai: AiConfigSchema.optional()
});
var InspectorGroupIdSchema = z9.string();
var ControlDefinitionSchema = z9.discriminatedUnion("kind", [
  z9.object({
    kind: z9.literal("string"),
    placeholder: z9.string().optional(),
    multiline: z9.boolean().optional()
  }),
  z9.object({
    kind: z9.literal("number"),
    step: z9.number().optional(),
    unit: z9.string().optional()
  }),
  z9.object({
    kind: z9.literal("boolean")
  }),
  z9.object({
    kind: z9.literal("select"),
    options: z9.array(
      z9.object({
        value: z9.string(),
        label: z9.string(),
        description: z9.string().optional()
      })
    )
  }),
  z9.object({
    kind: z9.literal("color"),
    format: z9.enum(["hex", "rgb", "hsl"]).optional()
  }),
  z9.object({
    kind: z9.literal("slot"),
    slotName: z9.string().optional(),
    editable: z9.boolean().optional()
  }),
  z9.object({
    kind: z9.literal("json")
  })
]);
var PropExposureSchema = z9.discriminatedUnion("kind", [
  z9.object({
    kind: z9.literal("editable"),
    control: ControlDefinitionSchema,
    uiDefaultValue: JsonValueSchema.optional(),
    constraints: z9.object({
      required: z9.boolean().optional(),
      min: z9.number().optional(),
      max: z9.number().optional(),
      pattern: z9.string().optional()
    }).optional()
  }),
  z9.object({
    kind: z9.literal("inspectOnly"),
    displayHint: z9.enum(["summary", "json", "code"]).optional()
  }),
  z9.object({
    kind: z9.literal("opaque"),
    reason: z9.string().optional()
  })
]);
var PropDefinitionSchema = z9.object({
  propName: z9.string(),
  label: z9.string().optional(),
  description: z9.string().optional(),
  group: InspectorGroupIdSchema.optional(),
  order: z9.number().optional(),
  exposure: PropExposureSchema
});
var FileImplementationHintSchema = z9.object({
  kind: z9.literal("file"),
  /**
   * Workspace-relative path to the module that exports the component.
   * Example: "src/components/DemoButton.tsx"
   */
  filePath: z9.string(),
  /**
   * Optional named export. If omitted, defaults to "default".
   * Example: "DemoButton"
   */
  exportName: z9.string().optional()
});
var PackageImplementationHintSchema = z9.object({
  kind: z9.literal("package"),
  /**
   * Bare module specifier for a third-party component module.
   * Example: "@mui/material/Button"
   */
  specifier: z9.string(),
  /**
   * Optional named export. If omitted, defaults to "default".
   */
  exportName: z9.string().optional()
});
var ComponentImplementationHintSchema = z9.discriminatedUnion("kind", [
  FileImplementationHintSchema,
  PackageImplementationHintSchema
]);
var ComponentRegistryEntrySchema = z9.object({
  typeId: ComponentTypeIdSchema,
  displayName: z9.string(),
  tags: z9.array(z9.string()).optional(),
  description: z9.string().optional(),
  props: z9.record(PropDefinitionSchema),
  /**
   * Optional instrumentation hints used by managed preview launchers.
   * These hints are NOT identifiers; they can change without changing typeId.
   * See: docs/skaffa_component_registry_schema.md (5.1/5.2)
   */
  implementation: z9.union([
    ComponentImplementationHintSchema,
    z9.array(ComponentImplementationHintSchema)
  ]).optional()
});
var ComponentRegistrySchema = z9.object({
  schemaVersion: z9.literal("v0"),
  components: z9.record(ComponentTypeIdSchema, ComponentRegistryEntrySchema)
});
var DraftOverrideAddressSchema = z10.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: z10.string()
});
var DraftOverrideSchema = DraftOverrideAddressSchema.extend({
  value: JsonValueSchema,
  componentTypeId: ComponentTypeIdSchema.optional(),
  instanceLocator: JsonValueSchema.optional()
});
var ValidationResultSchema = z10.discriminatedUnion("ok", [
  z10.object({ ok: z10.literal(true) }),
  z10.object({
    ok: z10.literal(false),
    code: z10.enum([
      "unpromotable",
      "notFound",
      "unsupportedPattern",
      "internalError"
    ]),
    message: z10.string()
  })
]);
var SaveFailureSchema = z10.object({
  address: DraftOverrideAddressSchema,
  result: ValidationResultSchema
});
var SavePlanSchema = z10.object({
  edits: z10.array(FileEditSchema),
  failed: z10.array(SaveFailureSchema)
});
var SaveResultSchema = z10.object({
  ok: z10.boolean(),
  appliedCount: z10.number().int().nonnegative(),
  failed: z10.array(SaveFailureSchema)
});
var InspectorSectionIdSchema = z11.string().brand("InspectorSectionId");
var InspectorSectionContextSchema = z11.object({
  /**
   * Session ID of the preview runtime.
   */
  sessionId: PreviewSessionIdSchema,
  /**
   * Selected instance descriptor.
   */
  selected: z11.object({
    instanceId: InstanceIdSchema,
    componentTypeId: ComponentTypeIdSchema,
    displayName: z11.string().optional(),
    instanceLocator: JsonValueSchema.optional(),
    props: z11.record(JsonValueSchema).optional()
  }).nullable(),
  /**
   * Registry entry for the selected component type (if available).
   */
  registryEntry: ComponentRegistryEntrySchema.nullable(),
  /**
   * Current override state for the selected instance.
   */
  overrides: z11.array(z11.object({
    instanceId: InstanceIdSchema,
    path: PropPathSchema,
    value: JsonValueSchema
  }))
});
var InspectorSectionContributionSchema = z11.object({
  /**
   * Unique ID for this section (scoped to extension).
   */
  id: InspectorSectionIdSchema,
  /**
   * Display title for the section.
   */
  title: z11.string(),
  /**
   * Display order (lower = higher in the panel).
   * Core sections use 100-900. Extensions should use 1000+.
   */
  order: z11.number(),
  /**
   * Extension ID that registered this section.
   */
  extensionId: z11.string(),
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
  componentPath: z11.string(),
  /**
   * Named export from the component module.
   */
  componentExport: z11.string()
});
var StartSessionRequestSchema = z12.object({
  target: PreviewSessionTargetSchema
});
var StartSessionResponseSchema = z12.object({
  sessionId: PreviewSessionIdSchema
});
var StopSessionRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema
});
var GetLaunchersRequestSchema = z12.object({});
var GetLaunchersResponseSchema = z12.object({
  launchers: z12.array(PreviewLauncherDescriptorSchema)
});
var SetPreviewViewportRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema,
  bounds: z12.object({
    x: z12.number(),
    y: z12.number(),
    width: z12.number(),
    height: z12.number()
  })
});
var SetOverrideRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: PropPathSchema,
  value: JsonValueSchema,
  componentTypeId: ComponentTypeIdSchema.optional(),
  instanceLocator: JsonValueSchema.optional()
});
var ClearOverrideRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema,
  path: PropPathSchema
});
var ClearInstanceOverridesRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema,
  instanceId: InstanceIdSchema
});
var ClearAllOverridesRequestSchema = z12.object({
  sessionId: PreviewSessionIdSchema
});
var SaveOverridesRequestSchema = z12.object({});
var GetGraphSnapshotRequestSchema = z12.object({});
var IpcErrorSchema = z12.object({
  code: z12.string(),
  message: z12.string(),
  details: z12.record(z12.unknown()).optional()
});
var GetInspectorSectionsRequestSchema = z12.object({});
var GetInspectorSectionsResponseSchema = z12.object({
  sections: z12.array(InspectorSectionContributionSchema)
});
function createRouteId(path2) {
  return RouteIdSchema.parse(`route:${path2}`);
}
function createRouteNode(options) {
  const { path: path2, filePath, line, column, routeId } = options;
  if (routeId !== void 0 && (routeId.includes(":") || routeId.includes("/"))) {
    throw new Error(
      `Invalid routeId: "${routeId}". RouteId must not contain ':' or '/' characters (these conflict with ID encoding). Use alphanumeric, hyphens, and underscores only.`
    );
  }
  const id = routeId !== void 0 ? RouteIdSchema.parse(`routeId:${routeId}`) : createRouteId(path2);
  return {
    kind: "route",
    id,
    path: path2,
    source: {
      filePath,
      line,
      ...column !== void 0 && { column }
    }
  };
}
function activate(context) {
  console.log("[ReactRouterGraphProducer] Activating...");
  const workspaceRoot = context.workspaceRoot;
  if (!workspaceRoot) {
    console.error("[ReactRouterGraphProducer] No workspace root available");
    return;
  }
  const routeModulePath = path.join(workspaceRoot, "app/src/routes.tsx");
  const producer = {
    id: "react-router-graph-producer",
    async initialize() {
      console.log("[ReactRouterGraphProducer] Parsing route module:", routeModulePath);
      try {
        const routes = await parseRouteModule(routeModulePath);
        const { nodes, edges } = buildGraphFromRoutes(routes, routeModulePath);
        return {
          schemaVersion: "v0",
          revision: 1,
          nodes,
          edges
        };
      } catch (error) {
        console.error("[ReactRouterGraphProducer] Failed to parse routes:", error);
        return {
          schemaVersion: "v0",
          revision: 1,
          nodes: [],
          edges: []
        };
      }
    },
    start(onPatch) {
      console.log("[ReactRouterGraphProducer] Starting file watch for:", routeModulePath);
      let revision = 1;
      const watcher = fs.watch(routeModulePath, async (eventType) => {
        if (eventType === "change") {
          console.log("[ReactRouterGraphProducer] Route module changed, emitting patch...");
          try {
            revision++;
            const routes = await parseRouteModule(routeModulePath);
            const { nodes, edges } = buildGraphFromRoutes(routes, routeModulePath);
            const ops = [
              // First, we would need to remove old nodes, but for v0 we can
              // just upsert all nodes (they'll replace based on ID)
              ...nodes.map((node) => ({ op: "upsertNode", node })),
              ...edges.map((edge) => ({ op: "upsertEdge", edge }))
            ];
            onPatch({
              schemaVersion: "v0",
              revision,
              ops
            });
          } catch (error) {
            console.error("[ReactRouterGraphProducer] Failed to parse routes on change:", error);
          }
        }
      });
      return {
        dispose: () => {
          watcher.close();
          console.log("[ReactRouterGraphProducer] Stopped file watch");
        }
      };
    }
  };
  context.graph.registerProducer(producer);
  console.log("[ReactRouterGraphProducer] Activated");
}
function deactivate() {
  console.log("[ReactRouterGraphProducer] Deactivated");
}
async function parseRouteModule(filePath) {
  const sourceText = await fs.promises.readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );
  const routes = [];
  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name) && declaration.name.text === "routes" && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
        for (const element of declaration.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            const route = parseRouteObject(element);
            if (route) {
              routes.push(route);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (routes.length === 0) {
    throw new Error(`No routes found in ${filePath}. Expected export: const routes: RouteObject[] = [...]`);
  }
  return routes;
}
function parseRouteObject(node) {
  let id;
  let path2;
  const children = [];
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const propName = prop.name.text;
      if (propName === "id" && ts.isStringLiteral(prop.initializer)) {
        id = prop.initializer.text;
      } else if (propName === "path" && ts.isStringLiteral(prop.initializer)) {
        path2 = prop.initializer.text;
      } else if (propName === "children" && ts.isArrayLiteralExpression(prop.initializer)) {
        for (const child of prop.initializer.elements) {
          if (ts.isObjectLiteralExpression(child)) {
            const childRoute = parseRouteObject(child);
            if (childRoute) {
              children.push(childRoute);
            }
          }
        }
      }
    }
  }
  if (!id || path2 === void 0) {
    console.warn(
      "[ReactRouterGraphProducer] Route missing required id or path:",
      { id, path: path2 }
    );
    return null;
  }
  return { id, path: path2, children: children.length > 0 ? children : void 0 };
}
function buildGraphFromRoutes(routes, sourceFilePath) {
  const nodes = [];
  const edges = [];
  function processRoute(route, parentId) {
    nodes.push(
      createRouteNode({
        path: route.path,
        routeId: route.id,
        filePath: sourceFilePath,
        line: 1
        // TODO: Track actual line numbers from AST
      })
    );
    if (route.children) {
      for (const child of route.children) {
        processRoute(child, route.id);
      }
    }
  }
  for (const route of routes) {
    processRoute(route);
  }
  return { nodes, edges };
}
export {
  activate,
  deactivate
};
