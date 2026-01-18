# @scaffa/layout-primitives-react

React layout component library mirroring Figma auto-layout primitives. Built with CSS Modules and a consistent spacing system.

## Installation

```bash
pnpm add @scaffa/layout-primitives-react
```

## Usage

### Importing Components

```tsx
import { Box, Row, Stack } from '@scaffa/layout-primitives-react';
import '@scaffa/layout-primitives-react/tokens.css';
```

### Basic Examples

#### Box - Non-layout wrapper

```tsx
<Box p={4} m={2} alignSelf="center">
  <p>Content with padding and margin</p>
</Box>
```

#### Row - Horizontal flex layout

```tsx
<Row gap={3} align="center" justify="between">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Row>
```

#### Stack - Vertical flex layout

```tsx
<Stack gap={4} align="start">
  <h1>Title</h1>
  <p>Description</p>
  <button>Action</button>
</Stack>
```

## API Reference

### Spacing Values

All spacing props accept values from 0-16, corresponding to a 4px grid:

- `0` → 0px
- `1` → 4px
- `2` → 8px
- `3` → 12px
- `4` → 16px
- `5` → 20px
- `6` → 24px
- `7` → 28px
- `8` → 32px
- `9` → 36px
- `10` → 40px
- `11` → 44px
- `12` → 48px
- `13` → 52px
- `14` → 56px
- `15` → 60px
- `16` → 64px

### Box Props

| Prop | Type | Description |
|------|------|-------------|
| `p` | `0..16` | Padding (all sides) |
| `px` | `0..16` | Padding horizontal (left + right) |
| `py` | `0..16` | Padding vertical (top + bottom) |
| `pt` | `0..16` | Padding top |
| `pr` | `0..16` | Padding right |
| `pb` | `0..16` | Padding bottom |
| `pl` | `0..16` | Padding left |
| `m` | `0..16` | Margin (all sides) |
| `mx` | `0..16` | Margin horizontal (left + right) |
| `my` | `0..16` | Margin vertical (top + bottom) |
| `mt` | `0..16` | Margin top |
| `mr` | `0..16` | Margin right |
| `mb` | `0..16` | Margin bottom |
| `ml` | `0..16` | Margin left |
| `alignSelf` | `'start' \| 'center' \| 'end' \| 'stretch'` | Flex align-self |
| `className` | `string` | Additional CSS classes |

### Row Props

Extends Box padding/margin props, plus:

| Prop | Type | Description |
|------|------|-------------|
| `gap` | `0..16 \| 'space-between'` | Gap between children |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | Cross-axis alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | Main-axis alignment |
| `wrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | Flex wrap behavior |
| `direction` | `'normal' \| 'reverse'` | Row direction (row / row-reverse) |

### Stack Props

Extends Box padding/margin props, plus:

| Prop | Type | Description |
|------|------|-------------|
| `gap` | `0..16 \| 'space-between'` | Gap between children |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | Cross-axis alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | Main-axis alignment |
| `wrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | Flex wrap behavior |
| `direction` | `'normal' \| 'reverse'` | Stack direction (column / column-reverse) |

## Design System

This package follows a 4px grid baseline for consistent spacing. Spacing tokens are defined as CSS custom properties (`--space-0` through `--space-16`) and can be used in your own styles:

```css
.custom-element {
  padding: var(--space-4);
  margin: var(--space-2);
}
```

## License

MIT
