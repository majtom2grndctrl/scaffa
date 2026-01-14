# Scaffa Override Model + Persistence (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors, adapter authors, and extension authors  
> **Goal:** Define the canonical non-destructive override data model, precedence rules, lifecycle operations, and v0 persistence/serialization strategy.

## Agent TL;DR

- Load when: implementing **set/clear/reset overrides**, persistence, or precedence rules.
- Primary artifacts: `InstanceRef` (`sessionId + instanceId`), `PropPath` (JSON Pointer), JSON-only `JsonValue`.
- Key invariant: overrides are **non-destructive**, **inspectable**, and **reversible**; orphaned overrides are surfaced, not silently dropped.
- Also load: `docs/scaffa_inspector_ux_semantics.md` (UX meaning), `docs/scaffa_runtime_adapter_contract.md` (apply/clear), `docs/scaffa_preview_session_protocol.md` (routing).

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Inspector UX Rules & Semantics](./scaffa_inspector_ux_semantics.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)

---

## 1. Definition

An **override** is a draft, instance-scoped change applied to a preview runtime:

- It provides immediate visual feedback without rewriting source code on every edit.
- It is **inspectable** and **reversible**.
- It is addressed to a specific instance + prop path.

Overrides power the v0 Inspector editing experience.

In v0, Scaffa also supports **Save to Disk**: converting draft overrides into concrete workspace edits (working tree), and then clearing the draft overrides that were saved.

---

## 2. Addressing (Instance + Prop Path)

### 2.1 Runtime Address (Session-Scoped)

At runtime, overrides target an instance within a preview session:

```ts
export type PreviewSessionId = string;
export type InstanceId = string;

export type PropPath = string; // JSON Pointer (RFC 6901), e.g. "/variant"

export type InstanceRef = {
  sessionId: PreviewSessionId;
  instanceId: InstanceId;
};
```

### 2.2 Persistent Address (v0 Strategy)

For v0, persisted overrides are keyed by:
- preview session target (app/component) and
- adapter-provided instance identity (preferably stable across reload)

If instance identity changes and an override cannot be re-applied, it becomes **orphaned** (never silently dropped).

---

## 3. Value Model

Overrides must be serializable. v0 uses JSON values only:

```ts
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
```

---

## 4. Override Operations (Lifecycle)

The override store is mutated through an ordered sequence of operations:

```ts
export type OverrideOp =
  | { op: "set"; instanceId: InstanceId; path: PropPath; value: JsonValue }
  | { op: "clear"; instanceId: InstanceId; path: PropPath }
  | { op: "clearInstance"; instanceId: InstanceId }
  | { op: "clearAll" };

export type OverridePatch = {
  sessionId: PreviewSessionId;
  ops: OverrideOp[];
};
```

Required behaviors:
- `set` overwrites any existing value at the same address.
- `clear` removes only that prop path override.
- `clearInstance` removes all overrides for that instance.
- `clearAll` removes all overrides applicable to the session target.

---

## 5. Precedence Rules (Defaults vs Config vs Overrides)

Scaffa may have multiple sources of values:

1. **Code baseline** (what the app/component produces at runtime)
2. **Config layer** (project-level constraints/defaults that apply to preview context)
3. **User override layer** (Inspector edits)

Notes:
- Registry `uiDefaultValue` is UI-only metadata; it is not a value source in precedence rules.

Precedence (highest wins):

`user overrides` > `config layer` > `code baseline`

“Reset” in the Inspector removes the user override layer for the addressed prop path, revealing the effective baseline (config + code).

---

## 6. Save to Disk (v0)

“Save” converts draft overrides into source-level edits and writes them to the workspace (working tree).

See also: [Scaffa Save-to-Disk Protocol](./scaffa_save_to_disk_protocol.md)

Principles:
- Save is explicit (not on every keystroke).
- Saved changes become the new **code baseline**; the corresponding draft overrides are cleared.
- If an override cannot be safely converted into a code edit, it remains as a draft override and is surfaced as an error (no silent dropping).

Implementation note:
- The framework-specific “promote to code” logic lives in adapters/modules.
- Scaffa core applies edits transactionally via a workspace edit API (see `WorkspaceAPI.applyEdits` in `docs/scaffa_extension_api.md`).

---

## 7. Conflicts and Orphaning

Overrides can fail to apply when:
- an instance no longer exists
- instance identity is not stable across reload
- a prop path is no longer valid

v0 rules:
- Do not silently discard overrides.
- Mark them as **orphaned** and surface them in UI.
- Provide a “clear orphaned overrides” action.

---

## 8. Persistence / Serialization (v0)

v0 persists overrides to a local, diffable file.

Recommended location:

```text
/.scaffa/overrides.v0.json
```

v0 behavior expectations:
- Scaffa should create `/.scaffa/` on first write if it does not exist.
- Whether `/.scaffa/overrides.v0.json` is committed to git is a **project policy** decision; if it should not be shared, add `/.scaffa/` to `.gitignore`.

Recommended format (conceptual):

```ts
export type PersistedOverridesFile = {
  schemaVersion: "v0";
  updatedAt: string; // ISO timestamp

  // Overrides grouped by session target type.
  app?: {
    // Optionally further scoped by route id/path when available.
    overrides: Array<{
      instanceId: string;
      path: string;
      value: JsonValue;
    }>;
  };

  component?: {
    // Optionally scoped by componentTypeId when component sessions exist.
    overrides: Array<{
      instanceId: string;
      path: string;
      value: JsonValue;
    }>;
  };
};
```

Serialization requirements:
- stable schema version
- deterministic ordering (stable diffs)
- written transactionally (write temp + rename)

Whether this file is committed to git is a **project policy** decision (documented in `scaffa.config.js` conventions).

---

## 9. Transactionality and Diffability

Override mutations must be:
- **atomic**: the persisted file reflects a complete state after each operation batch
- **diffable**: edits result in small, reviewable diffs

This enables:
- sharing override state
- undo/redo in the future
- Iteration Deck variants later

---

## 10. Non-Goals (v0)

- git workflow automation (auto-commit/branch/PR)
- Persisting overrides across branches/commits with deep rebase-aware rebinding
- Arbitrary non-JSON values (functions, classes, symbols)
