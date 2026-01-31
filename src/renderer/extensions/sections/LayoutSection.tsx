// ─────────────────────────────────────────────────────────────────────────────
// Layout Inspector Section (Extension UI Component)
// ─────────────────────────────────────────────────────────────────────────────
// Designer-friendly inspector section for layout primitives (Box, Row, Stack).
// This is an extension-provided inspector section loaded via the extension pipeline.
//
// See: docs/skaffa_inspector_ux_semantics.md
// See: docs/skaffa_extension_api.md (Section 8: UI Contribution API)

import { useState } from "react";
import type { ExtensionSectionProps } from "../types.js";
// Import preload types to provide window.skaffa typings
import type {} from "../../../preload/preload.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// Layout component type IDs
const LAYOUT_TYPE_IDS = ["layout.box", "layout.row", "layout.stack"] as const;
type LayoutTypeId = (typeof LAYOUT_TYPE_IDS)[number];

// Spacing scale options (0..16) + unset
const SPACING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "unset", label: "—" },
  ...Array.from({ length: 17 }, (_, i) => ({
    value: String(i),
    label: String(i),
  })),
];

// Gap options for Row/Stack
const GAP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "unset", label: "—" },
  ...Array.from({ length: 17 }, (_, i) => ({
    value: String(i),
    label: String(i),
  })),
  { value: "space-between", label: "Space Between" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Check if a component is a layout type
// ─────────────────────────────────────────────────────────────────────────────

function isLayoutType(
  componentTypeId: string,
): componentTypeId is LayoutTypeId {
  return LAYOUT_TYPE_IDS.includes(componentTypeId as LayoutTypeId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Section Component (Extension Entry Point)
// ─────────────────────────────────────────────────────────────────────────────

const LayoutSection = ({ context }: ExtensionSectionProps) => {
  const [showMargin, setShowMargin] = useState(false);

  // Extract from context
  const { selected, registryEntry, overrides } = context;

  // Guard: only render for layout types
  if (!selected || !registryEntry) {
    return null;
  }

  const componentTypeId = selected.componentTypeId as LayoutTypeId;

  // Don't render if not a layout type
  if (!isLayoutType(componentTypeId)) {
    return null;
  }

  const isRowOrStack =
    componentTypeId === "layout.row" || componentTypeId === "layout.stack";

  // Get the effective value for a prop: override → runtime baseline → undefined
  // See: docs/skaffa_inspector_ux_semantics.md Section 1.1
  const getOverrideValue = (propName: string): string | undefined => {
    // 1. Check for override value
    const override = overrides.find(
      (o) => o.instanceId === selected.instanceId && o.path === `/${propName}`,
    );
    if (override) {
      return override.value as string | undefined;
    }
    // 2. Fall back to runtime-provided baseline (if available)
    const runtimeBaseline = selected.props?.[propName];
    if (runtimeBaseline !== undefined) {
      return String(runtimeBaseline);
    }
    // 3. Unknown baseline
    return undefined;
  };

  // Set override via IPC
  const setOverride = async (propName: string, value: string) => {
    // Handle 'unset' by clearing the override
    if (value === "unset") {
      try {
        await window.skaffa.overrides.clear({
          sessionId: context.sessionId,
          instanceId: selected.instanceId as any,
          path: `/${propName}` as any,
        });
        console.log("[LayoutSection] Override cleared:", { propName });
      } catch (error) {
        console.error("[LayoutSection] Failed to clear override:", error);
      }
      return;
    }

    try {
      await window.skaffa.overrides.set({
        sessionId: context.sessionId,
        instanceId: selected.instanceId as any,
        path: `/${propName}` as any,
        value,
        componentTypeId: selected.componentTypeId,
        instanceLocator: selected.instanceLocator,
      });
      console.log("[LayoutSection] Override set:", { propName, value });
    } catch (error) {
      console.error("[LayoutSection] Failed to set override:", error);
    }
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-4"
      aria-labelledby={`layout-section-heading-${selected.instanceId}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3
          id={`layout-section-heading-${selected.instanceId}`}
          className="text-xs font-semibold text-fg"
        >
          Layout
        </h3>
        <span className="text-[10px] text-fg-subtle">
          {registryEntry.displayName}
        </span>
      </div>

      {/* Row/Stack specific controls */}
      {isRowOrStack && (
        <FlexControls
          componentTypeId={componentTypeId}
          instanceId={selected.instanceId}
          getOverrideValue={getOverrideValue}
          setOverride={setOverride}
        />
      )}

      {/* Padding controls */}
      <SpacingControlGroup
        title="Padding"
        idPrefix={`padding-${selected.instanceId}`}
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
          aria-expanded={showMargin}
          aria-controls={`margin-controls-${selected.instanceId}`}
          className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
        >
          <span className="text-[10px]">{showMargin ? "▼" : "▶"}</span>
          <span>Margin</span>
        </button>
      </div>

      {/* Margin controls */}
      {showMargin && (
        <div id={`margin-controls-${selected.instanceId}`}>
          <SpacingControlGroup
            title="Margin"
            idPrefix={`margin-${selected.instanceId}`}
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
        </div>
      )}
    </form>
  );
};

// Default export for dynamic import
export default LayoutSection;

// ─────────────────────────────────────────────────────────────────────────────
// Flex Controls (Row/Stack specific)
// ─────────────────────────────────────────────────────────────────────────────

type FlexControlsProps = {
  componentTypeId: LayoutTypeId;
  instanceId: string;
  getOverrideValue: (propName: string) => string | undefined;
  setOverride: (propName: string, value: string) => Promise<void>;
};

const FlexControls = ({
  componentTypeId,
  instanceId,
  getOverrideValue,
  setOverride,
}: FlexControlsProps) => {
  const isStack = componentTypeId === "layout.stack";

  return (
    <div className="space-y-3 border-b border-subtle pb-4">
      {/* Gap */}
      <div className="space-y-1">
        <label
          htmlFor={`gap-${instanceId}`}
          className="text-xs font-medium text-fg"
        >
          Gap
        </label>
        <SpacingSelect
          id={`gap-${instanceId}`}
          value={getOverrideValue("gap")}
          onChange={(value) => setOverride("gap", value)}
          options={GAP_OPTIONS}
          tokenPrefix="space"
        />
      </div>

      {/* Align & Justify */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={`align-${instanceId}`}
            className="text-xs font-medium text-fg"
          >
            Align
          </label>
          <select
            id={`align-${instanceId}`}
            value={getOverrideValue("align") ?? ""}
            onChange={(e) => setOverride("align", e.target.value)}
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
          <label
            htmlFor={`justify-${instanceId}`}
            className="text-xs font-medium text-fg"
          >
            Justify
          </label>
          <select
            id={`justify-${instanceId}`}
            value={getOverrideValue("justify") ?? ""}
            onChange={(e) => setOverride("justify", e.target.value)}
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
          <label
            htmlFor={`wrap-${instanceId}`}
            className="text-xs font-medium text-fg"
          >
            Wrap
          </label>
          <select
            id={`wrap-${instanceId}`}
            value={getOverrideValue("wrap") ?? ""}
            onChange={(e) => setOverride("wrap", e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="nowrap">No Wrap</option>
            <option value="wrap">Wrap</option>
            <option value="wrap-reverse">Wrap Reverse</option>
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`direction-${instanceId}`}
            className="text-xs font-medium text-fg"
          >
            Direction
          </label>
          <select
            id={`direction-${instanceId}`}
            value={getOverrideValue("direction") ?? ""}
            onChange={(e) => setOverride("direction", e.target.value)}
            className="w-full rounded border border-default bg-input px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">—</option>
            <option value="normal">
              {isStack ? "Top to Bottom" : "Left to Right"}
            </option>
            <option value="reverse">
              {isStack ? "Bottom to Top" : "Right to Left"}
            </option>
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
  idPrefix: string;
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
  idPrefix,
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
    <section aria-labelledby={`${idPrefix}-heading`} className="space-y-2">
      <h4 id={`${idPrefix}-heading`} className="sr-only">
        {title} Controls
      </h4>
      {/* All sides */}
      <div className="flex items-center gap-2">
        <label
          htmlFor={`${idPrefix}-all`}
          className="w-12 text-xs text-fg-muted"
        >
          All
        </label>
        <SpacingSelect
          id={`${idPrefix}-all`}
          value={getOverrideValue(allProp)}
          onChange={(value) => setOverride(allProp, value)}
          options={SPACING_OPTIONS}
          tokenPrefix="space"
        />
      </div>

      {/* Axis shortcuts */}
      <div className="flex items-center gap-2">
        <span className="w-12 text-xs text-fg-muted" aria-hidden="true">
          X / Y
        </span>
        <div className="flex flex-1 gap-2">
          <SpacingSelect
            id={`${idPrefix}-x`}
            value={getOverrideValue(xProp)}
            onChange={(value) => setOverride(xProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} X-axis`}
          />
          <SpacingSelect
            id={`${idPrefix}-y`}
            value={getOverrideValue(yProp)}
            onChange={(value) => setOverride(yProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} Y-axis`}
          />
        </div>
      </div>

      {/* Side-specific controls (visual box layout) */}
      <div className="flex flex-col items-center gap-1 py-2">
        {/* Top */}
        <div className="flex justify-center">
          <SpacingSelect
            id={`${idPrefix}-top`}
            value={getOverrideValue(topProp)}
            onChange={(value) => setOverride(topProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} Top`}
            compact
          />
        </div>

        {/* Left - Center - Right */}
        <div className="flex items-center gap-1">
          <SpacingSelect
            id={`${idPrefix}-left`}
            value={getOverrideValue(leftProp)}
            onChange={(value) => setOverride(leftProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} Left`}
            compact
          />
          <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-fg-subtle">
            <span className="text-[10px] text-fg-subtle">{title}</span>
          </div>
          <SpacingSelect
            id={`${idPrefix}-right`}
            value={getOverrideValue(rightProp)}
            onChange={(value) => setOverride(rightProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} Right`}
            compact
          />
        </div>

        {/* Bottom */}
        <div className="flex justify-center">
          <SpacingSelect
            id={`${idPrefix}-bottom`}
            value={getOverrideValue(bottomProp)}
            onChange={(value) => setOverride(bottomProp, value)}
            options={SPACING_OPTIONS}
            tokenPrefix="space"
            ariaLabel={`${title} Bottom`}
            compact
          />
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing Select (shows token name for non-zero values)
// ─────────────────────────────────────────────────────────────────────────────

type SpacingSelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel?: string;
  tokenPrefix?: string;
  compact?: boolean;
};

const SpacingSelect = ({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  tokenPrefix = "space",
  compact = false,
}: SpacingSelectProps) => {
  // Display token name in the select when value is a number
  const displayValue = value ?? "";
  const isNumeric =
    displayValue !== "" &&
    displayValue !== "unset" &&
    !isNaN(Number(displayValue));
  const tokenName =
    isNumeric && Number(displayValue) > 0
      ? `${tokenPrefix}-${displayValue}`
      : null;

  return (
    <div className={compact ? "w-14" : "flex-1"}>
      <select
        id={id}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        title={tokenName ?? undefined}
        aria-label={ariaLabel}
        className={`w-full rounded border border-default bg-input text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
          compact ? "px-1 py-1 text-center" : "px-2 py-1.5"
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
