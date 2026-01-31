# Skaffa Semantic Color Utilities (Tailwind)

**Goal:** Define a *semantic* color system for Skaffa’s UI using Tailwind utility classes, so components never hard-code raw color primitives. Semantics must support light/dark mode and future theming.

**Base scale assumption (default theme):** One neutral/gray scale with 11 steps:

`050, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

**Important:** In this system, **lower numbers are darker**, `500` is mid-range.

**User override:** Skaffa exposes a **Theme Schema** that lets users replace these *primitive scale values* with their own color scale(s) (e.g., different neutral ramps, brand accents, high-contrast variants). **Semantic utility classes do not change**—only the primitive values they resolve to change.

---

## 1) Core Principle

1. UI elements use **semantic tokens** (e.g., `bg-surface-1`, `text-fg`, `border-subtle`).
2. Semantic tokens map to *primitive color values* via CSS variables.
3. **Users can override primitive values** (via a Theme Schema) without changing any UI markup.

**Invariant:** The semantic utility class names are stable API for Skaffa’s UI.

---

## 2) Semantic Token Categories

We standardize semantics into a small set of categories.

### 2.1 Surface (background layers)

Used for app chrome, panels, cards, popovers, and nested layers.

* `bg-surface-0` — app root background
* `bg-surface-1` — primary panel surface
* *(Reserved)* **pane surface** — an intermediate surface between docked panels and cards (split panes, grouped sections inside a panel)
* `bg-surface-2` — raised surfaces (cards)
* `bg-surface-3` — overlay surfaces (menus/popovers)
* `bg-surface-inset` — inset wells, code blocks, input backgrounds

Optional (if needed later): `bg-surface-accent` (for selected/active containers)

**Surface role names (preferred in prose/specs):**

Surface numbers are *implementation levels*; the stable metaphor is **container role**:
- `surface-app` → `bg-surface-0`
- `surface-panel` → `bg-surface-1` (left/right sidebars, docked panels)
- `surface-pane` → *(reserved; between panel and card)* (use `bg-surface-1` + borders/inset until implemented)
- `surface-card` → `bg-surface-2`
- `surface-overlay` → `bg-surface-3`
- `surface-inset` → `bg-surface-inset`

**Rule:** Surfaces are for **containers**, not controls. Buttons/inputs use component styling + interaction tokens (`bg-hover`, `bg-pressed`, `ring-focus`) rather than “taking a surface level.”

### 2.2 Foreground (text & icons)

* `text-fg` — default text
* `text-fg-muted` — secondary text
* `text-fg-subtle` — tertiary/hint text
* `text-fg-inverse` — text on inverse surfaces

For icons, use the same tokens:

* `text-icon` (alias of `text-fg-muted`)
* `text-icon-subtle` (alias of `text-fg-subtle`)

### 2.3 Borders & dividers

* `border-default` — standard borders
* `border-subtle` — dividers, hairlines
* `border-strong` — emphasis borders

### 2.4 Interactive states (neutral)

Used for hover/focus/pressed without implying semantic meaning.

* `bg-hover` — hover background
* `bg-pressed` — pressed background
* `ring-focus` — focus ring
* `outline-focus` — focus outline (if used)

### 2.5 Selection & highlight (accent hue)

Used for selection states in trees/tables, highlighted rows, or active items.

* `bg-selected` — selected row/item background
* `bg-selected-hover` — hover on selected
* `text-selected` — text on selected background
* `border-selected` — selection border
* `ring-selected` — selection focus ring (optional)

### 2.6 Status hues (danger / warning / success)

Used for validation states, alerts, destructive actions, and status indicators.

**Danger**

* `bg-danger` / `text-danger` / `border-danger` / `ring-danger`
* `bg-danger-subtle` / `text-danger-strong`

**Warning**

* `bg-warning` / `text-warning` / `border-warning` / `ring-warning`
* `bg-warning-subtle` / `text-warning-strong`

**Success**

* `bg-success` / `text-success` / `border-success` / `ring-success`
* `bg-success-subtle` / `text-success-strong`

### 2.7 Disabled

* `text-disabled`
* `bg-disabled`
* `border-disabled`

### 2.8 Shadows (semantic)

Shadows aren’t color utilities, but they are part of “layer semantics.”

* `shadow-surface-1`
* `shadow-surface-2`
* `shadow-surface-3`

(Implement via Tailwind shadow tokens; keep mapping consistent with surface levels.)

---

## 3) Default Neutral Mapping (Light/Dark)

This section defines Skaffa’s **default** mapping from semantic tokens → neutral primitives. Users may override the primitives (and/or the mapping) via the Theme Schema.

> Reminder: **lower = darker** in our default scale.

### 3.1 Light Mode (default)

**Surfaces**

* `bg-surface-0` → gray-950
* `bg-surface-1` → gray-900
* `bg-surface-2` → gray-800
* `bg-surface-3` → gray-700
* `bg-surface-inset` → gray-800 *(inset well)*

**Foreground**

* `text-fg` → gray-050
* `text-fg-muted` → gray-200
* `text-fg-subtle` → gray-300
* `text-fg-inverse` → gray-950

**Borders**

* `border-default` → gray-700
* `border-subtle` → gray-800
* `border-strong` → gray-600

**Interactive**

* `bg-hover` → gray-800
* `bg-pressed` → gray-700
* `ring-focus` → gray-500

**Selection**

* `bg-selected` → gray-700
* `bg-selected-hover` → gray-600
* `text-selected` → gray-050
* `border-selected` → gray-600

**Disabled**

* `text-disabled` → gray-400
* `bg-disabled` → gray-850 *(not a strict step; if strict-only, use 800 or 900)*
* `border-disabled` → gray-800

### 3.2 Dark Mode

**Surfaces**

* `bg-surface-0` → gray-050
* `bg-surface-1` → gray-100
* `bg-surface-2` → gray-200
* `bg-surface-3` → gray-300
* `bg-surface-inset` → gray-200 *(inset well)*

**Foreground**

* `text-fg` → gray-950
* `text-fg-muted` → gray-800
* `text-fg-subtle` → gray-700
* `text-fg-inverse` → gray-050

**Borders**

* `border-default` → gray-300
* `border-subtle` → gray-200
* `border-strong` → gray-400

**Interactive**

* `bg-hover` → gray-200
* `bg-pressed` → gray-300
* `ring-focus` → gray-500

**Selection**

* `bg-selected` → gray-200
* `bg-selected-hover` → gray-300
* `text-selected` → gray-950
* `border-selected` → gray-400

**Disabled**

* `text-disabled` → gray-600
* `bg-disabled` → gray-200
* `border-disabled` → gray-200

---

## 4) Required Tailwind Class Conventions

We want **ergonomic Tailwind utilities** that read like normal Tailwind classes.

### 4.1 Recommended naming

Use the standard Tailwind patterns:

* Background: `bg-<token>`
* Text: `text-<token>`
* Border: `border-<token>`
* Ring: `ring-<token>`

Examples:

* `bg-surface-1 text-fg border-subtle`
* `bg-surface-inset text-fg-muted border-default`
* `bg-selected text-selected`
* `ring-focus`

### 4.2 No raw gray usage in components

Component code should not use:

* `text-gray-*`
* `bg-gray-*`
* `border-gray-*`

Exception:

* Temporary prototypes may use primitives, but must be replaced before merging.

---

## 5) Theme Schema + Implementation Sketch

### 5.1 Theme Schema responsibilities

The Theme Schema must allow users to:

1. Override **primitive scales** (e.g., neutral ramp values for `050..950`).
2. Optionally override **semantic mappings** (e.g., what `bg-surface-2` resolves to).
3. Switch between **modes** (light/dark) and potentially additional variants (high-contrast).

**Contract:** The semantic utility class names (`bg-surface-*`, `text-fg*`, `border-*`, etc.) are stable and never change.

### 5.2 Tailwind integration strategy

Implement semantics as CSS variables, then point Tailwind color tokens at those variables.

Example semantic variables:

* `--surface-0`, `--surface-1`, `--surface-2`, `--surface-3`, `--surface-inset`
* `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-inverse`
* `--border`, `--border-subtle`, `--border-strong`
* `--hover`, `--pressed`, `--focus-ring`
* `--selected`, `--selected-hover`, `--selected-fg`, `--selected-border`
* `--disabled-fg`, `--disabled-bg`, `--disabled-border`

Light and dark modes set different values for these variables.

### 5.3 Primitive override strategy

Primitives (like the neutral ramp) are defined separately (e.g., `--neutral-050 ... --neutral-950`). Semantic variables reference primitives.

This enables:

* swapping primitive ramps without rewriting semantic classes
* swapping semantic mappings without changing component markup

---

## 6) Decisions & Invariants

This section records resolved decisions so they are not re-litigated implicitly.

### 6.1 Appearance & mode

* Default theme follows **OS light/dark appearance**.
* Users may explicitly override mode in settings.

### 6.2 Semantic stability

* Semantic utility class names are **stable API** for Skaffa UI.
* Themes may override primitives and mappings, but **never rename semantics**.

### 6.3 Accent & status hues

* Selection uses a dedicated **accent hue**.
* Status semantics include **danger, warning, success**.
* Neutrals remain the dominant palette for structural UI.

### 6.4 Theme authoring model

* Theme system follows **VS Code–style token theming**:

  * Partial overrides are expected.
  * Sensible fallbacks are mandatory.
  * Theme authors override *what they care about*, not everything.

### 6.5 Schema & validation

* Theme Schema is serialized as **JSON**.
* Schema validation is enforced with **Zod** at load time.

---

## Changelog

* v0.1 — Initial semantic token list + draft light/dark mapping for neutral scale
* v0.2 — Clarified Theme Schema for user-overridable primitives; semantic utility classes remain stable
