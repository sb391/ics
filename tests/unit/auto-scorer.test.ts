import { describe, expect, it } from "vitest";

import { scoreAutoLead } from "../../src/modules/scoring/industries/auto/auto.scorer";
import { submissionPayloadSchema } from "../../src/modules/submissions/submission.schemas";
import { buildAutoPayload } from "../helpers/auto-payload";

describe("auto scoring engine", () => {
  it("scores a coherent near-term mainstream buyer as a high-confidence scenario without defaulting to perfection", () => {
    const payload = submissionPayloadSchema.parse(buildAutoPayload());
    const result = scoreAutoLead(payload);

    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.totalScore).toBeLessThanOrEqual(95);
    expect(["Serious Buyer", "High Intent Buyer"]).toContain(result.categoryLabel);
    expect(result.breakdown.demandScore).toBeGreaterThanOrEqual(18);
    expect(result.breakdown.consistencyScore).toBeGreaterThanOrEqual(18);
    expect(result.breakdown.readinessScore).toBeGreaterThanOrEqual(18);
    expect(result.positives).toContain("DEMAND_PROFILE_HIGH_CLARITY");
    expect(result.positives).toContain("FUNDED_BUY_PATH");
    expect(result.scoreVersion).toBe("ics-auto-score-2026.03.15");
    expect(result.weightVersion).toBe("ics-auto-weights-2026.03.15");
    expect(result.ruleSetVersion).toBe("ics-auto-rules-2026.03.15");
    expect(result.predictionContext.posture).toBe("prediction_under_validation");
    expect(result.ruleContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleCode: "DEMAND_PROFILE_HIGH_CLARITY",
          layer: "demand",
          points: 8,
          direction: "positive"
        })
      ])
    );
  });

  it("penalizes shallow, rushed full-completion sessions", () => {
    const payload = submissionPayloadSchema.parse(
      buildAutoPayload({
        behaviouralMetrics: {
          totalCompletionSeconds: 44,
          timePerStepSeconds: {
            budgetRange: 2,
            primaryPreference: 2,
            purchaseTimeline: 2,
            financePreference: 2,
            brandsComparing: 3,
            downPaymentBand: 2,
            tradeInAvailable: 1,
            salaryBand: 2,
            bodyStyle: 2,
            fuelType: 2,
            usagePattern: 2,
            monthlyKmBand: 1,
            purchaseReason: 2,
            currentVehicleAgeBand: 1,
            decisionMaker: 2,
            variantClarity: 2,
            testDriveReadiness: 2,
            monthlyEmiComfortBand: 2
          },
          backtracks: 0,
          answerEdits: 0,
          idlePauses: 4,
          tabSwitches: 6,
          scrollDepthPercent: 62,
          completionRatePercent: 100
        }
      })
    );

    const result = scoreAutoLead(payload);

    expect(result.breakdown.behaviouralScore).toBeLessThanOrEqual(3);
    expect(result.breakdown.interactionScore).toBeLessThanOrEqual(10);
    expect(result.totalScore).toBeLessThan(78);
    expect(result.negatives).toContain("RUSHED_COMPLETION_PATTERN");
    expect(result.negatives).toContain("SHALLOW_ENGAGEMENT_PATTERN");
  });

  it("heavily penalizes premium demand that lacks economic plausibility", () => {
    const payload = submissionPayloadSchema.parse(
      buildAutoPayload({
        answers: {
          budgetRange: "under_8_lakh",
          primaryPreference: "brand_prestige",
          purchaseTimeline: "30_days",
          financePreference: "no",
          brandsComparing: ["bmw"],
          downPaymentBand: "below_10_percent",
          tradeInAvailable: false,
          salaryBand: "under_5_lakh",
          bodyStyle: "sedan",
          fuelType: "petrol",
          usagePattern: "city_commute",
          monthlyKmBand: "under_500",
          purchaseReason: "upgrade",
          currentVehicleAgeBand: "4_7_years",
          decisionMaker: "family",
          variantClarity: "open",
          testDriveReadiness: "open",
          monthlyEmiComfortBand: "under_10k"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 130,
          timePerStepSeconds: {
            budgetRange: 5,
            primaryPreference: 5,
            purchaseTimeline: 5,
            financePreference: 5,
            brandsComparing: 7,
            salaryBand: 6,
            bodyStyle: 4,
            purchaseReason: 5,
            currentVehicleAgeBand: 4,
            variantClarity: 4,
            testDriveReadiness: 4
          },
          backtracks: 5,
          answerEdits: 7,
          idlePauses: 3,
          tabSwitches: 4,
          scrollDepthPercent: 48,
          completionRatePercent: 86
        }
      })
    );

    const result = scoreAutoLead(payload);

    expect(result.totalScore).toBeLessThanOrEqual(35);
    expect(result.categoryLabel).toBe("Casual Browser");
    expect(result.breakdown.consistencyScore).toBeLessThanOrEqual(6);
    expect(result.breakdown.readinessScore).toBeLessThanOrEqual(5);
    expect(result.negatives).toContain("BUDGET_BRAND_MISMATCH");
    expect(result.negatives).toContain("PREMIUM_WITHOUT_FUNDING_PATH");
    expect(result.ruleContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleCode: "WEAK_TRANSACTION_FEASIBILITY",
          layer: "readiness",
          points: -5,
          direction: "negative"
        })
      ])
    );
  });

  it("rewards replacement urgency when demand and funding evidence line up", () => {
    const payload = submissionPayloadSchema.parse(
      buildAutoPayload({
        answers: {
          primaryPreference: "safety",
          brandsComparing: ["tata", "mahindra"],
          purchaseReason: "replacement",
          currentVehicleAgeBand: "8_plus_years",
          usagePattern: "highway_travel",
          fuelType: "diesel",
          variantClarity: "trim_shortlist"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 248,
          answerEdits: 4
        }
      })
    );

    const result = scoreAutoLead(payload);

    expect(result.totalScore).toBeGreaterThanOrEqual(84);
    expect(result.breakdown.demandScore).toBeGreaterThanOrEqual(20);
    expect(result.breakdown.readinessScore).toBeGreaterThanOrEqual(20);
    expect(result.positives).toContain("HIGH_REPLACEMENT_PRESSURE");
    expect(result.positives).toContain("TEST_DRIVE_MOMENTUM");
  });

  it("does not treat missing frontend completion telemetry as a low-completion behavioural signal", () => {
    const payload = submissionPayloadSchema.parse(
      buildAutoPayload({
        behaviouralMetrics: {
          completionRatePercent: undefined
        },
        metadata: {
          source: undefined,
          campaign: undefined,
          formId: undefined,
          sessionId: undefined,
          channel: undefined,
          sdkVersion: undefined
        }
      })
    );

    const result = scoreAutoLead(payload);

    expect(result.negatives).not.toContain("LOW_COMPLETION_RATE");
    expect(result.negatives).not.toContain("LOW_DECLARATION_COVERAGE");
    expect(result.ruleContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleCode: "FULL_DECLARATION_COMPLETION",
          layer: "behavioural",
          direction: "positive"
        })
      ])
    );
  });

  it("keeps broad, low-specificity researchers out of the high-intent bands", () => {
    const payload = submissionPayloadSchema.parse(
      buildAutoPayload({
        answers: {
          budgetRange: "8_12_lakh",
          primaryPreference: "features",
          purchaseTimeline: "exploring",
          financePreference: "undecided",
          brandsComparing: ["hyundai", "kia", "tata", "mahindra", "toyota"],
          downPaymentBand: undefined,
          tradeInAvailable: undefined,
          salaryBand: "10_20_lakh",
          bodyStyle: "suv",
          fuelType: "open",
          usagePattern: "family_use",
          monthlyKmBand: "500_1000",
          purchaseReason: "first_car",
          currentVehicleAgeBand: "none",
          decisionMaker: "family",
          variantClarity: "open",
          testDriveReadiness: "not_interested",
          monthlyEmiComfortBand: "not_sure"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 126,
          timePerStepSeconds: {
            budgetRange: 7,
            primaryPreference: 7,
            purchaseTimeline: 8,
            financePreference: 6,
            brandsComparing: 9,
            salaryBand: 7,
            bodyStyle: 8,
            fuelType: 5,
            usagePattern: 6,
            monthlyKmBand: 4,
            purchaseReason: 6,
            currentVehicleAgeBand: 3,
            decisionMaker: 5,
            variantClarity: 3,
            testDriveReadiness: 2,
            monthlyEmiComfortBand: 3
          },
          backtracks: 1,
          answerEdits: 1,
          idlePauses: 2,
          tabSwitches: 2,
          scrollDepthPercent: 66,
          completionRatePercent: 92
        }
      })
    );

    const result = scoreAutoLead(payload);

    expect(result.totalScore).toBeLessThanOrEqual(60);
    expect(result.breakdown.demandScore).toBeLessThan(15);
    expect(result.categoryLabel).not.toBe("Serious Buyer");
    expect(result.negatives).toContain("RESEARCH_HEAVY_PATTERN");
    expect(result.negatives).toContain("OVERLY_BROAD_SHORTLIST");
  });
});
