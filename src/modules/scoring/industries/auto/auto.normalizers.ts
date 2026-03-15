import type { ScorePayload } from "../../scoring.types";

import type { NormalizedAutoAnswers } from "./auto.types";

const budgetTierMap = {
  under_8_lakh: 0,
  "8_12_lakh": 1,
  "12_20_lakh": 2,
  "20_plus_lakh": 3
} as const;

const budgetMidpointMap = {
  under_8_lakh: 6,
  "8_12_lakh": 10,
  "12_20_lakh": 16,
  "20_plus_lakh": 26
} as const;

const salaryTierMap = {
  under_5_lakh: 0,
  "5_10_lakh": 1,
  "10_20_lakh": 2,
  "20_35_lakh": 3,
  "35_plus_lakh": 4
} as const;

const salaryMidpointMap = {
  under_5_lakh: 4,
  "5_10_lakh": 7.5,
  "10_20_lakh": 15,
  "20_35_lakh": 27.5,
  "35_plus_lakh": 40
} as const;

const timelineUrgencyMap = {
  immediate: 4,
  "30_days": 3,
  "90_days": 2,
  exploring: 1
} as const;

const brandSegmentMap = {
  hyundai: "mainstream",
  kia: "mainstream",
  tata: "mainstream",
  mahindra: "mainstream",
  maruti_suzuki: "economy",
  toyota: "mainstream",
  honda: "mainstream",
  skoda: "upper_mainstream",
  volkswagen: "upper_mainstream",
  mg: "upper_mainstream",
  bmw: "luxury",
  mercedes_benz: "luxury",
  audi: "luxury"
} as const;

function computeSalaryBudgetAlignment(payload: ScorePayload, budgetTier: number | null, salaryTier: number | null) {
  if (budgetTier === null || salaryTier === null) {
    return "unknown" as const;
  }

  const financePreference = payload.answers.financePreference;
  const tolerance = financePreference === "yes" ? -1 : 0;
  const gap = salaryTier - budgetTier;

  if (gap >= tolerance) {
    return "strong" as const;
  }

  if (gap === tolerance - 1) {
    return "moderate" as const;
  }

  return "weak" as const;
}

export function normalizeAutoAnswers(payload: ScorePayload): NormalizedAutoAnswers {
  const budgetRange = payload.answers.budgetRange ?? null;
  const salaryBand = payload.answers.salaryBand ?? null;
  const brandsComparing = payload.answers.brandsComparing ?? [];
  const answeredQuestionCount = [
    payload.answers.budgetRange,
    payload.answers.primaryPreference,
    payload.answers.purchaseTimeline,
    payload.answers.financePreference,
    brandsComparing.length > 0 ? brandsComparing : undefined,
    payload.answers.downPaymentBand,
    payload.answers.tradeInAvailable,
    payload.answers.salaryBand
  ].filter((value) => value !== undefined).length;

  const financialAnswerCount = [
    payload.answers.financePreference,
    payload.answers.downPaymentBand,
    payload.answers.salaryBand
  ].filter((value) => value !== undefined).length;

  const contactFieldCount = [payload.lead.email, payload.lead.phone].filter(Boolean).length;
  const budgetTier = budgetRange ? budgetTierMap[budgetRange] : null;
  const salaryTier = salaryBand ? salaryTierMap[salaryBand] : null;
  const salaryBudgetAlignment = computeSalaryBudgetAlignment(payload, budgetTier, salaryTier);

  return {
    budgetRange,
    budgetTier,
    budgetMidpointLakh: budgetRange ? budgetMidpointMap[budgetRange] : null,
    primaryPreference: payload.answers.primaryPreference ?? null,
    purchaseTimeline: payload.answers.purchaseTimeline ?? null,
    timelineUrgency: payload.answers.purchaseTimeline
      ? timelineUrgencyMap[payload.answers.purchaseTimeline]
      : 0,
    financePreference: payload.answers.financePreference ?? null,
    brandCount: brandsComparing.length,
    brandsComparing,
    brandSegments: [...new Set(brandsComparing.map((brand) => brandSegmentMap[brand]))],
    downPaymentBand: payload.answers.downPaymentBand ?? null,
    salaryBand,
    salaryTier,
    salaryMidpointLakh: salaryBand ? salaryMidpointMap[salaryBand] : null,
    tradeInAvailable:
      payload.answers.tradeInAvailable === undefined ? null : payload.answers.tradeInAvailable,
    answeredQuestionCount,
    financialAnswerCount,
    contactFieldCount,
    salaryBudgetAlignment
  };
}
