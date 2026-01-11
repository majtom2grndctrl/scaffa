// ─────────────────────────────────────────────────────────────────────────────
// Inspector Property Controls
// ─────────────────────────────────────────────────────────────────────────────
// Individual control renderers for each ControlDefinition type.

import type { ControlDefinition } from '../../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Control Component Props
// ─────────────────────────────────────────────────────────────────────────────

export type ControlProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
  control: ControlDefinition;
  disabled?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// String Control
// ─────────────────────────────────────────────────────────────────────────────

export const StringControl = ({
  value,
  onChange,
  control,
  disabled,
}: ControlProps<string>) => {
  if (control.kind !== 'string') return null;

  const { placeholder, multiline } = control;

  if (multiline) {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Number Control
// ─────────────────────────────────────────────────────────────────────────────

export const NumberControl = ({
  value,
  onChange,
  control,
  disabled,
}: ControlProps<number>) => {
  if (control.kind !== 'number') return null;

  const { step, unit } = control;

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        step={step}
        disabled={disabled}
        className="w-full rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
      {unit && <span className="text-xs text-fg-muted">{unit}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Boolean Control
// ─────────────────────────────────────────────────────────────────────────────

export const BooleanControl = ({
  value,
  onChange,
  disabled,
}: ControlProps<boolean>) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-default text-accent focus:ring-accent disabled:opacity-50"
      />
      <span className="text-xs text-fg">
        {value ? 'Enabled' : 'Disabled'}
      </span>
    </label>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Select Control
// ─────────────────────────────────────────────────────────────────────────────

export const SelectControl = ({
  value,
  onChange,
  control,
  disabled,
}: ControlProps<string>) => {
  if (control.kind !== 'select') return null;

  const { options } = control;

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} title={opt.description}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Color Control
// ─────────────────────────────────────────────────────────────────────────────

export const ColorControl = ({
  value,
  onChange,
  disabled,
}: ControlProps<string>) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 w-16 rounded border border-default cursor-pointer disabled:opacity-50"
      />
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#000000"
        className="flex-1 rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg font-mono focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slot Control (read-only in v0)
// ─────────────────────────────────────────────────────────────────────────────

export const SlotControl = ({ control }: ControlProps) => {
  if (control.kind !== 'slot') return null;

  const { slotName } = control;

  return (
    <div className="rounded border border-default bg-surface-2 px-2 py-1.5">
      <p className="text-xs text-fg-muted italic">
        Slot: {slotName ?? 'children'} (editing not supported in v0)
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// JSON Control
// ─────────────────────────────────────────────────────────────────────────────

export const JsonControl = ({
  value,
  onChange,
  disabled,
}: ControlProps<unknown>) => {
  const stringValue = value !== undefined ? JSON.stringify(value, null, 2) : '';

  const handleChange = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
    } catch {
      // Invalid JSON - don't update
    }
  };

  return (
    <div className="space-y-1">
      <textarea
        value={stringValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        rows={5}
        className="w-full rounded border border-default bg-surface-0 px-2 py-1.5 text-xs text-fg font-mono focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
      <p className="text-[10px] text-fg-subtle">
        Enter valid JSON. Changes apply on valid input only.
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Control Renderer (discriminated union dispatcher)
// ─────────────────────────────────────────────────────────────────────────────

export const ControlRenderer = ({
  control,
  value,
  onChange,
  disabled,
}: ControlProps) => {
  switch (control.kind) {
    case 'string':
      return (
        <StringControl
          value={value as string}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    case 'number':
      return (
        <NumberControl
          value={value as number}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    case 'boolean':
      return (
        <BooleanControl
          value={value as boolean}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <SelectControl
          value={value as string}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    case 'color':
      return (
        <ColorControl
          value={value as string}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    case 'slot':
      return <SlotControl value={value} onChange={onChange} control={control} disabled={disabled} />;
    case 'json':
      return (
        <JsonControl
          value={value}
          onChange={onChange}
          control={control}
          disabled={disabled}
        />
      );
    default:
      return (
        <div className="rounded border border-warning bg-warning-subtle px-2 py-1.5">
          <p className="text-xs text-warning">Unknown control type</p>
        </div>
      );
  }
};
