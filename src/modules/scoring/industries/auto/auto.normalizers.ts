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

const emiTierMap = {
  under_10k: 0,
  "10k_20k": 1,
  "20k_35k": 2,
  "35k_plus": 3,
  not_sure: -1
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

const coreAnswerKeys = [
  "budgetRange",
  "primaryPreference",
  "purchaseTimeline",
  "financePreference",
  "bodyStyle",
  "fuelType",
  "usagePattern",
  "purchaseReason",
  "variantClarity",
  "testDriveReadiness"
] as const;

const optionalAnswerKeys = [
  "brandsComparing",
  "downPaymentBand",
  "tradeInAvailable",
  "salaryBand",
  "monthlyKmBand",
  "currentVehicleAgeBand",
  "decisionMaker",
  "monthlyEmiComfortBand"
] as const;

const declarationAnswerKeys = [
  "budgetRange",
  "primaryPreference",
  "purchaseTimeline",
  "financePreference",
  "bodyStyle",
  "purchaseReason",
  "variantClarity",
  "testDriveReadiness"
] as const;

function answeredArray(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined;
}

function computeEngagementPace(totalCompletionSeconds: number | undefined, averageStepSeconds: number | null) {
  if (!totalCompletionSeconds && averageStepSeconds === null) {
    return "unknown" as const;
  }

  if (
    (totalCompletionSeconds !== undefined && totalCompletionSeconds < 75) ||
    (averageStepSeconds !== null && averageStepSeconds < 5)
  ) {
    return "rushed" as const;
  }

  if (
    (totalCompletionSeconds !== undefined && totalCompletionSeconds > 720) ||
    (averageStepSeconds !== null && averageStepSeconds > 32)
  ) {
    return "slow" as const;
  }

  return "measured" as const;
}

function computeSessionFocus(tabSwitches: number | undefined, idlePauses: number | undefined) {
  if (tabSwitches === undefined && idlePauses === undefined) {
    return "unknown" as const;
  }

  if ((tabSwitches ?? 0) <= 1 && (idlePauses ?? 0) <= 1) {
    return "strong" as const;
  }

  if ((tabSwitches ?? 0) <= 3 && (idlePauses ?? 0) <= 2) {
    return "mixed" as const;
  }

  return "weak" as const;
}

function computeFrictionLevel(payload: ScorePayload) {
  const metrics = payload.behaviouralMetrics;
  const weightedFriction =
    (metrics.backtracks ?? 0) +
    (metrics.answerEdits ?? 0) +
    (metrics.idlePauses ?? 0) * 2 +
    (metrics.tabSwitches ?? 0) * 2;

  if (weightedFriction <= 6) {
    return "low" as const;
  }

  if (weightedFriction <= 12) {
    return "moderate" as const;
  }

  return "high" as const;
}

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

function computeBudgetEmiAlignment(
  budgetTier: number | null,
  emiComfortBand: ScorePayload["answers"]["monthlyEmiComfortBand"] | undefined
) {
  if (budgetTier === null || !emiComfortBand || emiComfortBand === "not_sure") {
    return "unknown" as const;
  }

  const emiTier = emiTierMap[emiComfortBand];
  const gap = emiTier - budgetTier;

  if (gap >= 0) {
    return "strong" as const;
  }

  if (gap === -1) {
    return "moderate" as const;
  }

  return "weak" as const;
}

function computeBudgetBrandAlignment(
  budgetTier: number | null,
  brandSegments: string[],
  financePreference: ScorePayload["answers"]["financePreference"] | undefined
) {
  if (budgetTier === null || brandSegments.length === 0) {
    return "unknown" as const;
  }

  if (brandSegments.includes("luxury")) {
    if (budgetTier >= 3) {
      return "strong" as const;
    }

    if (budgetTier === 2 && financePreference === "yes") {
      return "stretch" as const;
    }

    return budgetTier === 2 ? ("stretch" as const) : ("mismatch" as const);
  }

  if (brandSegments.includes("upper_mainstream") && budgetTier === 0) {
    return "stretch" as const;
  }

  return "strong" as const;
}

function getPreferenceSegmentScore(
  preference: ScorePayload["answers"]["primaryPreference"] | undefined,
  segment: string
) {
  if (!preference) {
    return 0;
  }

  switch (preference) {
    case "brand_prestige":
      return segment === "luxury" ? 2 : segment === "upper_mainstream" ? 1 : -1;
    case "performance":
      return segment === "luxury" || segment === "upper_mainstream"
        ? 2
        : segment === "mainstream"
          ? 1
          : -1;
    case "features":
      return segment === "luxury" || segment === "upper_mainstream"
        ? 2
        : segment === "mainstream"
          ? 1
          : 0;
    case "mileage":
    case "after_sales":
      return segment === "economy" || segment === "mainstream"
        ? 2
        : segment === "upper_mainstream"
          ? 1
          : -1;
    case "safety":
      return segment === "mainstream" || segment === "upper_mainstream"
        ? 2
        : segment === "luxury"
          ? 1
          : 0;
    default:
      return 0;
  }
}

function computePreferenceBrandAlignment(
  preference: ScorePayload["answers"]["primaryPreference"] | undefined,
  brandSegments: string[]
) {
  if (!preference || brandSegments.length === 0) {
    return "unknown" as const;
  }

  const scores = brandSegments.map((segment) => getPreferenceSegmentScore(preference, segment));
  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  if (best >= 2 && worst >= 1) {
    return "strong" as const;
  }

  if (best >= 1) {
    return "moderate" as const;
  }

  return "weak" as const;
}

function computeBodyStyleUsageAlignment(
  bodyStyle: ScorePayload["answers"]["bodyStyle"] | undefined,
  usagePattern: ScorePayload["answers"]["usagePattern"] | undefined
) {
  if (!bodyStyle || !usagePattern) {
    return "unknown" as const;
  }

  if (
    (usagePattern === "family_use" && (bodyStyle === "suv" || bodyStyle === "mpv")) ||
    (usagePattern === "city_commute" && (bodyStyle === "hatchback" || bodyStyle === "sedan")) ||
    (usagePattern === "highway_travel" && (bodyStyle === "suv" || bodyStyle === "sedan")) ||
    (usagePattern === "business_use" && (bodyStyle === "sedan" || bodyStyle === "suv")) ||
    (usagePattern === "enthusiast" && (bodyStyle === "sedan" || bodyStyle === "luxury_suv"))
  ) {
    return "strong" as const;
  }

  if (usagePattern === "rideshare" && bodyStyle === "luxury_suv") {
    return "weak" as const;
  }

  return "moderate" as const;
}

function computeFuelUsageAlignment(
  fuelType: ScorePayload["answers"]["fuelType"] | undefined,
  usagePattern: ScorePayload["answers"]["usagePattern"] | undefined,
  monthlyKmBand: ScorePayload["answers"]["monthlyKmBand"] | undefined
) {
  if (!fuelType || !usagePattern) {
    return "unknown" as const;
  }

  if (fuelType === "open") {
    return "moderate" as const;
  }

  if (
    (usagePattern === "city_commute" && (fuelType === "ev" || fuelType === "hybrid" || fuelType === "cng")) ||
    (usagePattern === "highway_travel" && (fuelType === "diesel" || fuelType === "hybrid")) ||
    (usagePattern === "rideshare" && (fuelType === "cng" || fuelType === "diesel" || fuelType === "ev"))
  ) {
    return "strong" as const;
  }

  if (monthlyKmBand === "2000_plus" && fuelType === "petrol") {
    return "weak" as const;
  }

  return "moderate" as const;
}

function computeFundingReadiness(
  payload: ScorePayload,
  salaryBudgetAlignment: NormalizedAutoAnswers["salaryBudgetAlignment"],
  budgetEmiAlignment: NormalizedAutoAnswers["budgetEmiAlignment"],
  budgetBrandAlignment: NormalizedAutoAnswers["budgetBrandAlignment"]
) {
  const evidenceCount = [
    payload.answers.financePreference,
    payload.answers.downPaymentBand,
    payload.answers.salaryBand,
    payload.answers.monthlyEmiComfortBand,
    payload.answers.tradeInAvailable !== undefined ? "tradeIn" : undefined
  ].filter(Boolean).length;

  if (evidenceCount === 0) {
    return "unknown" as const;
  }

  if (budgetBrandAlignment === "mismatch") {
    return "weak" as const;
  }

  if (budgetBrandAlignment === "stretch" && payload.answers.financePreference !== "yes") {
    return "weak" as const;
  }

  if (
    payload.answers.financePreference === "yes" &&
    salaryBudgetAlignment !== "weak" &&
    budgetEmiAlignment !== "weak" &&
    (payload.answers.downPaymentBand || payload.answers.tradeInAvailable)
  ) {
    return "strong" as const;
  }

  if (
    payload.answers.financePreference === "no" &&
    salaryBudgetAlignment === "strong" &&
    (payload.answers.downPaymentBand === "20_30_percent" ||
      payload.answers.downPaymentBand === "30_plus_percent" ||
      payload.answers.tradeInAvailable)
  ) {
    return "strong" as const;
  }

  if (salaryBudgetAlignment === "weak" || budgetEmiAlignment === "weak") {
    return "weak" as const;
  }

  if (evidenceCount >= 3) {
    return "moderate" as const;
  }

  return "weak" as const;
}

function computeReplacementPressure(
  purchaseReason: ScorePayload["answers"]["purchaseReason"] | undefined,
  currentVehicleAgeBand: ScorePayload["answers"]["currentVehicleAgeBand"] | undefined,
  tradeInAvailable: boolean | undefined
) {
  if (purchaseReason === "replacement" && currentVehicleAgeBand === "8_plus_years") {
    return "high" as const;
  }

  if (
    purchaseReason === "upgrade" ||
    purchaseReason === "replacement" ||
    tradeInAvailable ||
    currentVehicleAgeBand === "4_7_years"
  ) {
    return "medium" as const;
  }

  return "low" as const;
}

function computeDecisionAuthority(decisionMaker: ScorePayload["answers"]["decisionMaker"] | undefined) {
  if (!decisionMaker) {
    return "unknown" as const;
  }

  if (decisionMaker === "self") {
    return "strong" as const;
  }

  if (decisionMaker === "self_and_spouse" || decisionMaker === "family") {
    return "shared" as const;
  }

  return "external" as const;
}

function computeDemandClarity(
  payload: ScorePayload,
  brandCount: number,
  coreCount: number
) {
  const specificityCount = [
    payload.answers.bodyStyle,
    payload.answers.fuelType,
    payload.answers.purchaseReason,
    payload.answers.variantClarity && payload.answers.variantClarity !== "open"
      ? payload.answers.variantClarity
      : undefined,
    payload.answers.testDriveReadiness && payload.answers.testDriveReadiness !== "not_interested"
      ? payload.answers.testDriveReadiness
      : undefined,
    brandCount > 0 ? "brands" : undefined
  ].filter(Boolean).length;

  if (coreCount >= 6 && specificityCount >= 4) {
    return "high" as const;
  }

  if (coreCount >= 4 && specificityCount >= 2) {
    return "medium" as const;
  }

  return "low" as const;
}

function computeDemandStage(
  timelineUrgency: number,
  demandClarity: NormalizedAutoAnswers["demandClarity"],
  testDriveReadiness: ScorePayload["answers"]["testDriveReadiness"] | undefined,
  variantClarity: ScorePayload["answers"]["variantClarity"] | undefined
) {
  if (
    testDriveReadiness === "scheduled_soon" &&
    timelineUrgency >= 3 &&
    (variantClarity === "trim_shortlist" || variantClarity === "exact_variant")
  ) {
    return "transaction_ready" as const;
  }

  if (timelineUrgency >= 2 && demandClarity !== "low") {
    return "active_eval" as const;
  }

  return "researching" as const;
}

export function normalizeAutoAnswers(payload: ScorePayload): NormalizedAutoAnswers {
  const brandsComparing = payload.answers.brandsComparing ?? [];
  const brandSegments = [...new Set(brandsComparing.map((brand) => brandSegmentMap[brand]))];
  const answeredCoreQuestionCount = coreAnswerKeys.filter((key) => answeredArray(payload.answers[key])).length;
  const answeredOptionalQuestionCount = optionalAnswerKeys.filter((key) => answeredArray(payload.answers[key])).length;
  const declarationAnswerCount = declarationAnswerKeys.filter((key) => answeredArray(payload.answers[key])).length;
  const answeredQuestionCount = answeredCoreQuestionCount + answeredOptionalQuestionCount;
  const declarationCompletionRatePercent = Number(
    ((declarationAnswerCount / declarationAnswerKeys.length) * 100).toFixed(1)
  );
  const declaredCompletionRatePercent = payload.behaviouralMetrics.completionRatePercent ?? null;
  const completionRateSource =
    declaredCompletionRatePercent === null ? "derived_from_declaration" : "declared";
  const effectiveCompletionRatePercent =
    declaredCompletionRatePercent ?? declarationCompletionRatePercent;

  const fundingAnswerCount = [
    payload.answers.financePreference,
    payload.answers.downPaymentBand,
    payload.answers.salaryBand,
    payload.answers.monthlyEmiComfortBand,
    payload.answers.tradeInAvailable !== undefined ? "tradeIn" : undefined
  ].filter(Boolean).length;

  const demandSignalCount = [
    payload.answers.purchaseTimeline,
    payload.answers.bodyStyle,
    payload.answers.fuelType,
    payload.answers.usagePattern,
    payload.answers.purchaseReason,
    payload.answers.variantClarity,
    payload.answers.testDriveReadiness,
    brandsComparing.length > 0 ? "brands" : undefined
  ].filter(Boolean).length;

  const stepTimingValues = Object.values(payload.behaviouralMetrics.timePerStepSeconds ?? {});
  const stepTimingCoverageCount = stepTimingValues.length;
  const stepTimingTotalSeconds = stepTimingValues.reduce((sum, seconds) => sum + seconds, 0);
  const averageStepSeconds =
    stepTimingCoverageCount > 0 ? Number((stepTimingTotalSeconds / stepTimingCoverageCount).toFixed(1)) : null;
  const maxStepSeconds = stepTimingCoverageCount > 0 ? Math.max(...stepTimingValues) : null;

  const budgetRange = payload.answers.budgetRange ?? null;
  const salaryBand = payload.answers.salaryBand ?? null;
  const budgetTier = budgetRange ? budgetTierMap[budgetRange] : null;
  const salaryTier = salaryBand ? salaryTierMap[salaryBand] : null;
  const timelineUrgency = payload.answers.purchaseTimeline
    ? timelineUrgencyMap[payload.answers.purchaseTimeline]
    : 0;
  const salaryBudgetAlignment = computeSalaryBudgetAlignment(payload, budgetTier, salaryTier);
  const budgetEmiAlignment = computeBudgetEmiAlignment(budgetTier, payload.answers.monthlyEmiComfortBand);
  const budgetBrandAlignment = computeBudgetBrandAlignment(
    budgetTier,
    brandSegments,
    payload.answers.financePreference
  );
  const demandClarity = computeDemandClarity(payload, brandsComparing.length, answeredCoreQuestionCount);
  const engagementPace = computeEngagementPace(
    payload.behaviouralMetrics.totalCompletionSeconds,
    averageStepSeconds
  );
  const sessionFocus = computeSessionFocus(
    payload.behaviouralMetrics.tabSwitches,
    payload.behaviouralMetrics.idlePauses
  );

  return {
    budgetRange,
    budgetTier,
    budgetMidpointLakh: budgetRange ? budgetMidpointMap[budgetRange] : null,
    primaryPreference: payload.answers.primaryPreference ?? null,
    purchaseTimeline: payload.answers.purchaseTimeline ?? null,
    timelineUrgency,
    financePreference: payload.answers.financePreference ?? null,
    brandCount: brandsComparing.length,
    brandsComparing,
    brandSegments,
    downPaymentBand: payload.answers.downPaymentBand ?? null,
    salaryBand,
    salaryTier,
    salaryMidpointLakh: salaryBand ? salaryMidpointMap[salaryBand] : null,
    bodyStyle: payload.answers.bodyStyle ?? null,
    fuelType: payload.answers.fuelType ?? null,
    usagePattern: payload.answers.usagePattern ?? null,
    monthlyKmBand: payload.answers.monthlyKmBand ?? null,
    purchaseReason: payload.answers.purchaseReason ?? null,
    currentVehicleAgeBand: payload.answers.currentVehicleAgeBand ?? null,
    decisionMaker: payload.answers.decisionMaker ?? null,
    variantClarity: payload.answers.variantClarity ?? null,
    testDriveReadiness: payload.answers.testDriveReadiness ?? null,
    monthlyEmiComfortBand: payload.answers.monthlyEmiComfortBand ?? null,
    tradeInAvailable:
      payload.answers.tradeInAvailable === undefined ? null : payload.answers.tradeInAvailable,
    answeredQuestionCount,
    answeredCoreQuestionCount,
    answeredOptionalQuestionCount,
    fundingAnswerCount,
    demandSignalCount,
    declarationAnswerCount,
    declarationCompletionRatePercent,
    declaredCompletionRatePercent,
    effectiveCompletionRatePercent,
    completionRateSource,
    stepTimingCoverageCount,
    stepTimingTotalSeconds,
    averageStepSeconds,
    maxStepSeconds,
    engagementPace,
    sessionFocus,
    frictionLevel: computeFrictionLevel(payload),
    demandClarity,
    demandStage: computeDemandStage(
      timelineUrgency,
      demandClarity,
      payload.answers.testDriveReadiness,
      payload.answers.variantClarity
    ),
    salaryBudgetAlignment,
    budgetBrandAlignment,
    budgetEmiAlignment,
    preferenceBrandAlignment: computePreferenceBrandAlignment(
      payload.answers.primaryPreference,
      brandSegments
    ),
    bodyStyleUsageAlignment: computeBodyStyleUsageAlignment(
      payload.answers.bodyStyle,
      payload.answers.usagePattern
    ),
    fuelUsageAlignment: computeFuelUsageAlignment(
      payload.answers.fuelType,
      payload.answers.usagePattern,
      payload.answers.monthlyKmBand
    ),
    fundingReadiness: computeFundingReadiness(
      payload,
      salaryBudgetAlignment,
      budgetEmiAlignment,
      budgetBrandAlignment
    ),
    replacementPressure: computeReplacementPressure(
      payload.answers.purchaseReason,
      payload.answers.currentVehicleAgeBand,
      payload.answers.tradeInAvailable
    ),
    decisionAuthority: computeDecisionAuthority(payload.answers.decisionMaker),
    comparisonBreadth:
      brandsComparing.length === 0 ? "none" : brandsComparing.length <= 3 ? "focused" : "broad"
  };
}
