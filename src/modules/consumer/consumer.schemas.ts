import { z } from "zod";

import { scorePayloadSchema } from "../scoring/scoring.schemas";

export const consumerDemandPayloadSchema = scorePayloadSchema.superRefine((payload, context) => {
  if (!payload.routing) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["routing"],
      message: "Routing information is required for dealer matching."
    });
  }

  if (!payload.consent?.dealerContactConsent) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["consent", "dealerContactConsent"],
      message: "Dealer contact consent is required before submitting demand."
    });
  }
});
