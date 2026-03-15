import { z } from "zod";

import { autoFinancePreferences, autoPurchaseTimelines } from "../scoring/industries/auto/auto.constants";
import { scorePayloadSchema } from "../scoring/scoring.schemas";
import { INTENT_CATEGORY_SLUGS } from "../scoring/scoring.types";

export const submissionPayloadSchema = scorePayloadSchema;

export const submissionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  category: z.enum(INTENT_CATEGORY_SLUGS).optional(),
  timeline: z.enum(autoPurchaseTimelines).optional(),
  financePreference: z.enum(autoFinancePreferences).optional(),
  sortBy: z.enum(["createdAt", "score"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
