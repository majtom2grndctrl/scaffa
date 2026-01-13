# Scaffa Visual Language (v0)

> **Status:** Living document  
> **Audience:** Scaffa core contributors and extension/module authors  
> **Goal:** Define Scaffa’s default look/feel so new UI ships consistent, sleek, and utilitarian across light/dark mode.

Related:
- [Architecture Plan](../index.md)
- [Scaffa Semantic Color Utilities](./colors.md)

---

## 1) Core Principles (Non-Negotiable)

- **Lean + pragmatic**: clear structure, no ornamental UI.
- **Not “engineering tool ugly”**: clean typography, intentional spacing, consistent radii.
- **Spacing creates hierarchy**: rely on whitespace and grouping before color.
- **Borders over shadows**: subtle 1px borders define surfaces; shadows are reserved for overlays.
- **Neutral-first palette**: grays carry the UI; accent color is used sparingly for selection/primary actions.
- **Light/dark parity**: every surface and control must read correctly in both modes.

---

## 2) Surfaces (Workspace “Gray World”)

Scaffa is a design + development tool; the chrome should feel like an IDE.

**Rule:** The main workspace is always a *shade of gray*:
- Light mode: **very light gray** surfaces (not pure white).
- Dark mode: **very dark gray** surfaces (not pure black).

Use the canonical surface levels (see `docs/design/colors.md`):
Surface numbers are implementation details; the stable metaphor is **container role**:
- `surface-app` (`surface-0`): app root background
- `surface-panel` (`surface-1`): docked panels (left/right/bottom regions)
- `surface-pane` *(reserved)*: an intermediate surface inside a docked panel (split panes, grouped sections)
- `surface-card` (`surface-2`): raised blocks inside a panel/pane
- `surface-overlay` (`surface-3`): menus/popovers/dialog surfaces
- `surface-inset`: wells (lists, code blocks, embedded regions)

**Rule:** Surfaces describe **containers**, not controls. A button is not “a surface level”; it’s a control with interactive states.

**Shadows:** Only overlays may use a shadow; most structure should be readable from surface level + border alone.

---

## 3) Inputs (Intentional Contrast)

Inputs are one of the few places we allow strong contrast against workspace surfaces.

- **Light mode:** input backgrounds are **pure white** (`#fff`) with a subtle border.
- **Dark mode:** input backgrounds are a **lighter gray than the surface behind them** (typically an inset/layered surface), with a subtle border.

**Implementation guidance:**
- Do not rely on `bg-transparent` for inputs.
- Prefer a dedicated semantic token (e.g. `bg-input`) rather than reusing `surface-*` so light mode can be truly white without pushing the entire surface system toward white.

---

## 4) Borders (Subtle, Constant, Useful)

Borders are the primary structural affordance.

- Use **1px borders** by default.
- `border-subtle`: dividers, table row separators, nested boundaries
- `border-default`: panel bounds, cards, inputs
- `border-strong`: rare emphasis (active container, critical separation)
- Focus is communicated via **ring/outline**, not thicker borders.

Avoid “border soup”:
- If a region already has a panel border, prefer **internal spacing** + `border-subtle` dividers over nested `border-default` everywhere.

---

## 5) Spacing (Balance Comes From Rhythm)

Spacing is the primary tool for hierarchy and calm.

**Grid:** 4px baseline (Tailwind scale-friendly).

Recommended “rhythm” steps:
- 8px: tight grouping (icon + label, small control clusters)
- 12–16px: default control spacing and panel padding
- 24px: section separation within a panel
- 32px+: separation between major regions

Heuristics:
- Prefer **fewer, larger gaps** over many small ones.
- Sidebars and inspectors should feel “dense but breathable”: compact typography with disciplined spacing.

---

## 6) Workbench Layout (Docked IDE Model)

Scaffa’s default layout is a docked workbench:

- **Left sidebar:** files + routes (project navigation)
- **Center workspace:** preview/canvas and primary editing surface
- **Right sidebar:** inspectors + tools
- **Bottom panel (optional):** console/logs and other tools; collapsible

Layout guidance:
- Sidebars and bottom panel should be **resizable**.
- Separate regions with **borders** (not heavy gutters).
- Use surface roles (`surface-panel` → `surface-pane` → `surface-card`) to distinguish nested regions; keep contrast subtle.

---

## 7) Mode Behavior (Light/Dark)

- Light/dark mode must be supported everywhere (Scaffa already adapts today).
- UI should use **semantic tokens** (not raw grays) so mode changes don’t require per-component redesign.
- Only use mode-specific classes as a last resort; prefer variables/tokens in `src/renderer/styles.css`.
