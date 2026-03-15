import { z } from "zod";

import {
  autoBrands,
  autoBudgetRanges,
  autoDownPaymentBands,
  autoFinancePreferences,
  autoPrimaryPreferences,
  autoPurchaseTimelines,
  autoSalaryBands
} from "./industries/auto/auto.constants";

const optionalString = z.string().trim().min(1).optional();

export const leadSchema = z
  .object({
    name: optionalString,
    email: z.string().email().optional(),
    phone: optionalString,
    city: optionalString
  })
  .default({});

export const answersSchema = z
  .object({
    budgetRange: z.enum(autoBudgetRanges).optional(),
    primaryPreference: z.enum(autoPrimaryPreferences).optional(),
    purchaseTimeline: z.enum(autoPurchaseTimelines).optional(),
    financePreference: z.enum(autoFinancePreferences).optional(),
    brandsComparing: z.array(z.enum(autoBrands)).max(5).optional(),
    downPaymentBand: z.enum(autoDownPaymentBands).optional(),
    tradeInAvailable: z.boolean().optional(),
    salaryBand: z.enum(autoSalaryBands).optional()
  })
  .strict();

export const behaviouralMetricsSchema = z
  .object({
    totalCompletionSeconds: z.number().int().nonnegative().optional(),
    timePerStepSeconds: z.record(z.string(), z.number().nonnegative()).default({}),
    backtracks: z.number().int().nonnegative().optional(),
    answerEdits: z.number().int().nonnegative().optional(),
    idlePauses: z.number().int().nonnegative().optional(),
    tabSwitches: z.number().int().nonnegative().optional(),
    scrollDepthPercent: z.number().int().min(0).max(100).optional(),
    completionRatePercent: z.number().int().min(0).max(100).optional()
  })
  .strict()
  .default({ timePerStepSeconds: {} });

export const metadataSchema = z
  .object({
    source: optionalString,
    campaign: optionalString,
    formId: optionalString,
    sessionId: optionalString
  })
  .default({});

export const scorePayloadSchema = z
  .object({
    industry: z.literal("auto"),
    lead: leadSchema,
    answers: answersSchema,
    behaviouralMetrics: behaviouralMetricsSchema,
    metadata: metadataSchema
  })
  .strict();
