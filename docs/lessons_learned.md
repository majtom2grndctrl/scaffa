# Lessons Learned: Building the Demo Workspace

> **Context:** Observations and friction points discovered while implementing `demo/` workspace for v0 walkthrough
> **Date:** 2026-01-11
> **Purpose:** Document gaps, clarifications, and patterns that should be incorporated into formal architecture docs

---

## 1. Extension Context API Naming

### Issue
The `RegistryAPI` interface uses method name `contributeRegistry()`, but architectural thinking and initial implementations might assume `registerComponentRegistry()` based on the naming of `GraphAPI.registerProducer()`.

### Inconsistency
- `context.registry.contributeRegistry(registry)` ✅ (actual)
- `context.graph.registerProducer(producer)` ✅ (actual)

The verbs "contribute" vs "register" are inconsistent, which can cause confusion.

### Recommendation
- **Either:** Standardize on "register" for both APIs
- **Or:** Document why "contribute" is used for registries (perhaps to emphasize composition/override semantics)
- **And:** Add examples to Extension Context docs showing both APIs

---

## 2. Import Path Complexity for Extension Authors

### Issue
Extension modules need to import from multiple internal paths:

```typescript
import type { ExtensionContext } from '../../../src/extension-host/extension-context.js';
import type { ComponentRegistry } from '../../../src/shared/registry.js';
import type { GraphSnapshot, GraphPatch } from '../../../src/shared/project-graph.js';
```

### Friction Points
- No single "extension SDK" import
- Relative paths depend on where the module lives
- Not clear which types live where without exploring the codebase

### Recommendation
- Create a unified extension SDK export (e.g., `@scaffa/extension-api` or `scaffa/extensions`)
- Document the type import map explicitly in extension authoring guide
- Consider making extension-host export a re-export barrel of commonly needed types

---

## 3. Workspace Config Relative Paths

### Issue
Module paths in `scaffa.config.ts` are relative to the config file location, not the project root:

```typescript
modules: [
  {
    id: 'demo-module',
    path: './extensions/demo-module/index.ts', // Relative to demo/
  }
]
```

### Observation
This works well for workspace-local modules, but:
- Not immediately obvious from the config schema
- No support for absolute paths or workspace-relative paths (e.g., `@/modules/...`)
- Shared modules between workspaces would need symlinks or npm packages

### Recommendation
- Document path resolution behavior explicitly in `scaffa_project_configuration_scaffa_config.md`
- Consider supporting multiple path resolution strategies (relative, absolute, workspace-relative)

---

## 4. Demo App as Separate Runnable

### Issue
The demo app is a separate Vite dev server that must run independently. Scaffa previews it via HTTP URL.

### Architectural Implication
- Preview target is not "bundled" with Scaffa
- Requires two processes: Scaffa + demo app dev server
- Dev workflow requires starting app separately

### Observation
This is the correct architecture (separation of concerns), but it's not explicitly called out in docs. First-time users might expect:
- A single "start Scaffa with demo" command
- Auto-starting of dev servers
- Embedded preview without HTTP

### Recommendation
- Add a "Dev Workflow" section to architecture docs explaining multi-process model
- Document that preview targets are independent HTTP servers
- Clarify when/why this is beneficial (matches production reality, framework-agnostic)

---

## 5. Runtime Adapter Integration Pattern (Recipe)

### Issue
Integrating the runtime adapter requires a three-part pattern:

```typescript
// 1. Wrap app root with ScaffaProvider
<ScaffaProvider config={{ adapterId: 'react', ... }}>
  <App />
</ScaffaProvider>

// 2. Wrap each component with ScaffaInstance
export function DemoButton(props) {
  return (
    <ScaffaInstance typeId="demo.button" displayName="Button">
      <DemoButtonInner {...props} />
    </ScaffaInstance>
  );
}

// 3. Use hook inside component to apply overrides
function DemoButtonInner(props) {
  const effectiveProps = useScaffaInstance(props);
  // Use effectiveProps instead of props
}
```

