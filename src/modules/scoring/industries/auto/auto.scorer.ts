import { getIntentBand, type ScorePayload, type ScoreBreakdown, type ScoredLead } from "../../scoring.types";

import { normalizeAutoAnswers } from "./auto.normalizers";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pushReason(list: string[], code: string) {
  if (!list.includes(code)) {
    list.push(code);
  }
}

function scoreBehavioural(payload: ScorePayload) {
  const metrics = payload.behaviouralMetrics;
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 0;

  if ((metrics.completionRatePercent ?? 0) >= 100) {
    score += 10;
    pushReason(positives, "FULL_COMPLETION_RATE");
  } else if ((metrics.completionRatePercent ?? 0) >= 85) {
    score += 7;
    pushReason(positives, "HIGH_COMPLETION_RATE");
  } else if ((metrics.completionRatePercent ?? 0) >= 60) {
    score += 4;
  } else {
    pushReason(negatives, "LOW_COMPLETION_RATE");
  }

  const totalCompletionSeconds = metrics.totalCompletionSeconds ?? 0;
  if (totalCompletionSeconds >= 90 && totalCompletionSeconds <= 360) {
    score += 8;
    pushReason(positives, "THOUGHTFUL_COMPLETION_TIME");
  } else if (totalCompletionSeconds >= 60 && totalCompletionSeconds < 90) {
    score += 5;
  } else if (totalCompletionSeconds > 360 && totalCompletionSeconds <= 540) {
    score += 4;
  } else if (totalCompletionSeconds > 0 && totalCompletionSeconds < 45) {
    pushReason(negatives, "EXTREMELY_FAST_COMPLETION");
  } else if (totalCompletionSeconds > 720) {
    score += 1;
    pushReason(negatives, "VERY_LONG_COMPLETION_WINDOW");
  }

  const answerEdits = metrics.answerEdits ?? 0;
  if (answerEdits >= 1 && answerEdits <= 4) {
    score += 4;
    pushReason(positives, "REVIEWED_ANSWERS");
  } else if (answerEdits >= 8) {
    score -= 2;
    pushReason(negatives, "EXCESSIVE_ANSWER_EDITS");
  }

  const backtracks = metrics.backtracks ?? 0;
  if (backtracks >= 1 && backtracks <= 3) {
    score += 2;
    pushReason(positives, "INTENTIONAL_STEP_REVIEW");
  } else if (backtracks >= 6) {
    score -= 3;
    pushReason(negatives, "HEAVY_BACKTRACKING");
  }

  const tabSwitches = metrics.tabSwitches ?? 0;
  if (tabSwitches <= 1) {
    score += 3;
    pushReason(positives, "FOCUSED_SESSION");
  } else if (tabSwitches >= 4) {
    score -= 4;
    pushReason(negatives, "EXCESSIVE_TAB_SWITCHING");
  }

  const idlePauses = metrics.idlePauses ?? 0;
  if (idlePauses <= 1) {
    score += 3;
    pushReason(positives, "LOW_IDLE_PAUSES");
  } else if (idlePauses >= 4) {
    score -= 4;
    pushReason(negatives, "HIGH_IDLE_PAUSES");
  }

  const scrollDepthPercent = metrics.scrollDepthPercent ?? 0;
  if (scrollDepthPercent >= 85) {
    score += 4;
    pushReason(positives, "HIGH_SCROLL_DEPTH");
  } else if (scrollDepthPercent > 0 && scrollDepthPercent < 50) {
    pushReason(negatives, "LOW_SCROLL_DEPTH");
  }

  return {
    score: clamp(score, 0, 30),
    positives,
    negatives
  };
}

function scoreInteraction(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = Math.round((normalized.answeredQuestionCount / 8) * 24);

  if (normalized.answeredQuestionCount === 8) {
    pushReason(positives, "FULL_QUESTION_COVERAGE");
  } else if (normalized.answeredQuestionCount >= 6) {
    pushReason(positives, "STRONG_QUESTION_COVERAGE");
  } else {
    pushReason(negatives, "SHALLOW_FORM_DEPTH");
  }

  if (normalized.brandCount >= 2) {
    score += 5;
    pushReason(positives, "MULTI_BRAND_COMPARISON");
  } else if (normalized.brandCount === 1) {
    score += 2;
  }

  if (normalized.financialAnswerCount === 3) {
    score += 8;
    pushReason(positives, "FINANCIAL_DETAILS_SHARED");
  } else if (normalized.financialAnswerCount === 2) {
    score += 5;
  } else if (normalized.financialAnswerCount === 1) {
    score += 2;
  } else {
    pushReason(negatives, "MISSING_FINANCIAL_CONTEXT");
  }

  if (payload.answers.purchaseTimeline) {
    score += 2;
  }

  if (payload.answers.tradeInAvailable !== undefined) {
    score += 1;
  }

  if (normalized.contactFieldCount === 2) {
    score += 4;
    pushReason(positives, "CONTACT_READY_LEAD");
  } else if (normalized.contactFieldCount === 1) {
    score += 2;
  }

  if (payload.lead.city) {
    score += 1;
  }

  return {
    score: clamp(score, 0, 40),
    positives,
    negatives
  };
}

