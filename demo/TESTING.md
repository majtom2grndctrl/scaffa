# Demo Workspace v0 Walkthrough

The canonical v0 walkthrough checklist lives in `docs/scaffa_v0_scope_and_user_journey.md`:

- `docs/scaffa_v0_scope_and_user_journey.md` → “Walkthrough Checklist (Canonical)”

This file is intentionally kept minimal so we maintain a single source of truth for the demo journey checklist.

## Demo-Specific Setup

### 1) Start Demo App Dev Server

In a separate terminal:

```bash
cd demo/app
pnpm install
pnpm dev
```

The app should start on `http://localhost:5173` (or similar port).

### 2) Start Scaffa

From repo root:

```bash
pnpm dev
```

### 3) Open the `demo/` Workspace

- In Scaffa: **File → Open Workspace**
- Select the `demo/` directory

6. Begin integration with Iteration Deck (future)
