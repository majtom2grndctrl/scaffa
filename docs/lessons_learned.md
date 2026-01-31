# Lessons Learned: Building the Demo Workspace

> **Context:** Observations and friction points discovered while implementing `demo/` workspace for v0 walkthrough
> **Date:** 2026-01-11
> **Purpose:** Document gaps, clarifications, and patterns that should be incorporated into formal architecture docs

---

## 0. Update: Pure Harness Model Migration Complete (2026-01-19)

✅ **Completed:** demo/app now demonstrates the pure harness model end-to-end with no Skaffa
editor/runtime adapter imports in production code. (Exception: the demo app uses
`@skaffa/layout-primitives-react` as a runtime UI dependency.)

**Production build:**
`index.html` -> `src/main.tsx` (production bootstrap) -> `src/App.tsx` (router instance) -> `src/routes.tsx` (route definitions) -> `src/pages/*.tsx` -> `src/components/*.tsx` (pure React, no Skaffa editor/runtime deps)

**Skaffa preview:**
`index.html` (transformed by harness plugin) -> virtual harness entry (injected by vite-launcher) -> `SkaffaProvider` (real adapter) -> `src/App.tsx` (router instance) -> `src/routes.tsx` (parsed by graph producer) -> registry-listed components automatically wrapped with `SkaffaInstanceBoundary` (injected by vite-launcher instrumentation plugin)

**Key boundary:**
- `main.tsx` is production-only and NEVER loaded by Skaffa
- Skaffa's harness replaces it in `index.html`
- `App.tsx` is self-contained and creates a router instance by importing route definitions
- Route definitions live in `routes.tsx` (required by react-router-graph-producer in v0)
- Components have NO Skaffa editor/runtime adapter imports - instrumentation is injected at dev-time for registry-listed types only

**Migration artifacts removed:**
- `demo/app/src/skaffa-shim.tsx` (deleted)
- `demo/app/.skaffa-harness.tsx` (deleted, now served as virtual module `/@skaffa/harness.tsx`)
- `@skaffa/react-runtime-adapter` removed from demo/app dependencies

---

## 1. Extension Context API Naming (2026-01-11)

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

## 2. Import Path Complexity for Extension Authors (2026-01-11)

### Issue (historical)
Extension modules need to import from multiple internal paths:

```typescript
import type { ExtensionContext } from '../../../src/extension-host/extension-context.js';
import type { ComponentRegistry } from '../../../src/shared/registry.js';
import type { GraphSnapshot, GraphPatch } from '../../../src/shared/project-graph.js';
```

### Friction Points (historical)
- No single "extension SDK" import
- Relative paths depend on where the module lives
- Not clear which types live where without exploring the codebase

### ✅ RESOLVED (2026-01-11)
- `extension-sdk.ts` provides a stable import surface for extension authors.
- `pnpm build:modules` bundles it to `extension-sdk.js` for runtime imports.
- Extension authoring guide points to the SDK entrypoint.

---

## 3. Workspace Config Relative Paths (2026-01-11)

### Issue (historical)
Module paths in `skaffa.config.js` are relative to the config file location, not the project root:

```typescript
modules: [
  {
    id: 'demo-module',
    path: './extensions/demo-module/index.js', // Relative to demo/
  }
]
```

### Update (2026-01-24)
This is now documented in `docs/skaffa_project_configuration_skaffa_config.md`, and v0 supports:
- Workspace-anchored prefixes (`@/` and `workspace:/`) for clarity
- Package-based modules via `package` (or `id` fallback) for portability
- JS entrypoints (`index.js`) for runtime loading

### Recommendation
- Keep path resolution rules centralized in the config doc
- Prefer package-based modules for workspace portability

---

## 4. Demo App as Separate Runnable (2026-01-11)

### Issue
The demo app is a separate Vite dev server that must run independently. Skaffa previews it via HTTP URL.

### Architectural Implication
- Preview target is not "bundled" with Skaffa
- Requires an external dev server runtime (but Skaffa may manage it via a preview launcher)

### Observation
This is the correct architecture (separation of concerns), but it's not explicitly called out in docs. First-time users might expect:
- A single "start Skaffa with demo" command
- Auto-starting of dev servers
- Embedded preview without HTTP

