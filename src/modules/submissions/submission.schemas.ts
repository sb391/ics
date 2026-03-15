import { z } from "zod";

import { autoFinancePreferences, autoPurchaseTimelines } from "../scoring/industries/auto/auto.constants";
import { scorePayloadSchema } from "../scoring/scoring.schemas";
import { INTENT_CATEGORY_SLUGS } from "../scoring/scoring.types";
import { OUTCOME_STATUSES } from "./submission.types";

export const submissionPayloadSchema = scorePayloadSchema;

export const submissionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  category: z.enum(INTENT_CATEGORY_SLUGS).optional(),
  timeline: z.enum(autoPurchaseTimelines).optional(),
  financePreference: z.enum(autoFinancePreferences).optional(),
  outcomeStatus: z.enum(OUTCOME_STATUSES).optional(),
  reviewState: z.enum(["open", "closed", "all"]).optional(),
  sortBy: z.enum(["createdAt", "score"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

const optionalString = (maxLength: number) => z.string().trim().min(1).max(maxLength).optional();

export const submissionOutcomeSchema = z.object({
  status: z.enum(OUTCOME_STATUSES),
  note: optionalString(500),
  source: optionalString(80),
  happenedAt: z.string().datetime().optional()
});
