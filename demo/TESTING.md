# Demo Workspace v0 Walkthrough

The canonical v0 walkthrough checklist lives in `docs/skaffa_v0_scope_and_user_journey.md`:

- `docs/skaffa_v0_scope_and_user_journey.md` → “Walkthrough Checklist (Canonical)”

This file is intentionally kept minimal so we maintain a single source of truth for the demo journey checklist.

## Demo-Specific Setup

### 1) Prepare Workspace Extensions

From repo root:

```bash
pnpm demo:refresh-extensions
```

### 2) Start Demo App Dev Server

In a separate terminal:

```bash
cd demo/app
pnpm dev
```

If you skipped `pnpm demo:refresh-extensions`, run `pnpm install` here first.

The app should start on `http://localhost:5173` (or similar port).

### 3) Start Skaffa

From repo root:

```bash
pnpm dev
```

### 4) Open the `demo/` Workspace

- In Skaffa (Launcher): **Open Workspace**
- Select the `demo/` directory

6. Begin integration with Iteration Deck (future)
