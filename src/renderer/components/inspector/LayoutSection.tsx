// ─────────────────────────────────────────────────────────────────────────────
// Layout Inspector Section
// ─────────────────────────────────────────────────────────────────────────────
// Designer-friendly inspector section for layout primitives (Box, Row, Stack).
// Renders only when selection is layout.box/row/stack.
// See: docs/scaffa_inspector_ux_semantics.md

import { useState } from 'react';
import type { ComponentRegistryEntry, ControlDefinition } from '../../../shared/index.js';
import type { InstanceDescriptor, PersistedOverride } from '../../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LayoutSectionProps = {
  selectedInstance: InstanceDescriptor;
  registryEntry: ComponentRegistryEntry;
  overrides: PersistedOverride[];
};

// Layout component type IDs
const LAYOUT_TYPE_IDS = ['layout.box', 'layout.row', 'layout.stack'] as const;
type LayoutTypeId = (typeof LAYOUT_TYPE_IDS)[number];

// Spacing scale options (0..16) + unset
const SPACING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'unset', label: '—' },
  ...Array.from({ length: 17 }, (_, i) => ({
    value: String(i),
    label: String(i),
  })),
];

// Gap options for Row/Stack
const GAP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'unset', label: '—' },
  ...Array.from({ length: 17 }, (_, i) => ({
    value: String(i),
    label: String(i),
  })),
  { value: 'space-between', label: 'Space Between' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Check if a component is a layout type
// ─────────────────────────────────────────────────────────────────────────────

export function isLayoutType(componentTypeId: string): componentTypeId is LayoutTypeId {
  return LAYOUT_TYPE_IDS.includes(componentTypeId as LayoutTypeId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Section Component
// ─────────────────────────────────────────────────────────────────────────────

export const LayoutSection = ({
  selectedInstance,
  registryEntry,
  overrides,
}: LayoutSectionProps) => {
  const [showMargin, setShowMargin] = useState(false);

  const componentTypeId = selectedInstance.componentTypeId as LayoutTypeId;
  const isRowOrStack = componentTypeId === 'layout.row' || componentTypeId === 'layout.stack';

  // Get override value for a prop
  const getOverrideValue = (propName: string): string | undefined => {
    const override = overrides.find(
      (o) => o.instanceId === selectedInstance.instanceId && o.path === `/${propName}`
    );
    return override?.value as string | undefined;
  };

  // Set override via IPC
  const setOverride = async (propName: string, value: string) => {
    // Handle 'unset' by clearing the override
    if (value === 'unset') {
      try {
        await window.scaffa.overrides.clear({
          sessionId: selectedInstance.sessionId,
          instanceId: selectedInstance.instanceId as any,
          path: `/${propName}` as any,
        });
        console.log('[LayoutSection] Override cleared:', { propName });
      } catch (error) {
        console.error('[LayoutSection] Failed to clear override:', error);
      }
      return;
    }

    try {
      await window.scaffa.overrides.set({
        sessionId: selectedInstance.sessionId,
        instanceId: selectedInstance.instanceId as any,
        path: `/${propName}` as any,
        value,
        componentTypeId: selectedInstance.componentTypeId,
        instanceLocator: selectedInstance.instanceLocator,
      });
      console.log('[LayoutSection] Override set:', { propName, value });
    } catch (error) {
      console.error('[LayoutSection] Failed to set override:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-fg">Layout</h3>
        <span className="text-[10px] text-fg-subtle">
          {registryEntry.displayName}
        </span>
      </div>

      {/* Row/Stack specific controls */}
      {isRowOrStack && (
        <FlexControls
          selectedInstance={selectedInstance}
          getOverrideValue={getOverrideValue}
          setOverride={setOverride}
        />
      )}

      {/* Padding controls */}
      <SpacingControlGroup
        title="Padding"
        propPrefix=""
        allProp="p"
        xProp="px"
        yProp="py"
        topProp="pt"
        rightProp="pr"
        bottomProp="pb"
        leftProp="pl"
        getOverrideValue={getOverrideValue}
        setOverride={setOverride}
      />

      {/* Margin toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMargin(!showMargin)}
          className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
        >
          <span className="text-[10px]">{showMargin ? '▼' : '▶'}</span>
          <span>Margin</span>
        </button>
      </div>

      {/* Margin controls */}
      {showMargin && (
        <SpacingControlGroup
          title="Margin"
          propPrefix=""
          allProp="m"
          xProp="mx"
          yProp="my"
          topProp="mt"
          rightProp="mr"
          bottomProp="mb"
          leftProp="ml"
          getOverrideValue={getOverrideValue}
          setOverride={setOverride}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Flex Controls (Row/Stack specific)
// ─────────────────────────────────────────────────────────────────────────────

type FlexControlsProps = {
  selectedInstance: InstanceDescriptor;
  getOverrideValue: (propName: string) => string | undefined;
  setOverride: (propName: string, value: string) => Promise<void>;
};

const FlexControls = ({
  selectedInstance,
  getOverrideValue,
  setOverride,
}: FlexControlsProps) => {
  const isStack = selectedInstance.componentTypeId === 'layout.stack';

  return (
    <div className="space-y-3 border-b border-subtle pb-4">
      {/* Gap */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-fg">Gap</label>
        <SpacingSelect
          value={getOverrideValue('gap')}
          onChange={(value) => setOverride('gap', value)}
          options={GAP_OPTIONS}
          tokenPrefix="space"
        />
      </div>

      {/* Align & Justify */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-fg">Align</label>
          <select
            value={getOverrideValue('align') ?? ''}
            onChange={(e) => setOverride('align', e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-fg">Justify</label>
          <select
            value={getOverrideValue('justify') ?? ''}
            onChange={(e) => setOverride('justify', e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
            <option value="between">Space Between</option>
            <option value="around">Space Around</option>
            <option value="evenly">Space Evenly</option>
          </select>
        </div>
      </div>

      {/* Wrap & Direction */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-fg">Wrap</label>
          <select
            value={getOverrideValue('wrap') ?? ''}
            onChange={(e) => setOverride('wrap', e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="nowrap">No Wrap</option>
            <option value="wrap">Wrap</option>
            <option value="wrap-reverse">Wrap Reverse</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-fg">Direction</label>
          <select
            value={getOverrideValue('direction') ?? ''}
            onChange={(e) => setOverride('direction', e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="normal">{isStack ? 'Top to Bottom' : 'Left to Right'}</option>
            <option value="reverse">{isStack ? 'Bottom to Top' : 'Right to Left'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing Control Group (Padding/Margin)
// ─────────────────────────────────────────────────────────────────────────────

type SpacingControlGroupProps = {
  title: string;
  propPrefix: string;
  allProp: string;
  xProp: string;
  yProp: string;
  topProp: string;
  rightProp: string;
  bottomProp: string;
  leftProp: string;
  getOverrideValue: (propName: string) => string | undefined;
  setOverride: (propName: string, value: string) => Promise<void>;
};

const SpacingControlGroup = ({
  title,
  allProp,
  xProp,
  yProp,
  topProp,
  rightProp,
  bottomProp,
  leftProp,
  getOverrideValue,
  setOverride,
}: SpacingControlGroupProps) => {
  return (
    <div className="space-y-2">
      {/* All sides */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-xs text-fg-muted">All</label>
        <SpacingSelect
          value={getOverrideValue(allProp)}
          onChange={(value) => setOverride(allProp, value)}
          options={SPACING_OPTIONS}
          tokenPrefix="space"
        />
      </div>

      {/* Axis shortcuts */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-xs text-fg-muted">X / Y</label>
        <div className="flex flex-1 gap-2">
          <SpacingSelect
            value={getOverrideValue(xProp)}
            onChange={(value) => setOverride(xProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
          />
          <SpacingSelect
            value={getOverrideValue(yProp)}
            onChange={(value) => setOverride(yProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
          />
        </div>
      </div>

      {/* Side-specific controls (visual box layout) */}
      <div className="flex flex-col items-center gap-1 py-2">
        {/* Top */}
        <div className="flex justify-center">
          <SpacingSelect
            value={getOverrideValue(topProp)}
            onChange={(value) => setOverride(topProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            compact
          />
        </div>

        {/* Left - Center - Right */}
        <div className="flex items-center gap-1">
          <SpacingSelect
            value={getOverrideValue(leftProp)}
            onChange={(value) => setOverride(leftProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            compact
          />
          <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-fg-subtle">
            <span className="text-[10px] text-fg-subtle">{title}</span>
          </div>
          <SpacingSelect
            value={getOverrideValue(rightProp)}
            onChange={(value) => setOverride(rightProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            compact
          />
        </div>

        {/* Bottom */}
        <div className="flex justify-center">
          <SpacingSelect
            value={getOverrideValue(bottomProp)}
            onChange={(value) => setOverride(bottomProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            compact
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing Select (shows token name for non-zero values)
// ─────────────────────────────────────────────────────────────────────────────

type SpacingSelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  tokenPrefix?: string;
  compact?: boolean;
};

const SpacingSelect = ({
  value,
  onChange,
  options,
  tokenPrefix = 'space',
  compact = false,
}: SpacingSelectProps) => {
  // Display token name in the select when value is a number
  const displayValue = value ?? '';
  const isNumeric = displayValue !== '' && displayValue !== 'unset' && !isNaN(Number(displayValue));
  const tokenName = isNumeric && Number(displayValue) > 0 ? `${tokenPrefix}-${displayValue}` : null;

  return (
    <div className={compact ? 'w-14' : 'flex-1'}>
      <select
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        title={tokenName ?? undefined}
        className={`w-full rounded border border-default bg-input text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${compact ? 'px-1 py-1 text-center' : 'px-2 py-1.5'
          }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Show token name below for non-compact selects */}
      {!compact && tokenName && (
        <p className="mt-0.5 text-[10px] text-fg-subtle">{tokenName}</p>
      )}
    </div>
  );
};
