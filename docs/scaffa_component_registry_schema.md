# Scaffa Component Registry Schema (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Module authors and Scaffa core contributors  
> **Goal:** Define the canonical schema for component metadata that powers the Inspector (editability, controls, defaults, grouping) and enables registry composition across modules and projects.

## Agent TL;DR

- Load when: adding/changing **Inspector-editable props** or the **canonical control schema** contributed by modules.
- Primary artifacts: `ComponentTypeId`, `ControlDefinition` union, prop editability states, grouping/ordering semantics.
- Key invariant: `ComponentTypeId` must match across **registry ↔ graph ↔ runtime adapter ↔ overrides**.
- Also load: `docs/scaffa_inspector_ux_semantics.md`, `docs/scaffa_override_model.md`, `docs/scaffa_project_configuration_scaffa_config.md`.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Project Configuration (`scaffa.config.ts`)](./scaffa_project_configuration_scaffa_config.md)
- [Scaffa Inspector UX Rules & Semantics](./scaffa_inspector_ux_semantics.md)

---

## 1. Purpose

A **Component Registry** is type-level metadata for a component library. It answers:

- Which component types exist (stable IDs)
- Which props are **editable** vs **inspect-only** vs **opaque**
- How editable props should be edited (control type, defaults, constraints)
- How the Inspector groups and labels fields

Registries are:
- **Contributed by modules** (extension host)
- **Composed** into a single effective registry for a workspace
- **Overridden** by project configuration (`scaffa.config.ts`)

---

## 2. Stable Type IDs

Every component registry entry MUST be keyed by a **stable type ID**:

- Stable across time and across projects
- Independent of file paths and build output
- Used across boundaries: registry, graph, runtime adapter, overrides

Recommended format:

- reverse-domain or namespace-like: `ui.button`, `marketing.heroBanner`, `ds.inputs.textField`

---

## 3. Canonical TypeScript Schema

The schema is designed to be represented as TypeScript types and validated with Zod in implementation.

```ts
export type ComponentTypeId = string;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type InspectorGroupId = string; // e.g. "Appearance", "Layout", "Content"

export type ComponentRegistry = {
  schemaVersion: "v0";
  components: Record<ComponentTypeId, ComponentRegistryEntry>;
};

export type ComponentRegistryEntry = {
  typeId: ComponentTypeId;
  displayName: string;

  // Optional grouping/filtering metadata
  tags?: string[];
  description?: string;

  // Prop metadata keyed by prop name (as used at runtime)
  props: Record<string, PropDefinition>;
};

export type PropDefinition = {
  propName: string;

  label?: string;
  description?: string;

  group?: InspectorGroupId;
  order?: number;

  exposure: PropExposure;
};

export type PropExposure =
  | {
      kind: "editable";
      control: ControlDefinition;

      // UI-only default used for form initialization and empty-state affordances.
      // This does NOT rewrite code, and "Reset" clears the user override layer (revealing the baseline).
      // See precedence rules in `docs/scaffa_override_model.md`.
      uiDefaultValue?: JsonValue;

      // Common constraints for validation / affordances.
      constraints?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string; // regex source string
      };
    }
  | {
      kind: "inspectOnly";
      // Optional hints for display (e.g. show function name instead of full serialization).
      displayHint?: "summary" | "json" | "code";
    }
  | {
      kind: "opaque";
      reason?: string; // why it can't be inspected/edited safely
    };
```

### 3.1 Control Definitions

Controls are a discriminated union. Extensions MUST NOT invent new control semantics in the Inspector; new controls must be added to the canonical union.

```ts
export type ControlDefinition =
  | {
      kind: "string";
      placeholder?: string;
      multiline?: boolean;
    }
  | {
      kind: "number";
      step?: number;
      unit?: string; // e.g. "px", "%"
    }
  | {
      kind: "boolean";
    }
  | {
      kind: "select";
      options: Array<{
        value: string;
        label: string;
        description?: string;
      }>;
    }
  | {
      kind: "color";
      format?: "hex" | "rgb" | "hsl";
    }
  | {
      // Slot/children editing is conceptually supported but may be limited in v0 UX.
      kind: "slot";
      slotName?: string; // default: "children"
      editable?: boolean; // if false, renders as inspect-only in UI
    }
  | {
      // Escape hatch: edit as JSON when structured editing is unavailable.
      // Use sparingly; prefer explicit controls.
      kind: "json";
    };
```

