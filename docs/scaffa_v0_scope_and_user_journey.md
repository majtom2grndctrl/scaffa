# Scaffa v0 Scope + First User Journey

> **Status:** Draft / v0 planning  
> **Audience:** Scaffa core contributors and product stakeholders  
> **Goal:** Define what is in scope for v0, what is out of scope, and describe the first end-to-end user journey that exercises preview, selection, Inspector editing, and overrides.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- [Scaffa Save-to-Disk Protocol](./scaffa_save_to_disk_protocol.md)

---

## 1. v0 Success Definition

v0 is successful when a designer (within explicit guardrails) can:

1. Launch Scaffa and open a workspace from the Launcher
2. Start an **Editor View** session (embedded runtime in the Workbench)
3. Select a UI instance via click-to-select in Editor View
4. Use the Inspector to edit approved props (draft overrides)
5. **Save changes to the project** (writes working-tree code edits)
6. Reset/clear draft overrides confidently
7. See changes reflected in the running Editor View (via reload/HMR)

“Shareable” in v0 means **diffable** (primarily via normal code diffs; git workflow automation is future).

---

## 2. In-Scope Deliverables (v0)

### 2.1 Application Shell (Electron)

- Multi-process model enforced (main / preload / renderer)
- Renderer is isolated (no direct Electron or Node APIs)

### 2.2 Workspace + Configuration

- Load `scaffa.config.js` and module list
- Apply project-level registry overrides (see `docs/scaffa_project_configuration_scaffa_config.md`)

### 2.3 Extension Host (Trusted)

- Dedicated process that runs modules
- Modules can contribute:
  - component registries
  - framework adapters (graph producers + runtime adapter bundles)

### 2.4 Preview Sessions (App-first)

- Start/stop an `app` preview session (see `docs/scaffa_preview_session_protocol.md`)
- Basic session lifecycle state in UI
- Support reload/reconnect semantics

### 2.5 Selection (Click-to-Select)

- Runtime adapter emits selection events
- Renderer updates selection state and Inspector panel

### 2.6 Inspector (Instance-first)

- Display props for selected instance with canonical semantics:
  - editable vs inspect-only vs opaque
  - overridden vs not overridden
- Use canonical controls from registry schema

### 2.7 Override Model + Persistence

- Canonical override addressing and precedence (see `docs/scaffa_override_model.md`)
- Transactional set/reset/clear operations
- Persist draft overrides locally so they survive reloads/restarts (optional but recommended)

### 2.8 Save to Disk (v0)

- Convert draft overrides into concrete workspace file edits (working tree)
- Apply edits transactionally (see Workspace API in `docs/scaffa_extension_api.md`)
- Clear draft overrides that were successfully saved, so “baseline” becomes the new code

---

## 3. Out of Scope (v0)

In addition to `docs/index.md` “Deferred” items, v0 explicitly excludes:

- public extension marketplace
- untrusted extension sandboxing UI
- type-level component authoring UI
- Iteration Deck UI (variants/snapshots/comparisons)
- full runtime tree introspection
- Preview Mode (separate interact-by-default session)
- git workflow automation (auto-commit/branch/PR)

---

## 4. First End-to-End User Journey (Narrative)

### Step 1: Launcher → Open Workspace

- Scaffa opens to the Launcher view.
- User selects an existing workspace (project folder) via Open Workspace (or chooses a recent workspace).
- Scaffa loads `scaffa.config.js`.
- Extension host starts and registers enabled modules.
- Effective component registry is composed (module registries + project overrides).

### Step 2: Start App Preview

- User starts an `app` preview session for **Editor View**.
- In v0, session start UX lives in the **Preview Sessions** panel: click **Start Session** to open a modal where you either:
  - pick a launcher (managed mode, recommended for Vite Harness Model), or
  - enter a dev-server URL (attached mode, escape hatch)
- Main process creates and loads the preview runtime.
- Runtime adapter handshakes and announces readiness.
- Scaffa replays any persisted overrides relevant to this session target.

### Step 3: Click-to-Select

- In **Editor View**, user clicks a button/card in the embedded runtime to select it (clicks are consumed for selection).
- Runtime adapter resolves the click to `{ instanceId, componentTypeId }`.
- Selection updates in the renderer (Inspector shows “Button” instance).

### Step 4: Inspect and Edit Props

- Inspector lists props based on the registry entry for `componentTypeId`.
- User edits `variant` from “Primary” to “Secondary”.
- Renderer sends `OverrideOp.set` to host.
- Host persists the change and forwards it to runtime adapter.
- Preview updates immediately; Inspector shows the prop as “Overridden”.

### Step 5: Save to Disk

- User clicks “Save” (or invokes the Save command).
- Scaffa converts draft overrides into workspace edits (file patches) and writes them to disk.
- The running app reflects the changes via HMR or reload.
- Draft overrides that were saved are cleared (the new code becomes the baseline).

### Step 6: Reset

- User clicks “Reset” for `variant` (or “Reset All”).
- Renderer sends `OverrideOp.clear` to host.
- Host updates draft override state and instructs runtime adapter to clear the override.
- Preview returns to baseline; Inspector clears “Overridden” state.

---

## 5. Walkthrough Checklist (Canonical)

Use this checklist to validate the v0 “first user journey” end-to-end. This is the canonical checklist; demo docs should link here rather than duplicating it.

### Pre-flight

- [ ] Start Scaffa (`pnpm dev` from repo root).
- [ ] From the Launcher, open a workspace configured for Scaffa (use `demo/` for the reference walkthrough).

### Preview session

- [ ] Start an `app` preview session via a launcher (managed mode) for **Editor View**: the center workspace shows the running demo app.
- [ ] (Fallback) If you start a dev server manually, you can attach by URL (attached mode), but Harness Model guarantees (virtual harness + instrumentation) are not provided unless the server is started with Scaffa’s injected tooling.
- [ ] Confirm the runtime adapter handshake completes (preview is “ready”).

### Selection (Editor View)

v0 interaction contract:
- **Editor View:** click-to-select by default; clicks do not trigger app interaction in the editor session.
- Clear selection: <kbd>Esc</kbd> clears the current selection (only when something is selected).

- [ ] In Editor View, click a Button instance: Inspector activates and shows instance + props.

### Inspector semantics

- [ ] Inspector uses canonical semantics: editable vs inspect-only vs opaque, and overridden vs not overridden.
- [ ] Editable props show controls; inspect-only/opaque props do not allow edits.

### Overrides (edit → apply → clear)

- [ ] Edit an editable prop: preview updates immediately and Inspector indicates the prop is overridden.
- [ ] Reset/clear the override: preview returns to baseline and Inspector clears overridden state.
- [ ] Verify selection highlight tracks selection, and clicks do not trigger app navigation/handlers in the editor session.

### Save to Disk

- [ ] Edit an editable prop (draft override): preview updates immediately and Inspector indicates the prop is overridden.
- [ ] Click Save: Scaffa writes working-tree edits and the running app reflects the change.
- [ ] Clear draft overrides: verify the saved change remains (it is now code baseline).

---

## 6. Follow-Up Questions (Ticket Drivers)

These questions are expected to produce implementation tickets (not answered by v0 scope alone):

- Where is persisted override state stored by default, and is it committed or ignored?
- What is the minimum supported harness for `component` sessions?
- What constraints do we require for instance ID stability in the first adapter?
