# Scaffa Inspector UX Rules & Semantics (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors and extension/module authors  
> **Goal:** Define the Inspector’s semantics and affordances so core + extensions present consistent meaning for editability, overrides, and escape hatches.

## Agent TL;DR

- Load when: implementing or changing **Inspector behavior**, meanings, and state-driven affordances.
- Primary semantics: editability (`editable | inspect-only | opaque`) and override state (`not overridden | overridden | orphaned`).
- Key rule: extensions may add sections, but must not invent new meanings or hidden side effects.
- Visual language is defined elsewhere: `docs/design/visual-language.md` and `docs/design/colors.md`.
- Also load: `docs/scaffa_component_registry_schema.md` (controls), `docs/scaffa_override_model.md` (data/persistence).

Related:
- [Architecture Plan](./index.md)
- [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)

---

## 1. Inspector Mental Model

The Inspector operates on a **selected instance** in the preview (not a component type definition).

Selection in v0 is explicit so the preview remains a high-fidelity runtime:
- Default: click-to-select in the Editor View canvas (app interaction is suppressed in the editor session).
- <kbd>Esc</kbd> clears selection when something is selected.

For each prop on that instance, the Inspector answers:

- What is the current value?
- Is it editable? If so, how?
- Is the value overridden? If so, how do I reset it?
- If I can’t edit it here, how do I inspect/escape to code?

The Inspector is the primary UX manifestation of Scaffa’s guiding principle:

> Scaffa edits what it can prove is safe to edit, displays what it cannot, and always provides an escape hatch to code.

---

## 2. Vocabulary (Canonical)

### 2.1 Editability States

Each prop MUST be in exactly one of:

- **Editable**: UI control is available; edits create/update overrides.
- **Inspect-only**: value is visible but cannot be edited in Scaffa.
- **Opaque**: value is not safely representable; show placeholder + escape hatch.

Editability is declared by the **component registry** and refined by **project config overrides**.

### 2.2 Override States

Each prop MUST be in exactly one of:

- **Not overridden**: value comes from baseline (code + any config layer).
- **Overridden**: a user override is applied for this prop path.
- **Orphaned override**: an override exists but cannot be applied (instance not found / locator mismatch).

(Multi-select “mixed” states are deferred until multi-selection exists.)

---

## 3. UI Affordances by State

### 3.1 Editable

When a prop is **editable**:

- Render a control defined by `docs/scaffa_component_registry_schema.md` (`ControlDefinition`)
- Committing a new value creates a **non-destructive override** (see `docs/scaffa_override_model.md`)
- Show validation errors inline if constraints are declared (required/min/max/pattern)
- If overridden, show a clear “Overridden” indicator and a reset action

### 3.2 Inspect-only

When a prop is **inspect-only**:

- Render value in a read-only presentation
- Do not present editable controls
- Provide an escape hatch action if a source reference exists:
  - **Inspect Source** (open file/line), or
  - **Copy Source Location** (fallback)

Inspect-only means: “Scaffa knows what this is, but will not mutate it in v0.”

### 3.3 Opaque

When a prop is **opaque**:

- Render a placeholder (e.g. “Opaque value”)
- Provide a reason if available (“function”, “class instance”, “non-serializable”, “unsafe to edit”)
- Always provide an escape hatch (inspect source / open code)

Opaque means: “Scaffa cannot safely represent this value, even read-only.”

---

## 4. Override UX (Set / Reset / Clear)

### 4.1 Setting an Override

Inspector edits create `OverrideOp: set` operations addressed by:

- selected instance (`sessionId + instanceId` at runtime)
- prop path (`PropPath` JSON Pointer)

The UI MUST reflect the override immediately:
- value changes in the field
- “Overridden” indicator appears
- “Reset” becomes available

### 4.2 Resetting an Override

“Reset” removes the **user override layer** for that prop path and returns to the effective baseline:

- baseline value from code, potentially with a config layer applied

Reset does NOT mean “set to `uiDefaultValue`”; registry `uiDefaultValue` is UI-only metadata used to initialize controls and communicate intended defaults.

Reset MUST be reversible by re-applying the same override (undo/redo is a separate capability, but the model should allow it).

### 4.4 Saving Changes to Disk (v0)

v0 includes a “Save” action that converts draft overrides into concrete workspace edits (working tree):

- Saving writes code changes to disk and clears draft overrides that were successfully applied.
- If some overrides cannot be safely saved, Scaffa keeps them as draft overrides and surfaces an error (no silent dropping).

### 4.3 Orphaned Overrides

If an override cannot be applied (instance moved/removed), the Inspector (or a dedicated Overrides panel) MUST surface it as **orphaned**:

- indicate which component type + prop path it targeted
- provide actions:
  - clear override
  - attempt rebind (future)

---

## 5. Escape Hatches (v0)

Every prop MUST provide an escape hatch path:

- If a `SourceRef` exists: **Open Source** (main process opens in user’s editor)
- If no source: **Copy Instance/Prop Address** for engineers to debug

v0 includes “Save” at the workspace level. Future versions may add per-prop “Promote” actions with finer-grained control.

---

## 6. Consistency Rules for Extensions

Extensions may contribute Inspector sections (see `docs/scaffa_extension_api.md`), but MUST comply with core semantics:

1. **No new meanings.** Extensions cannot introduce alternative editability states beyond editable/inspect-only/opaque.
2. **No hidden side effects.** Inspector interactions must translate to:
   - override operations, or
   - explicit commands with visible effects.
3. **Controls must be canonical.** Extensions must render or request canonical control kinds. If a new control is needed, it is added to the canonical schema first.
4. **Respect project guardrails.** If project configuration marks a prop as non-editable, extensions must not offer editing UI for it.

---

## 7. Non-Goals (v0)

- Multi-instance editing semantics (“mixed” values)
- Arbitrary custom Inspector widgets per extension
- git workflow automation (auto-commit/branch/PR)
