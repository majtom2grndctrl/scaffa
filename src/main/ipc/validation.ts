import { type IpcMainInvokeEvent } from 'electron';
import { type ZodSchema, ZodError } from 'zod';
import { IpcErrorSchema, type IpcError } from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// IPC Payload Validation (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Validates all IPC requests/responses using Zod schemas.
// Ensures fail-fast behavior with structured errors.

/**
 * IPC handler function type.
 */
type IpcHandler<TRequest, TResponse> = (
  event: IpcMainInvokeEvent,
  request: TRequest
) => Promise<TResponse>;

/**
 * Wraps an IPC handler with request and response validation.
 *
 * @param requestSchema - Zod schema for validating the request payload
 * @param responseSchema - Zod schema for validating the response payload
 * @param handler - The actual handler implementation
 * @returns Wrapped handler that validates payloads and returns structured errors
 */
export function validated<
  TRequestInput,
  TRequestOutput,
  TResponseInput,
  TResponseOutput,
>(
  requestSchema: ZodSchema<TRequestOutput, any, TRequestInput>,
  responseSchema: ZodSchema<TResponseOutput, any, TResponseInput>,
  handler: IpcHandler<TRequestOutput, TResponseInput>
): IpcHandler<unknown, TResponseOutput> {
  return async (event: IpcMainInvokeEvent, rawRequest: unknown): Promise<TResponseOutput> => {
    try {
      // Validate inbound request
      const request = requestSchema.parse(rawRequest);

      // Execute handler
      const response = await handler(event, request);

      // Validate outbound response
      const validatedResponse = responseSchema.parse(response);

      return validatedResponse;
    } catch (error) {
      // Convert errors to structured IPC errors
      if (error instanceof ZodError) {
        const ipcError: IpcError = {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request or response payload',
          details: {
            issues: error.issues,
          },
        };
        throw ipcError;
      }

      // Re-throw other errors as structured IPC errors
      const ipcError: IpcError = {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? { stack: error.stack } : {},
      };
      throw ipcError;
    }
  };
}

/**
 * Validates an event payload (for broadcasts) and logs validation errors.
 * Does not throw - logs errors instead to prevent disrupting event broadcasts.
 *
 * @param schema - Zod schema for validating the event payload
 * @param payload - The event payload to validate
 * @param eventName - Name of the event (for logging)
 * @returns The validated payload, or the original payload if validation fails
 */
export function validateEvent<T>(
  schema: ZodSchema<T>,
  payload: unknown,
  eventName: string
): T {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        `[IPC Validation] Event "${eventName}" payload validation failed:`,
        error.issues
      );
    } else {
      console.error(
        `[IPC Validation] Event "${eventName}" validation error:`,
        error
      );
    }
    // Return original payload as fallback (fail-soft for events)
    return payload as T;
  }
}
