// ─────────────────────────────────────────────────────────────────────────────
// Workspace Edit Application (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Applies FileEdit batches transactionally within a workspace.

import { createHash, randomBytes } from "node:crypto";
import { dirname, isAbsolute, join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import type {
  ApplyEditsResult,
  FileEdit,
  TextEdit,
} from "../../shared/workspace-edits.js";

type PreparedEdit =
  | {
      kind: "text";
      filePath: string;
      absPath: string;
      originalContent: string;
      newContent: string;
    }
  | {
      kind: "create";
      filePath: string;
      absPath: string;
      newContent: string;
      overwrite: boolean;
    }
  | {
      kind: "delete";
      filePath: string;
      absPath: string;
      allowMissing: boolean;
      existed: boolean;
    };

export async function applyWorkspaceEdits(
  workspaceRoot: string,
  edits: FileEdit[],
): Promise<ApplyEditsResult> {
  if (edits.length === 0) {
    return { ok: true, applied: [] };
  }

  const prepared: PreparedEdit[] = [];

  try {
    for (const edit of edits) {
      const absPath = resolveWorkspacePath(workspaceRoot, edit.filePath);

      if (edit.kind === "text") {
        const originalContent = await readFile(absPath, "utf-8");

        if (edit.expectedSha256) {
          const currentSha = sha256(originalContent);
          if (currentSha !== edit.expectedSha256) {
            return {
              ok: false,
              error: {
                code: "conflict",
                filePath: edit.filePath,
                message: "File contents changed since edits were computed.",
              },
            };
          }
        }

        const newContent = applyTextEdits(originalContent, edit.edits);
        prepared.push({
          kind: "text",
          filePath: edit.filePath,
          absPath,
          originalContent,
          newContent,
        });
        continue;
      }

      if (edit.kind === "create") {
        const exists = existsSync(absPath);
        if (exists && !edit.overwrite) {
          return {
            ok: false,
            error: {
              code: "conflict",
              filePath: edit.filePath,
              message: "File already exists.",
            },
          };
        }

        prepared.push({
          kind: "create",
          filePath: edit.filePath,
          absPath,
          newContent: edit.contents,
          overwrite: !!edit.overwrite,
        });
        continue;
      }

      if (edit.kind === "delete") {
        const exists = existsSync(absPath);
        if (!exists && !edit.allowMissing) {
          return {
            ok: false,
            error: {
              code: "notFound",
              filePath: edit.filePath,
              message: "File not found.",
            },
          };
        }

        prepared.push({
          kind: "delete",
          filePath: edit.filePath,
          absPath,
          allowMissing: !!edit.allowMissing,
          existed: exists,
        });
      }
    }
  } catch (error) {
    return toIoError(error, edits[0]?.filePath ?? workspaceRoot);
  }

  const transactionId = randomBytes(6).toString("hex");
  const tempFiles = new Map<string, string>();
  const backups = new Map<string, string>();

  try {
    // Stage new contents for text/create edits.
    for (const edit of prepared) {
      if (edit.kind !== "text" && edit.kind !== "create") {
        continue;
      }

      const dir = dirname(edit.absPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      const tempPath = `${edit.absPath}.skaffa-tmp-${transactionId}`;
      await writeFile(tempPath, edit.newContent, "utf-8");
      tempFiles.set(edit.absPath, tempPath);
    }

    // Move originals to backups for text/delete and create(overwrite).
    for (const edit of prepared) {
      if (
        edit.kind === "text" ||
        edit.kind === "delete" ||
        edit.kind === "create"
      ) {
        const exists = existsSync(edit.absPath);
        const needsBackup =
          edit.kind === "text" ||
          edit.kind === "delete" ||
          (edit.kind === "create" && exists);

        if (needsBackup && exists) {
          const backupPath = `${edit.absPath}.skaffa-bak-${transactionId}`;
          await rename(edit.absPath, backupPath);
          backups.set(edit.absPath, backupPath);
        }
      }
    }

    // Commit staged temp files.
    for (const edit of prepared) {
      if (edit.kind === "text" || edit.kind === "create") {
        const tempPath = tempFiles.get(edit.absPath);
        if (!tempPath) {
          throw new Error(`Missing temp file for ${edit.filePath}`);
        }
        await rename(tempPath, edit.absPath);
      }
    }

    // Finalize deletes.
    for (const edit of prepared) {
      if (edit.kind === "delete" && edit.existed) {
        const backupPath = backups.get(edit.absPath);
        if (backupPath) {
          await unlink(backupPath);
          backups.delete(edit.absPath);
        }
      }
    }

    // Cleanup backups for overwritten files.
    for (const [absPath, backupPath] of backups) {
      if (existsSync(absPath)) {
        await unlink(backupPath);
      }
    }

    return {
      ok: true,
      applied: prepared.map((edit) => ({ filePath: edit.filePath })),
    };
  } catch (error) {
    await rollbackEdits(prepared, tempFiles, backups);
    return toIoError(error, prepared[0]?.filePath ?? workspaceRoot);
  }
}

function resolveWorkspacePath(workspaceRoot: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(workspaceRoot, filePath);
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function applyTextEdits(content: string, edits: TextEdit[]): string {
  const sorted = [...edits].sort((a, b) => a.range.start - b.range.start);

  let lastEnd = 0;
  for (const edit of sorted) {
    if (edit.range.start < lastEnd) {
      throw new Error("Overlapping text edits are not supported.");
    }
    if (edit.range.start < 0 || edit.range.end > content.length) {
      throw new Error("Text edit range is out of bounds.");
    }
    lastEnd = edit.range.end;
  }

  let output = "";
  let cursor = 0;
  for (const edit of sorted) {
    output += content.slice(cursor, edit.range.start);
    output += edit.newText;
    cursor = edit.range.end;
  }
  output += content.slice(cursor);

  return output;
}

async function rollbackEdits(
  prepared: PreparedEdit[],
  tempFiles: Map<string, string>,
  backups: Map<string, string>,
): Promise<void> {
  for (const [absPath, tempPath] of tempFiles) {
    if (existsSync(tempPath)) {
      await safeUnlink(tempPath);
    }
    if (!existsSync(absPath) && backups.has(absPath)) {
      const backupPath = backups.get(absPath);
      if (backupPath && existsSync(backupPath)) {
        await rename(backupPath, absPath).catch(() => undefined);
        backups.delete(absPath);
      }
    }
  }

  for (const edit of prepared) {
    const backupPath = backups.get(edit.absPath);
    if (!backupPath) {
      continue;
    }

    if (existsSync(edit.absPath)) {
      await safeUnlink(edit.absPath);
    }

    if (existsSync(backupPath)) {
      await rename(backupPath, edit.absPath).catch(() => undefined);
    }
  }
}

async function safeUnlink(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    // Ignore cleanup failures.
  }
}

function toIoError(error: unknown, filePath: string): ApplyEditsResult {
  const message = error instanceof Error ? error.message : "Unknown IO error";
  const code = error instanceof Error ? error.message : "IO_ERROR";

  const isPermission =
    typeof code === "string" &&
    (code.includes("EACCES") ||
      code.includes("EPERM") ||
      code.includes("permission"));

  const isInvalidEdit =
    typeof message === "string" &&
    (message.includes("Overlapping text edits") ||
      message.includes("out of bounds"));

  return {
    ok: false,
    error: {
      code: isInvalidEdit
        ? "invalidEdit"
        : isPermission
          ? "permissionDenied"
          : "ioError",
      filePath,
      message,
    },
  };
}
