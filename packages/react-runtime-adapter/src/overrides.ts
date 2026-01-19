// ─────────────────────────────────────────────────────────────────────────────
// Override Utilities (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities for applying prop overrides using JSON Pointer paths.

/**
 * Apply an override at a JSON Pointer path.
 * Mutates the target object in place.
 *
 * @param obj - The target object to modify
 * @param path - JSON Pointer path (e.g., "/variant", "/style/color", "/items/0/label")
 * @param value - The value to set at the path
 */
export function applyOverride(obj: any, path: string, value: unknown): void {
  // JSON Pointer format: "/prop" or "/nested/0/field"
  if (!path.startsWith('/')) {
    console.warn('[applyOverride] Invalid prop path:', path);
    return;
  }

  const parts = path.slice(1).split('/');
  if (parts.length === 0) {
    return;
  }

  // Navigate to parent
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      // Create intermediate object/array if needed
      const nextPart = parts[i + 1];
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }

  // Set value
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}
