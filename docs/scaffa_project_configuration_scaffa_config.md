# Scaffa Project Configuration (scaffa.config.ts)

> **Status:** Draft / v0 shape
> **Audience:** Application engineers configuring Scaffa for a project
> **Goal:** Define how a project opts into modules, registries, and editor behavior.

---

## 1. Purpose

The project configuration file defines:
- which Scaffa modules are enabled
- how component registries are composed
- which providers/decorators apply to previews
- project‑specific overrides and constraints

This file is **code**, not JSON, to allow reuse and composition.

---

## 2. File Location

```text
/scaffa.config.ts
```

---

## 3. Top‑Level Shape

```ts
import { defineScaffaConfig } from '@scaffa/config'
import { shadcnModule } from '@scaffa/module-shadcn'
import { internalDSModule } from './scaffa/internal-ds'

export default defineScaffaConfig({
  modules: [
    shadcnModule(),
    internalDSModule(),
  ],

  preview: {
    decorators: [ThemeProvider, RouterProvider],
  },

  components: {
    overrides: {
      'ui.button': {
        controls: {
          variant: { default: 'primary' },
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
modules: ScaffaModule[]
```

Modules may contribute:
- component registries
- inspector controls
- prompts
- preview adapters

Order matters: later modules may override earlier ones.

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

Defines shared preview context.

```ts
preview: {
  decorators?: PreviewDecorator[]
  environment?: Record<string, unknown>
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

## 9. Design Goals

- Explicit, reviewable configuration
- No hidden magic
- Easy to diff in code review
- Safe defaults

---

## 10. Non‑Goals (v0)

- Runtime mutation of config
- GUI editor for config
- Remote config loading

---

## 11. Migration Strategy

Future changes to config shape must:
- be additive when possible
- provide codemods when breaking
- maintain backward compatibility for at least one minor version

