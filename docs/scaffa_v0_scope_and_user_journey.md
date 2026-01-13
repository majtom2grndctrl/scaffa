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

---

## 1. v0 Success Definition

v0 is successful when a designer (within explicit guardrails) can:

1. Launch Scaffa and open a workspace from the Launcher
2. Start an app preview session
3. Select a UI instance via click-to-select
4. Use the Inspector to edit approved props (non-destructive overrides)
5. Reset/clear overrides confidently
6. Persist the override state in a reviewable, shareable form

“Shareable” in v0 means **serializable and diffable** (not necessarily a hosted cloud feature).

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
- Serialize overrides to a local file format (diffable)

---

## 3. Out of Scope (v0)

In addition to `docs/index.md` “Deferred” items, v0 explicitly excludes:

- public extension marketplace
- untrusted extension sandboxing UI
- type-level component authoring UI
- Iteration Deck UI (variants/snapshots/comparisons)
- full runtime tree introspection
- automatic “promote override to code” workflows

---

## 4. First End-to-End User Journey (Narrative)

### Step 1: Launcher → Open Workspace

- Scaffa opens to the Launcher view.
- User selects an existing workspace (project folder) via Open Workspace (or chooses a recent workspace).
- Scaffa loads `scaffa.config.js`.
- Extension host starts and registers enabled modules.
- Effective component registry is composed (module registries + project overrides).

### Step 2: Start App Preview

- User starts an `app` preview session.
- Main process creates and loads the preview runtime.
- Runtime adapter handshakes and announces readiness.
- Scaffa replays any persisted overrides relevant to this session target.

### Step 3: Click-to-Select

- User holds <kbd>Alt/Option</kbd> and clicks a button/card in the preview to select it.
- Runtime adapter resolves the click to `{ instanceId, componentTypeId }`.
- Selection updates in the renderer (Inspector shows “Button” instance).

### Step 4: Inspect and Edit Props

- Inspector lists props based on the registry entry for `componentTypeId`.
- User edits `variant` from “Primary” to “Secondary”.
- Renderer sends `OverrideOp.set` to host.
- Host persists the change and forwards it to runtime adapter.
- Preview updates immediately; Inspector shows the prop as “Overridden”.

### Step 5: Reset

- User clicks “Reset” for `variant`.
- Renderer sends `OverrideOp.clear` to host.
- Host updates persisted overrides and instructs runtime adapter to clear the override.
- Preview returns to baseline; Inspector clears “Overridden” state.

### Step 6: Persist / Share

- Overrides are serialized to a local file in a stable schema.
- User can review the file in git diff, share it, or discard it.

---

## 5. Walkthrough Checklist (Canonical)

Use this checklist to validate the v0 “first user journey” end-to-end. This is the canonical checklist; demo docs should link here rather than duplicating it.

### Pre-flight

- [ ] Start the demo app dev server (e.g. `demo/app` via `pnpm dev`) and note its URL (usually `http://localhost:5173`).
- [ ] Start Scaffa (`pnpm dev` from repo root).
- [ ] From the Launcher, open a workspace configured for Scaffa (use `demo/` for the reference walkthrough).

### Preview session

- [ ] Start an `app` preview session by URL (attached mode): the preview shows the running demo app.
- [ ] (Note) In v0, Scaffa primarily attaches to an already-running dev server; managed preview launchers are future module contributions.
- [ ] Confirm the runtime adapter handshake completes (preview is “ready”).

### Selection (Inspect vs Interact)

v0 interaction contract:
- Default: clicks/links/buttons behave normally (interact mode).
- Inspect: hold <kbd>Alt/Option</kbd> to highlight candidates; <kbd>Alt/Option</kbd>+Click selects (and prevents app interaction for that click).
- Clear selection: <kbd>Esc</kbd> clears the current selection (only when something is selected).

- [ ] Hold <kbd>Alt/Option</kbd> and hover: the instance under the cursor shows a highlight.
- [ ] <kbd>Alt/Option</kbd>+Click a Button instance: Inspector activates and shows instance + props.

### Inspector semantics

- [ ] Inspector uses canonical semantics: editable vs inspect-only vs opaque, and overridden vs not overridden.
- [ ] Editable props show controls; inspect-only/opaque props do not allow edits.

### Overrides (edit → apply → clear)

- [ ] Edit an editable prop: preview updates immediately and Inspector indicates the prop is overridden.
- [ ] Reset/clear the override: preview returns to baseline and Inspector clears overridden state.
- [ ] Verify app behavior still works when not selecting (e.g. normal clicks increment counters / navigate).

### Persistence

- [ ] Persisted overrides update deterministically at `<workspace>/.scaffa/overrides.v0.json`.
- [ ] Restart Scaffa, reopen the workspace, and start preview: persisted overrides are restored without manual file/DB hacking.

---

## 6. Follow-Up Questions (Ticket Drivers)

These questions are expected to produce implementation tickets (not answered by v0 scope alone):

- Where is persisted override state stored by default, and is it committed or ignored?
- What is the minimum supported harness for `component` sessions?
- What constraints do we require for instance ID stability in the first adapter?