### Observation
- All three parts are required for the system to work
- Missing any part breaks click-to-select or override application
- This recipe is scattered across multiple doc sections

### Recommendation
- Create a "Runtime Adapter Integration Guide" with complete recipe
- Include common pitfalls (forgetting the hook, wrong wrapper order)
- Add diagram showing data flow through these three layers

---

## 6. TypeScript Branded Types and Casting

### Issue
The codebase uses Zod branded types extensively:

```typescript
export const ComponentTypeIdSchema = z.string().brand('ComponentTypeId');
export type ComponentTypeId = z.infer<typeof ComponentTypeIdSchema>;
```

Extension authors hit friction when constructing graph snapshots:

```typescript
{
  kind: 'componentType' as const, // Need 'as const'
  id: 'demo.button' as any,       // Need 'as any' or cast
  displayName: 'Button',
}
```

### Observation
- Type safety is good, but casting is required in multiple places
- Not clear to extension authors when/why casting is needed
- Could be improved with helper constructors

### ✅ RESOLVED (2026-01-11)
- Added graph construction helpers to `src/extension-host/graph-helpers.ts`
- Exported from extension SDK: `createRouteNode()`, `createComponentTypeNode()`, `createRouteUsesComponentTypeEdge()`, etc.
- Updated sample-graph-producer to demonstrate zero-cast usage
- Documented helper usage in extension authoring guide (section 4)
- Extension authors can now construct graph data without any `as any` casts

---

## 7. Override Persistence Directory

### Issue
Overrides persist to `<workspace>/.scaffa/overrides.v0.json`, but:
- The `.scaffa/` directory is not auto-created
- Unclear if this should be `.gitignore`d or committed
- No error handling documented if directory doesn't exist

### Observation
- I created `.scaffa/.gitkeep` manually
- Scaffa might handle directory creation (not tested)
- Project policy (commit vs ignore) should be documented

### Recommendation
- Document that Scaffa auto-creates `.scaffa/` on first override (if true)
- Provide guidance on whether to commit override files
- Add to workspace setup checklist in docs

---

## 8. Module Activation Logging and Debugging

### Issue
`console.log()` from extension modules appears in Electron DevTools console, not terminal output.

### Observation
- First-time developers might miss activation logs
- Debugging requires opening DevTools (Help → Toggle Developer Tools)
- No mention of this in extension authoring guide

### Recommendation
- Document where to find module logs (Electron main vs renderer vs extension host)
- Provide debugging guide for extensions
- Consider surfacing critical logs to terminal or a UI panel

---

## 9. Component Type ID Consistency Requirement

### Issue
The `typeId` must match across three places:

1. Component registry: `components: { 'demo.button': { ... } }`
2. Graph producer: `{ kind: 'componentType', id: 'demo.button' }`
3. Runtime wrapper: `<ScaffaInstance typeId="demo.button">`

If any mismatch, Inspector won't show metadata for selected instances.

### Observation
- This cross-boundary consistency is implicit, not enforced
- No validation at runtime to catch mismatches
- Debugging mismatch is difficult (Inspector just shows raw props)

### Recommendation
- Add runtime validation that logs warnings for missing registry entries
- Document the consistency requirement prominently
- Consider providing a typed constant export from registry modules

---

## 10. Preview Session URL Format

### Issue
Preview URLs must be full URLs with protocol:

```typescript
{ type: 'app', url: 'http://localhost:5173' } // ✅ Correct
{ type: 'app', url: 'localhost:5173' }        // ❌ Wrong
{ type: 'app', url: '/demo' }                 // ❌ Wrong
```

### Observation
- Schema validates this, but error messages might not be clear
- Docs mention this but could be more prominent

### Recommendation
- Add validation error messages that guide users to correct format
- Provide examples in Preview Session Protocol docs

---

## 11. Dev Workflow: Two-Server Requirement

### Issue
Testing the v0 journey requires:

1. Scaffa running (`pnpm dev`)
2. Demo app dev server running (`cd demo/app && pnpm dev`)

