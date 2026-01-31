# Skaffa Project Configuration (skaffa.config.js)

> **Status:** Draft / v0 shape
> **Audience:** Application engineers configuring Skaffa for a project
> **Goal:** Define how a project opts into modules, registries, and editor behavior.

---

## 1. Purpose

The project configuration file defines:
- which Skaffa modules are enabled
- how component registries are composed
- which providers/decorators apply to previews
- project‑specific overrides and constraints

This file is **code**, not JSON, to allow reuse and composition.

---

## 2. File Location

```text
/skaffa.config.js
```

Skaffa loads `skaffa.config.js` at runtime; this is the only supported config file in v0.

---

## 3. Top‑Level Shape

```js
// Preferred (portable): import from a published or packed package
import { defineSkaffaConfig } from '@skaffa/config'

// In-repo development shortcut:
// import { defineSkaffaConfig } from '../src/shared/config.js'

export default defineSkaffaConfig({
  modules: [
    {
      id: 'layout-extension',
      path: './extensions/layout/module/index.js',
    },
  ],

  preview: {
    // Harness Model (managed launchers) uses these to mount the app in preview.
    entry: './src/App.tsx',
    styles: ['./src/index.css'],
    decorators: [ThemeProvider, RouterProvider],
  },

  components: {
    overrides: {
      'ui.button': {
        props: {
          variant: {
            exposure: { uiDefaultValue: 'primary' },
          },
        },
      },
    },
  },
})
```

---

## 4. Modules

Modules are the primary extension mechanism.

```ts
modules: SkaffaModule[]
```

Modules may contribute:
- component registries
- inspector controls
- prompts
- preview adapters

Order matters: later modules may override earlier ones.

### 4.1 Module `path` Resolution (v0)

In v0, modules are loaded from file paths.

Rule:
- A module `path` is resolved **relative to the directory containing `skaffa.config.js`**.
- Module entrypoints must be **runtime-loadable JavaScript** (e.g. `index.js`). If you author modules in TypeScript, compile/bundle them before Skaffa loads the workspace.

Example:
- `demo/skaffa.config.js` with `path: './extensions/layout/module/index.js'` resolves to `demo/extensions/layout/module/index.js`.

Extension bundles commonly live under `extensions/<name>/` and may include:
- `module/` (extension-host entrypoint referenced by `skaffa.config.js`)
- `packages/` (optional runtime libraries imported by app/source code)

Also supported in v0:
- **Workspace-anchored prefixes**:
  - `path: '@/extensions/demo-module/index.js'` resolves to `<workspaceRoot>/extensions/demo-module/index.js`
  - `path: 'workspace:/extensions/demo-module/index.js'` resolves to `<workspaceRoot>/extensions/demo-module/index.js`
- **Package-based modules**:
  - `package: '@skaffa/some-module'` is resolved using Node.js module resolution anchored at `<workspaceRoot>`.
  - If `package` is omitted, Skaffa will also attempt to resolve `id` as a package specifier.

### 4.2 Package-Based Imports: Workspace Prerequisites (v0)

`skaffa.config.js` executes in Node, so **package-based imports require the package
to be installed in the workspace** (the directory containing `skaffa.config.js`).

Examples:

```bash
# In a real project (registry install)
pnpm add -D @skaffa/config

# In the demo workspace (local tarballs)
pnpm demo:refresh-extensions
```

Notes:
- This does **not** require a `pnpm-workspace.yaml`; standard Node module resolution applies.
- For module `package` entries, ensure those extension packages are installed in the same
  workspace root as `skaffa.config.js`.

---

## 5. Component Registry Overrides

Projects may refine or restrict module‑provided registries.

```ts
components: {
  overrides: Record<ComponentTypeId, ComponentOverride>
}
```

Common uses:
- mark props as non‑editable
- adjust default values
- rename labels
- disable components entirely

---

## 6. Preview Configuration

Defines shared preview context and (for managed launchers) what to mount.

```ts
preview: {
  /**
   * Harness Model: module specifier for the preview root component.
   * Example: "./src/App.tsx"
   */
  entry?: string
  /**
   * Harness Model: list of style module specifiers to import before mounting.
   * Example: ["./src/index.css"]
   */
  styles?: string[]
  decorators?: PreviewDecorator[]
  environment?: Record<string, unknown>
  /**
   * Optional default launcher preference for `app` sessions.
   * The Preview Session Target still carries the authoritative `launcherId`.
   */
  launcher?: { id: string; options?: Record<string, unknown> }
}
```

Decorators are applied to both app and component previews.

---

## 7. AI Prompt Configuration (Phase 1)

Projects may add or override prompt templates.

```ts
ai: {
  prompts?: PromptTemplate[]
}
```

This allows teams to standardize AI usage patterns.

---

## 8. Constraints & Guardrails

Projects may explicitly restrict behavior.

Examples:
- disable AI‑generated code writes
- restrict editable props
- mark files as read‑only

These constraints are enforced by core services.

---

## 9. Validation and Error Surfacing (v0)

`skaffa.config.js` is validated with a schema (Zod). In v0:
- Config validation errors are surfaced in the **ConfigHealthBanner** (visible below the header)
- Module activation failures are displayed in the banner with actionable error messages
- Detailed diagnostics are also logged to the developer console for debugging
- The app remains usable even when config validation fails (falls back to default config)

---

## 10. Design Goals

- Explicit, reviewable configuration
- No hidden magic
- Easy to diff in code review
- Safe defaults

---

## 11. Non‑Goals (v0)

- Runtime mutation of config
- GUI editor for config
- Remote config loading

---

## 12. Migration Strategy

Future changes to config shape must:
- be additive when possible
- provide codemods when breaking
- maintain backward compatibility for at least one minor version
