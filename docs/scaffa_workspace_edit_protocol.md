# Scaffa Workspace Edit Protocol (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors and extension authors  
> **Goal:** Define the canonical, framework-agnostic contract for writing deterministic, transactional workspace edits (working tree) from Scaffa core and extensions.

## Agent TL;DR

- Source of truth for: `WorkspaceAPI.applyEdits`, `FileEdit`, `TextEdit`, conflict behavior, and transactional guarantees.
- Used by: Save-to-disk promotion, AI-assisted edits, refactors, and any extension that writes files.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Extension API – v0 Sketch](./scaffa_extension_api.md)
- [Scaffa Save-to-Disk Protocol](./scaffa_save_to_disk_protocol.md)

---

## 1. Principles

- **Transactional**: a batch of edits is applied atomically; partial writes must not occur.
- **Diffable**: edits should be minimal and stable to produce clean diffs.
- **Deterministic**: the same inputs should yield the same output bytes (given the same file content).
- **Conflict-aware**: detect and surface conflicts when the file changed since edits were computed.

---

## 2. Canonical Types (Conceptual)

```ts
export type FilePath = string; // workspace-relative or absolute (implementation-defined)

export type TextRange = {
  /**
   * UTF-16 code unit offsets (JS string indexing).
   * v0 uses offsets to avoid ambiguity with tabs/CRLF and to match common TS tooling.
   */
  start: number;
  end: number;
};

export type TextEdit = {
  range: TextRange;
  newText: string;
};

export type FileEdit =
  | {
      kind: "text";
      filePath: FilePath;
      /**
       * Optional optimistic concurrency control.
       * If present, applyEdits MUST verify the file content still matches before applying.
       */
      expectedSha256?: string;
      edits: TextEdit[];
    }
  | {
      kind: "create";
      filePath: FilePath;
      contents: string;
      /**
       * If false (default), create MUST fail if the file exists.
       */
      overwrite?: boolean;
    }
  | {
      kind: "delete";
      filePath: FilePath;
      /**
       * If true, deleting a missing file is treated as success.
       */
      allowMissing?: boolean;
    };

export type ApplyEditsResult =
  | { ok: true; applied: Array<{ filePath: FilePath }> }
  | {
      ok: false;
      error:
        | { code: "conflict"; filePath: FilePath; message: string }
        | { code: "notFound"; filePath: FilePath; message: string }
        | { code: "permissionDenied"; filePath: FilePath; message: string }
        | { code: "invalidEdit"; filePath: FilePath; message: string }
        | { code: "ioError"; filePath: FilePath; message: string };
    };
```

Notes:
- Implementations MAY extend this with richer diagnostics, but the above semantics must hold.
- v0 intentionally does not include “binary edits”; use create/replace via `contents` if needed.

---

## 3. Application Rules (v0)

### 3.1 Text Edit Ordering and Validity

For `kind: "text"`:

- `edits` MUST be applied as if to the original file content.
- Implementations MUST either:
  - require `edits` to be non-overlapping and sorted by `range.start`, or
  - internally normalize/sort and reject overlaps.
- Out-of-bounds ranges MUST fail with `invalidEdit`.

### 3.2 Conflict Detection

If `expectedSha256` is provided:

- `applyEdits` MUST hash the current file bytes and compare before applying.
- If mismatched, return `conflict`.

If `expectedSha256` is omitted:

- `applyEdits` MAY still detect conflicts, but is not required to.

### 3.3 Transactionality

`applyEdits` MUST be atomic:

- If any file edit in the batch fails, **no edits** should be committed to disk.
- Implementation guidance: write temp files + rename, or use a journaled approach.

### 3.4 Newlines and Encoding

v0 assumes UTF-8 text files.

- `applyEdits` MUST preserve existing newline style where feasible.
- Extensions SHOULD compute edits against the exact file bytes read via `WorkspaceAPI.readFile`.

---

## 4. Formatting and Tooling (v0)

Save-to-disk promotion should not silently reformat unrelated code.

Policy:
- Extensions MAY run a formatter only if explicitly configured by the project/module.
- If a formatter is run, it SHOULD be limited to the files touched by the edit batch.

---

## 5. Non-Goals (v0)

- Cross-file semantic refactors with automatic import management
- Safe concurrent multi-writer merge resolution
- Git operations (commit/branch/PR)
