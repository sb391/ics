import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  STORAGE_MODE: z.enum(["postgres", "memory"]).default("postgres"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required when STORAGE_MODE=postgres")
    .optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
}).superRefine((value, context) => {
  if (value.STORAGE_MODE === "postgres" && !value.DATABASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DATABASE_URL"],
      message: "DATABASE_URL is required when STORAGE_MODE=postgres"
    });
  }
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  STORAGE_MODE: process.env.STORAGE_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL
});
