# Scaffa Save-to-Disk Protocol (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors, React adapter authors, and extension authors  
> **Goal:** Define the canonical contract for validating draft overrides and promoting them into working-tree code edits (“Save”), including UX expectations and cross-process responsibilities.

## Agent TL;DR

- Source of truth for: **draft override validation**, **promotion to code**, **atomic Save semantics**, and **revert-on-failure UX**.
- Owns: how renderer schedules validation (blur + 7s idle), how the extension host returns promotability results, and how main applies edits transactionally.
- In v0, “Save to Disk” is implemented by **framework-specific extensions** (starting with React) and orchestrated by Scaffa core.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Inspector UX Rules & Semantics](./scaffa_inspector_ux_semantics.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- [IPC Boundaries + Key Sequence Diagrams](./scaffa_ipc_boundaries_and_sequences.md)
- [Scaffa Extension API – v0 Sketch](./scaffa_extension_api.md)
- [Scaffa Workspace Edit Protocol](./scaffa_workspace_edit_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)

---

## 1. Definitions

### 1.1 Draft Override

A **draft override** is an unsaved, instance-scoped change applied to the running Editor View runtime for immediate feedback.

- It is addressed by `(sessionId, instanceId, propPath)`.
- It is reversible (clear/reset returns to baseline).
- It is not yet a workspace file edit.

### 1.2 Save to Disk (Promotion)

**Save** converts the current set of draft overrides into concrete **workspace file edits** (working tree), writes them transactionally, and then clears the corresponding drafts because the code baseline now includes the change.

In v0, promotion is intentionally **framework-specific** (starting with React).

### 1.3 Validation

**Validation** is a dry-run promotion: “can this draft override be represented as a safe code edit?”

Validation is required because not all runtime changes can be mapped to code edits (e.g. values derived from expressions, spreads, or non-literal sources).

---

## 2. Ownership and Process Boundaries

### 2.1 Renderer (Workbench UI)

- Applies draft overrides immediately (for fast preview feedback).
- Schedules validation per field:
  - validate on blur
  - validate after 7 seconds of no further changes (per-field idle debounce)
- Renders validation state (`idle | validating | valid | error`).
- On validation failure: reverts visually and requires the user to re-enter (see §4.3).
- Initiates Save (workspace-wide, atomic).

### 2.2 Main Process (Host)

- Owns authoritative draft override store (and persistence if enabled).
- Routes validation and promotion requests to the extension host.
- Applies workspace file edits transactionally via a write capability (see `WorkspaceAPI.applyEdits` and `docs/scaffa_workspace_edit_protocol.md`).
- Broadcasts save/validation results back to the renderer.

### 2.3 Extension Host (Framework Save Logic)

- Implements framework-specific mapping from draft overrides → `FileEdit[]`.
- Provides:
  - per-field validation (dry-run)
  - workspace-wide promotion plan (Save)
- Uses `WorkspaceAPI` for any workspace reads (main-owned capability; may be sidecar-backed). Extensions must not read workspace files directly.

### 2.4 Runtime Adapter (Preview Runtime)

- Applies/clears draft overrides at runtime.
- Is not responsible for saving or validation logic.

---

## 3. Canonical Data Shapes (Conceptual)

These shapes are “contract intent”. Exact IPC schemas may differ, but the semantics must match.

```ts
export type DraftOverrideAddress = {
  sessionId: string;
  instanceId: string;
  propPath: string; // JSON Pointer
};

export type DraftOverride = DraftOverrideAddress & {
  value: unknown; // JSON-only values in v0 override model
};

export type ValidationState = "idle" | "validating" | "valid" | "error";

export type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "unpromotable" | "notFound" | "unsupportedPattern" | "internalError";
      message: string;
    };

export type SaveResult = {
  ok: boolean;
  appliedCount: number;
  failed: Array<{
    address: DraftOverrideAddress;
    result: ValidationResult;
  }>;
};
```

---

## 4. Validation Contract (Per-Field)

### 4.1 When Validation Runs

Validation is scheduled by the renderer using two triggers:

- **On blur** for text-like controls where “mid-edit” is common.
- **On idle**: validate after **7 seconds** of no value changes for that field (per-field debounce).

Controls without a “mid-edit” state (select/toggle) MAY validate immediately.

### 4.2 Cancellation / Stale Results

Validation results MUST be applied only if they correspond to the latest edit for that field.

Implementation guideline:
- Maintain a per-field monotonic `editVersion` (keyed by `instanceId + propPath`).
- When scheduling validation, capture the `editVersion`.
- Ignore results that arrive with an older `editVersion`.

### 4.3 Failure Semantics (Revert-on-Failure)

If validation fails for a draft override:

- Scaffa MUST clear that draft override (runtime reverts to baseline).
- The Inspector field MUST enter an **error state** and require re-entry.
- The UI SHOULD show:
  - a concise failure reason
  - the last attempted value (read-only), if helpful
  - a suggested next action (“try again”, “open source”, etc.)

Rationale: v0 aims for a workflow where “what you see” is promotable, reducing surprise at Save time.

---

## 5. Save Contract (Workspace-Wide, Atomic)

### 5.1 Scope

Save promotes **all draft overrides across the workspace** (not only the selected instance).

### 5.2 Atomicity Policy

Default v0 policy is **all-or-nothing**:

- Compute a complete promotion plan for all draft overrides.
- If any draft override is unpromotable, **write nothing** to disk.

This is aligned with typical user expectations for “Save”.

### 5.3 Post-Save State

On success:

- Apply file edits transactionally.
- Clear the corresponding draft overrides (they are now code baseline).
- Surface a concise summary (count of changes, files touched).

On failure (all-or-nothing):

- Do not write any files.
- For each failing override:
  - apply revert-on-failure semantics (§4.3)
- Keep remaining draft overrides in place (unless you choose to revert them as well; v0 default is only revert failed ones).

---

## 6. v0 React Promotion Constraints

v0 React promotion should intentionally start narrow:

- **Minimum promotable pattern:** JSX props that are literals, e.g.:
  - `variant="primary"`
  - `disabled={true}`
  - `size="sm"`
  - `count={3}`

Non-goals for the initial promoter:
- rewriting expressions (`variant={isActive ? "primary" : "secondary"}`)
- rewriting spreads (`<Button {...props} />`)
- code motion / refactors

When promotion is not supported, return `ValidationResult.ok=false` with a specific `code` and message.

---

## 7. Non-Goals (v0)

- Preview Mode (separate interact-by-default session)
- Git workflow automation (auto-commit/branch/PR)
- Auto-promoting on a timer without explicit product decision

---

## Appendix: Sidecars (Planned)

Sidecars are an implementation detail behind main-owned capabilities:
- Main may service `WorkspaceAPI` calls via a workspace sidecar for large workspaces.
- Save-to-disk ownership boundaries do not change: main still applies edits transactionally, and the extension host still produces a promotion plan.

See: [Scaffa Sidecar Process](./scaffa_sidecar_process.md)
