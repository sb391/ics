import type { ZodTypeAny } from "zod";
import { z } from "zod";

import { AppError } from "./errors";

export function parseWithSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  code = "VALIDATION_ERROR"
): z.infer<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError(400, code, "Request validation failed", result.error.flatten());
  }

  return result.data;
}

export function buildErrorBody(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? null
    }
  };
}