There's no single "start everything" command.

### Observation
- This is architecturally correct (separation of concerns)
- But could be streamlined with tooling
- Not explicitly documented as the intended workflow

### Recommendation
- Add "Development Workflows" doc section
- Provide npm scripts or tooling to start multi-process setups
- Consider `concurrently` or similar for local dev convenience

---

## 12. Module Execution Context (Node.js)

### Issue
Extension modules run in the extension host process (Node.js), not the browser.

### Observation
- Modules have access to Node APIs (fs, path, etc.)
- Cannot directly manipulate renderer DOM or preview DOM
- This boundary is implicit in architecture docs

### Recommendation
- Explicitly document the process boundaries in extension authoring guide
- Clarify what APIs are available in each context
- Add security implications for future sandboxing

---

## 13. Graph Producer `initialize()` Return Type

### Issue
The `GraphProducer` interface shows:

```typescript
initialize(): Promise<unknown>; // TODO: GraphSnapshot type
```

But implementations must return `GraphSnapshot`.

### Observation
- Type is stubbed as `unknown` with a TODO comment
- Causes TypeScript errors or requires casting

### ✅ RESOLVED (2026-01-11)
- Updated `src/extension-host/extension-context.ts` to properly type `initialize()` as `Promise<GraphSnapshot>`
- Removed TODO comment
- Extension authors can now implement `GraphProducer` without type casts or errors

---

## 14. Override Application Performance

### Issue (Potential)
Overrides are applied by re-rendering React components with new props via context.

### Observation
- For small apps, this is instant
- For large apps with many instances, performance is untested
- No guidance on optimization strategies

### Recommendation
- Document performance characteristics
- Provide profiling guidance for large apps
- Consider batching override application if needed

---

## 15. Component Registry `uiDefaultValue` Semantics

### Issue
Registry entries have `uiDefaultValue` for editable props:

```typescript
exposure: {
  kind: 'editable',
  control: { kind: 'string' },
  uiDefaultValue: 'Click me',
}
```

### Observation
- This is for UI initialization, not code rewriting
- Relation to actual prop defaults in code is unclear
- "Reset" should revert to code baseline, not `uiDefaultValue`

### Recommendation
- Clarify in registry schema docs that this is UI-only
- Document precedence: code baseline > config layer > uiDefaultValue
- Consider renaming to `placeholderValue` or similar to avoid confusion

---

## 16. Scaffa Config Schema Validation

### Issue
`scaffa.config.ts` is loaded by extension host, but validation errors might not surface clearly.

### Observation
- Zod validation happens, but error messages might be in console
- No UI feedback for config errors
- Module path errors are silent (module just doesn't load)

### Recommendation
- Surface config validation errors in UI
- Provide "Config Health" panel or diagnostic command
- Log clear errors when modules fail to load

---

## Summary: Documentation Gaps to Address

1. **Extension Authoring Guide** (new doc)
   - Import paths and SDK structure
   - Complete integration recipes
   - Debugging guide

2. **Development Workflows** (new section in architecture)
   - Multi-process setup
   - Local dev best practices
   - Tooling recommendations

3. **Type ID Consistency** (add to multiple docs)
   - Cross-boundary consistency requirements
   - Validation and debugging

4. **Runtime Adapter Integration** (expand existing doc)
   - Complete three-part recipe
   - Common pitfalls
   - Performance considerations

5. **Override Model Semantics** (clarify in existing doc)
   - uiDefaultValue vs code baseline
   - Reset behavior
   - Precedence rules

6. **Process Model** (expand in architecture)
   - Where logs appear
   - What APIs are available in each process
   - Security boundaries

7. **Config Schema** (expand existing doc)
   - Path resolution behavior
   - Validation and error handling
   - Health checks

---

## Next Steps

These lessons should inform:
1. Architecture doc updates (clarifications and expansions)
2. New "Extension Authoring Guide" document
3. Runtime adapter integration recipe/guide
4. Dev workflow documentation
5. Error messages and validation improvements in code
