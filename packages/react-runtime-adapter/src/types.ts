// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Runtime Adapter Types (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime adapter configuration.
 */
export interface ScaffaAdapterConfig {
  /**
   * Adapter ID (e.g., "react", "nextjs-react").
   */
  adapterId: string;

  /**
   * Adapter version.
   */
  adapterVersion: string;

  /**
   * Enable debug logging.
   */
  debug?: boolean;
}

/**
 * Instance identity metadata.
 */
export interface InstanceIdentity {
  /**
   * Stable instance ID (unique within session).
   */
  instanceId: string;

  /**
   * Component type ID (matches registry).
   */
  componentTypeId: string;

  /**
   * Display name for UI (optional).
   */
  displayName?: string;

  /**
   * React key hint (optional).
   */
  keyHint?: string;

  /**
   * Optional instance locator (stable hint for save-to-disk).
   */
  instanceLocator?: unknown;
}

/**
 * Props for ScaffaInstance component.
 */
export interface ScaffaInstanceProps {
  /**
   * Component type ID (matches registry).
   */
  typeId: string;

  /**
   * Display name for UI (optional).
   */
  displayName?: string;

  /**
   * Children to render.
   */
  children: React.ReactNode;
}

/**
 * Override operation (from host).
 */
export interface OverrideOp {
  op: 'set' | 'clear' | 'clearInstance' | 'clearAll';
  instanceId?: string;
  path?: string;
  value?: unknown;
}

/**
 * Prop path for overrides (JSON Pointer format).
 */
export type PropPath = string;

/**
 * Override map entry.
 */
export interface OverrideEntry {
  path: PropPath;
  value: unknown;
}