### Recommendation
- Add a "Dev Workflow" section to architecture docs explaining multi-process model
- Document that preview targets are independent HTTP servers, but can be started in **managed mode** via preview launcher modules
- Clarify when/why this is beneficial (matches production reality, framework-agnostic)

---

## 5. Runtime Adapter Integration Pattern (Recipe) (2026-01-11)

### Issue
Early guidance implied a three-part in-app recipe (provider + per-component wrapper + hook), which conflicted with the Harness Model and suggested Skaffa imports in app code.

### Update
The preferred v0 direction is the Harness Model: the launcher injects `SkaffaProvider` and instruments registry-listed component exports to provide instance identity and override application. App source code remains Skaffa-free.

### Observation
- Instance identity and overrides are provided by launcher instrumentation, not app code.
- Missing instrumentation or registry hints breaks click-to-select or override application.
- Guidance must stay centralized to avoid mixed signals about production dependencies.

### ✅ RESOLVED (2026-01-11)
- `docs/skaffa_runtime_adapter_integration_guide.md` now documents the harness model recipe, common pitfalls, and shim usage.

---

## 6. TypeScript Branded Types and Casting (2026-01-11)

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

## 7. Override Persistence Directory (2026-01-11)

### Issue
Overrides persist to `<workspace>/.skaffa/overrides.v0.json`, but:
- The `.skaffa/` directory is not auto-created
- Unclear if this should be `.gitignore`d or committed
- No error handling documented if directory doesn't exist

### Observation
- I created `.skaffa/.gitkeep` manually
- Skaffa might handle directory creation (not tested)
- Project policy (commit vs ignore) should be documented

### Recommendation
- Document that Skaffa auto-creates `.skaffa/` on first override (if true)
- Provide guidance on whether to commit override files
- Add to workspace setup checklist in docs

---

## 8. Module Activation Logging and Debugging (2026-01-11)

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

## 9. Component Type ID Consistency Requirement (2026-01-11)

### Issue
The `typeId` must match across three places:

1. Component registry: `components: { 'demo.button': { ... } }`
2. Graph producer: `{ kind: 'componentType', id: 'demo.button' }`
3. Runtime instrumentation typeId (launcher wraps exports with `SkaffaInstanceBoundary`)

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

## 10. Preview Session URL Format (2026-01-11)

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

## 11. Dev Workflow: Two-Server Requirement (2026-01-11)

### Issue (historical)
Testing the v0 journey required:

1. Skaffa running (`pnpm dev`)
2. Demo app dev server running (`cd demo/app && pnpm dev`)

There was no single "start everything" command.

### Observation (historical)
- This is architecturally correct (separation of concerns)
- But could be streamlined with tooling
- Not explicitly documented as the intended workflow

### ✅ RESOLVED (2026-01-24)
- `pnpm dev:demo` starts Skaffa + demo app together
- `pnpm demo:refresh-extensions` prepares local tarballs for the demo workspace
- Dev workflow is documented in `docs/skaffa_development_guide.md`

---

## 12. Module Execution Context (Node.js) (2026-01-11)

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

## 13. Graph Producer `initialize()` Return Type (2026-01-11)

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

## 14. Override Application Performance (2026-01-11)

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

## 15. Component Registry `uiDefaultValue` Semantics (2026-01-11)

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

## 16. Skaffa Config Schema Validation (2026-01-11)

### Issue
`skaffa.config.js` is loaded by extension host, but validation errors might not surface clearly.

### Observation
- Zod validation happens, but error messages might be in console
- No UI feedback for config errors
- Module path errors are silent (module just doesn't load)

### Recommendation
- Surface config validation errors in UI
- Provide "Config Health" panel or diagnostic command
- Log clear errors when modules fail to load

---

## Open Documentation Gaps (2026-01-11)

1. **Development Workflows** (new section in architecture)
   - Multi-process setup
   - Local dev best practices
   - Tooling recommendations

2. **Type ID Consistency** (add to multiple docs)
   - Cross-boundary consistency requirements
   - Validation and debugging

3. **Override Model Semantics** (clarify in existing doc)
   - uiDefaultValue vs code baseline
   - Reset behavior
   - Precedence rules

4. **Process Model** (expand in architecture)
   - Where logs appear
   - What APIs are available in each process
   - Security boundaries

5. **Config Schema** (expand existing doc)
   - Path resolution behavior
   - Validation and error handling
   - Health checks
