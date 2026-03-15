import { describe, expect, it } from "vitest";

import { AUTO_SAMPLE_PAYLOAD } from "../../src/modules/scoring/industries/auto/auto.constants";
import { scoreAutoLead } from "../../src/modules/scoring/industries/auto/auto.scorer";
import { submissionPayloadSchema } from "../../src/modules/submissions/submission.schemas";

describe("auto scoring engine", () => {
  it("scores a strong near-term buyer highly", () => {
    const result = scoreAutoLead(submissionPayloadSchema.parse(AUTO_SAMPLE_PAYLOAD));

    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(["Serious Buyer", "High Intent Buyer"]).toContain(result.categoryLabel);
    expect(result.positives).toContain("MULTI_BRAND_COMPARISON");
    expect(result.breakdown.interactionScore).toBeGreaterThanOrEqual(30);
  });

  it("penalizes weak consistency and low-engagement patterns", () => {
    const result = scoreAutoLead({
      industry: "auto",
      lead: {
        email: "casual@example.com"
      },
      answers: {
        budgetRange: "under_8_lakh",
        primaryPreference: "mileage",
        purchaseTimeline: "exploring",
        financePreference: "no",
        brandsComparing: ["bmw"],
        salaryBand: "under_5_lakh"
      },
      behaviouralMetrics: {
        totalCompletionSeconds: 28,
        timePerStepSeconds: {
          budgetRange: 2
        },
        backtracks: 7,
        answerEdits: 9,
        idlePauses: 5,
        tabSwitches: 6,
        scrollDepthPercent: 31,
        completionRatePercent: 54
      },
      metadata: {
        source: "marketplace_widget"
      }
    });

    expect(result.totalScore).toBeLessThanOrEqual(45);
    expect(result.negatives).toContain("LUXURY_BUDGET_MISMATCH");
    expect(result.negatives).toContain("EXTREMELY_FAST_COMPLETION");
    expect(result.categoryLabel).not.toBe("High Intent Buyer");
  });
});