---

## 4. Composition and Overrides

### 4.1 Module Composition Order

Modules contribute registries in a deterministic order (module list order in config).

Composition rules (v0):
- Start with an empty registry.
- Merge each module’s `components` map in order.
- If two modules define the same `typeId`, **later modules win**.

This keeps overrides explicit and predictable.

### 4.2 Project Overrides Layer

Project configuration (`scaffa.config.ts`) applies **after** module composition.

Overrides can:
- disable a component type entirely (hide it in UI, forbid overrides)
- change prop exposure (editable ↔ inspectOnly ↔ opaque)
- adjust control defaults/constraints/labels

Conceptual override shape:

```ts
export type ProjectRegistryOverrides = {
  components: Record<
    ComponentTypeId,
    {
      disabled?: boolean;
      displayName?: string;
      props?: Record<
        string,
        Partial<Omit<PropDefinition, "propName">> & {
          exposure?: Partial<PropExposure>;
        }
      >;
    }
  >;
};
```

---

## 5. Examples

### 5.1 Example: `ui.button`

```ts
const buttonEntry: ComponentRegistryEntry = {
  typeId: "ui.button",
  displayName: "Button",
  tags: ["ui", "inputs"],
  props: {
    variant: {
      propName: "variant",
      label: "Variant",
      group: "Appearance",
      order: 10,
      exposure: {
        kind: "editable",
        control: {
          kind: "select",
          options: [
            { value: "primary", label: "Primary" },
            { value: "secondary", label: "Secondary" },
            { value: "ghost", label: "Ghost" },
          ],
        },
        uiDefaultValue: "primary",
      },
    },
    size: {
      propName: "size",
      label: "Size",
      group: "Appearance",
      order: 20,
      exposure: {
        kind: "editable",
        control: {
          kind: "select",
          options: [
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ],
        },
        uiDefaultValue: "md",
      },
    },
    disabled: {
      propName: "disabled",
      label: "Disabled",
      group: "Behavior",
      order: 10,
      exposure: {
        kind: "editable",
        control: { kind: "boolean" },
        uiDefaultValue: false,
      },
    },
    onClick: {
      propName: "onClick",
      label: "onClick",
      group: "Behavior",
      order: 999,
      exposure: { kind: "inspectOnly", displayHint: "code" },
    },
    children: {
      propName: "children",
      label: "Children",
      group: "Content",
      order: 10,
      exposure: {
        kind: "editable",
        control: { kind: "slot", slotName: "children", editable: false },
      },
    },
  },
};
```

### 5.2 Example: `ui.card`

```ts
const cardEntry: ComponentRegistryEntry = {
  typeId: "ui.card",
  displayName: "Card",
  tags: ["ui", "layout"],
  props: {
    padding: {
      propName: "padding",
      label: "Padding",
      group: "Layout",
      exposure: {
        kind: "editable",
        control: {
          kind: "select",
          options: [
            { value: "none", label: "None" },
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ],
        },
        uiDefaultValue: "md",
      },
    },
    elevated: {
      propName: "elevated",
      label: "Elevation",
      group: "Appearance",
      exposure: {
        kind: "editable",
        control: { kind: "boolean" },
        uiDefaultValue: false,
      },
    },
    children: {
      propName: "children",
      label: "Children",
      group: "Content",
      exposure: {
        kind: "editable",
        control: { kind: "slot", slotName: "children", editable: false },
      },
    },
  },
};
```

---

## 6. Non-Goals (v0)

- Inferring registries automatically from code
- Supporting arbitrary custom Inspector controls per extension without core schema support
- Full slot/children authoring UI (slot is represented, but editing UX may be deferred)
