import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Edit Types (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/skaffa_workspace_edit_protocol.md

export const TextRangeSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
  })
  .refine((range) => range.end >= range.start, {
    message: "TextRange end must be >= start",
  });

export type TextRange = z.infer<typeof TextRangeSchema>;

export const TextEditSchema = z.object({
  range: TextRangeSchema,
  newText: z.string(),
});

export type TextEdit = z.infer<typeof TextEditSchema>;

export const FileEditSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    filePath: z.string(),
    expectedSha256: z.string().optional(),
    edits: z.array(TextEditSchema),
  }),
  z.object({
    kind: z.literal("create"),
    filePath: z.string(),
    contents: z.string(),
    overwrite: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("delete"),
    filePath: z.string(),
    allowMissing: z.boolean().optional(),
  }),
]);

export type FileEdit = z.infer<typeof FileEditSchema>;

export const ApplyEditsResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    applied: z.array(z.object({ filePath: z.string() })),
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({
      code: z.enum([
        "conflict",
        "notFound",
        "permissionDenied",
        "invalidEdit",
        "ioError",
      ]),
      filePath: z.string(),
      message: z.string(),
    }),
  }),
]);

export type ApplyEditsResult = z.infer<typeof ApplyEditsResultSchema>;
