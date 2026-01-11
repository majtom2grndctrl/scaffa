import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Common Types (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference to a source code location.
 */
export const SourceRefSchema = z.object({
  filePath: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().positive().optional(),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;

/**
 * JSON-serializable value type.
 */
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
