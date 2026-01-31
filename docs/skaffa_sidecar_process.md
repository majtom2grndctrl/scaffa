# Skaffa Sidecar Process (Planned)

> **Status:** Draft / planned  
> **Audience:** Skaffa core contributors  
> **Goal:** Define how Skaffa runs auxiliary “sidecar” processes (starting with a Rust workspace sidecar) for file-heavy and compute-heavy operations, while keeping multi-process ownership boundaries intact.

Related:
- [Architecture Plan](./index.md)
- [IPC Boundaries + Key Sequence Diagrams](./skaffa_ipc_boundaries_and_sequences.md)
- [Skaffa Extension API – v0 Sketch](./skaffa_extension_api.md)
- [Skaffa Save-to-Disk Protocol](./skaffa_save_to_disk_protocol.md)

---

## 1. Why Sidecars

Some Skaffa features require operations that are expensive in large workspaces:
- scanning many files
- fast repeated reads/searches
- parsing and building incremental indexes
- computing “plans” (e.g. save promotion plans) that may touch multiple files

Sidecars allow Skaffa to:
- keep the Electron/Node processes responsive
- isolate heavy compute and file access behind a small, typed API
- use languages/tooling better suited to large-file workloads (Rust)

---

## 2. Ownership and Boundaries (Non-Negotiable)

Sidecars are **services**, not authorities.

1) **Main owns the workspace write capability**
- Sidecar MUST NOT write to workspace files.
- All writes remain in main and use transactional edits (`docs/skaffa_workspace_edit_protocol.md`).

2) **Renderer never talks to sidecars directly**
- Renderer talks only to preload → main (capabilities).

3) **Extension host does not get raw filesystem access**
- Extensions use `WorkspaceAPI` (and future analysis APIs), which main services.
- Main MAY delegate reads/search/analysis to a sidecar.

This keeps the Electron multi-process model aligned and preserves a path to future sandboxing.

---

## 3. The “Workspace Sidecar” (First Sidecar)

### 3.1 Responsibilities

- Build and maintain a workspace file index (paths, mtimes, hashes)
- Provide high-throughput primitives:
  - read file content
  - glob/search across files
  - (optionally) language-specific parsing/indexing (e.g. TS/TSX)
- Keep caches warm via incremental recomputation on file change events

### 3.2 Non-Goals (Initial)

- Any workspace writes
- Protocol version negotiation (defer until we have 2+ clients)
- macOS codesigning/notarization (defer; required once we ship packaged apps broadly)

---

## 4. IPC Shape (Planned)

The workspace sidecar is a child process supervised by main, using a simple request/response protocol over stdio.

### 4.1 Transport

- **stdin/stdout** (newline-delimited JSON messages)
- stderr reserved for logs

Rationale:
- portable across platforms
- avoids native Node modules
- easy to debug and capture

### 4.2 Message Format (Conceptual)

```ts
type SidecarRequest = {
  id: string
  method: string
  params: unknown
}

type SidecarResponse =
  | { id: string; ok: true; result: unknown }
  | { id: string; ok: false; error: { code: string; message: string } }
```

Main owns:
- lifecycle (spawn/restart/backoff)
- timeouts and cancellation policy
- mapping errors into user-facing failures

---

## 5. Dev + Build + Packaging Integration (Day-One Intent)

### 5.1 Local Development

Planned conventions:
- Main resolves a sidecar binary path in this order:
  1. `SCAFFA_SIDECAR_PATH` (explicit override)
  2. workspace-local dev build output (e.g. `target/debug/...`)
  3. packaged resource path (when `app.isPackaged === true`)

In dev, the sidecar is expected to be started automatically by main when a workspace is opened.

### 5.2 Cross-Platform Builds

Day-one requirement for the sidecar:
- buildable on macOS, Windows, and Linux using stable Rust
- no platform-specific runtime assumptions in the protocol/paths

Planned CI policy:
- build the sidecar for each target OS
- publish artifacts or attach them to the build output used by packaging

### 5.3 Electron Packaging Integration

Bundling the sidecar into the packaged Electron app is a **packager responsibility**:
- include the built sidecar binary as an `extraResource`/resource file
- preserve execute permissions on macOS/Linux
- main locates the sidecar under `process.resourcesPath`

Note: The repo currently does not select a packager (Forge vs electron-builder). Until that is decided, packaging integration remains a planned contract, not an implementation.

---

## 6. How This Interacts With Save-to-Disk

Save-to-disk remains:
- orchestrated by **main**
- planned by **extension host** (framework-specific logic)
- written by **main** (transactional edits)

Sidecar integration is an implementation detail behind main-owned capabilities:
- `WorkspaceAPI.readFile/watch/search` can be serviced efficiently via sidecar
- heavier “analysis” calls can be added later without giving extensions direct filesystem access