function scoreConsistency(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 8;
  const luxurySelected = normalized.brandSegments.includes("luxury");
  const mainstreamSelected = normalized.brandSegments.some((segment) =>
    ["economy", "mainstream", "upper_mainstream"].includes(segment)
  );

  if (normalized.budgetTier === 0 && luxurySelected && payload.answers.financePreference !== "yes") {
    score -= 8;
    pushReason(negatives, "LUXURY_BUDGET_MISMATCH");
  }

  if (normalized.budgetTier === 1 && luxurySelected) {
    score -= 6;
    pushReason(negatives, "PREMIUM_BUDGET_STRETCH");
  }

  if (normalized.budgetTier === 0 && mainstreamSelected && !luxurySelected) {
    score += 3;
    pushReason(positives, "ENTRY_BUDGET_BRAND_ALIGNMENT");
  }

  if (normalized.budgetTier === 2 && mainstreamSelected) {
    score += 4;
    pushReason(positives, "MASS_MARKET_BUDGET_ALIGNMENT");
  }

  if (normalized.budgetTier === 3 && luxurySelected) {
    score += 4;
    pushReason(positives, "PREMIUM_BUDGET_ALIGNMENT");
  }

  if (normalized.primaryPreference === "brand_prestige" && luxurySelected) {
    score += 3;
    pushReason(positives, "PRESTIGE_PREFERENCE_MATCH");
  }

  if (
    normalized.primaryPreference === "mileage" &&
    luxurySelected &&
    (normalized.budgetTier === 0 || normalized.budgetTier === 1)
  ) {
    score -= 3;
    pushReason(negatives, "PREFERENCE_BRAND_TENSION");
  }

  if (normalized.salaryBudgetAlignment === "strong") {
    score += 4;
    pushReason(positives, "SALARY_BUDGET_ALIGNMENT");
  } else if (normalized.salaryBudgetAlignment === "moderate") {
    score += 1;
  } else if (normalized.salaryBudgetAlignment === "weak") {
    score -= 5;
    pushReason(negatives, "SALARY_BUDGET_MISMATCH");
  }

  if (
    normalized.timelineUrgency >= 3 &&
    normalized.brandCount >= 1 &&
    normalized.financialAnswerCount >= 2
  ) {
    score += 3;
    pushReason(positives, "NEAR_TERM_BUYING_SIGNAL");
  }

  if (
    normalized.purchaseTimeline === "exploring" &&
    normalized.brandCount === 0 &&
    normalized.financialAnswerCount === 0
  ) {
    score -= 2;
    pushReason(negatives, "LOW_DECISION_SPECIFICITY");
  }

  if (
    normalized.budgetTier === 3 &&
    luxurySelected &&
    normalized.primaryPreference === "brand_prestige" &&
    normalized.financePreference === "no" &&
    normalized.salaryBudgetAlignment !== "weak"
  ) {
    score += 3;
    pushReason(positives, "SELF_FUNDED_PREMIUM_SIGNAL");
  }

  return {
    score: clamp(score, 0, 20),
    positives,
    negatives
  };
}

function scoreEconomic(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 0;

  if (payload.answers.downPaymentBand === "10_20_percent") {
    score += 2;
    pushReason(positives, "DOWN_PAYMENT_COMMITMENT");
  } else if (payload.answers.downPaymentBand === "20_30_percent") {
    score += 4;
    pushReason(positives, "STRONG_DOWN_PAYMENT_COMMITMENT");
  } else if (payload.answers.downPaymentBand === "30_plus_percent") {
    score += 5;
    pushReason(positives, "VERY_STRONG_DOWN_PAYMENT_COMMITMENT");
  }

  if (payload.answers.tradeInAvailable) {
    score += 2;
    pushReason(positives, "TRADE_IN_READY");
  }

  if (payload.answers.financePreference === "yes") {
    score += 2;
    pushReason(positives, "FINANCE_INTENT_DECLARED");
  } else if (payload.answers.financePreference === "undecided") {
    score += 1;
  }

  if (normalized.salaryBudgetAlignment === "strong") {
    score += 2;
    pushReason(positives, "ECONOMIC_ALIGNMENT");
  } else if (normalized.salaryBudgetAlignment === "weak") {
    score -= 2;
    pushReason(negatives, "ECONOMIC_STRETCH_SIGNAL");
  }

  return {
    score: clamp(score, 0, 10),
    positives,
    negatives
  };
}

export function scoreAutoLead(payload: ScorePayload): ScoredLead {
  const normalized = normalizeAutoAnswers(payload);
  const behavioural = scoreBehavioural(payload);
  const interaction = scoreInteraction(payload, normalized);
  const consistency = scoreConsistency(payload, normalized);
  const economic = scoreEconomic(payload, normalized);

  const breakdown: ScoreBreakdown = {
    behaviouralScore: behavioural.score,
    interactionScore: interaction.score,
    consistencyScore: consistency.score,
    economicScore: economic.score
  };

  const totalScore = clamp(
    breakdown.behaviouralScore +
      breakdown.interactionScore +
      breakdown.consistencyScore +
      breakdown.economicScore,
    0,
    100
  );
  const intentBand = getIntentBand(totalScore);

  return {
    totalScore,
    category: intentBand.slug,
    categoryLabel: intentBand.label,
    recommendedAction: intentBand.recommendedAction,
    breakdown,
    positives: [
      ...new Set([
        ...behavioural.positives,
        ...interaction.positives,
        ...consistency.positives,
        ...economic.positives
      ])
    ],
    negatives: [
      ...new Set([
        ...behavioural.negatives,
        ...interaction.negatives,
        ...consistency.negatives,
        ...economic.negatives
      ])
    ],
    normalizedAnswers: normalized as unknown as Record<string, unknown>
  };
}
