# Skaffa Testing Guide

## Purpose

Tests in Skaffa serve two primary purposes:
1. **Verify correctness**
2. **Document system behavior** for AI agents and developers

This means tests should focus on **Skaffa-specific behavior and interactions**, not language or framework basics.

---

## What to Test

### ✅ Prioritize Skaffa-Specific Behavior

**1) Cross-process communication (IPC)**
- Renderer ⇄ Main ⇄ Extension Host flows
- Subscription lifecycle and update handling

**2) Registry-driven behavior**
- How metadata shapes the Inspector UI
- Exposure kinds (editable/inspect-only/opaque)
- Prop grouping and ordering semantics

**3) Critical user workflows**
- User action → state change → IPC → effect
- Error handling and edge cases that impact workflow

**4) Skaffa-specific logic**
- JSON parsing/validation in JsonControl
- Override conflict detection (orphaned overrides)
- Graph or registry transformations
- Module loading/activation boundaries

---

## What Not to Test

- HTML/React basics (rendering inputs, DOM element types)
- Framework features (state updates, hooks behavior)
- External libraries (JSON.parse, Zustand internals)
- CSS/styling unless it affects behavior

---

## Test Types (Suggested)

**Unit**
- Component logic (InspectorPanel, PropControls)
- Store logic (inspectorStore subscriptions + state updates)
- Utility logic (override detection, registry transforms)

**Integration**
- User workflows spanning IPC and state
- Registry-driven prop rendering with real store state

---

## Writing Good Tests

### 1) Test behavior, not implementation
Prefer observable outcomes: UI state, IPC calls, or store outputs.

### 2) Simulate real interaction flows
Model the actual lifecycle: IPC event → store update → UI render.
Avoid over-mocking that hides the interaction.

### 3) Use clear, specific test names
Names should describe the exact behavior and boundary being validated.

### 4) Keep test harnesses stable and quiet
- In jsdom tests, **never replace `globalThis.window`**; attach `window.skaffa` instead.
- Use `waitFor`/`act` for async UI updates (avoid `setTimeout`-based waits).
- If a test intentionally triggers a warning/error, suppress it **inside that test only** and restore afterward.
- Prefer local fixture modules for module-loader tests (avoid relying on build artifacts).

---

## Quick Decision Tree

1) **Is this Skaffa-specific behavior?**
   - Yes → write it
   - No → skip it

2) **Does it show how the system behaves across boundaries?**
   - Yes → write it
   - No → reconsider

3) **Could an AI agent learn a real workflow from this test?**
   - Yes → write it
   - No → skip it

4) **Is this a real user scenario?**
   - Yes → write it
   - No → reconsider

---

## Example (Good)

```typescript
it('registers selection listener and updates state on selection change', async () => {
  await useInspectorStore.getState().initialize();

  expect(mockOnSelectionChanged).toHaveBeenCalled();

  selectionCallback!({ selected: newSelection });

  expect(useInspectorStore.getState().selectedInstance).toEqual(newSelection);
});
```

**Why this is good**
- Shows IPC subscription lifecycle
- Documents how selection flows into state

## Example (Setup Prerequisites)

Tests that validate workspace setup prerequisites are valuable because they
document how filesystem layout impacts runtime behavior.

```typescript
it('loads skaffa.config.js when @skaffa/config is installed in the workspace', async () => {
  const configModule = await import(configPath);

  expect(configModule.default.schemaVersion).toBe('v0');
});
```

**Why this helps**
- Captures the package-resolution dependency for config loading
- Guards against regressions in workspace portability

---

## Running Tests

```bash
pnpm test
pnpm test:watch
pnpm test:ui
pnpm test:coverage
```

---

## Summary

Write tests that:
- Document IPC and registry-driven behavior
- Cover real user workflows and failure modes
- Teach AI agents how Skaffa works

Avoid tests that:
- Only prove frameworks or language features
- Duplicate coverage without new insight
