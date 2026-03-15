import {
  type RuleContribution,
  type ScoreBreakdown,
  type ScoredLead,
  type ScoreLayer,
  type ScorePayload,
  type SignalCategory,
  getIntentBand
} from "../../scoring.types";

import {
  AUTO_PREDICTION_NOTE,
  AUTO_RULESET_VERSION,
  AUTO_SCORE_LIMITS,
  AUTO_SCORE_VERSION,
  AUTO_WEIGHT_VERSION
} from "./auto.constants";
import { normalizeAutoAnswers } from "./auto.normalizers";

interface ScoreBucket {
  layer: ScoreLayer;
  score: number;
  positives: string[];
  negatives: string[];
  contributions: RuleContribution[];
}

interface RuleInput {
  code: string;
  points: number;
  reason: string;
  signalCategories: SignalCategory[];
}

function createScoreBucket(layer: ScoreLayer): ScoreBucket {
  return {
    layer,
    score: 0,
    positives: [],
    negatives: [],
    contributions: []
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pushReason(list: string[], code: string) {
  if (!list.includes(code)) {
    list.push(code);
  }
}

function fireRule(bucket: ScoreBucket, input: RuleInput) {
  if (input.points === 0) {
    return;
  }

  bucket.score += input.points;
  bucket.contributions.push({
    ruleCode: input.code,
    layer: bucket.layer,
    signalCategories: input.signalCategories,
    points: input.points,
    direction: input.points > 0 ? "positive" : "negative",
    reason: input.reason
  });

  if (input.points > 0) {
    pushReason(bucket.positives, input.code);
    return;
  }

  pushReason(bucket.negatives, input.code);
}

function addPoints(
  bucket: ScoreBucket,
  code: string,
  points: number,
  reason: string,
  signalCategories: SignalCategory[]
) {
  fireRule(bucket, {
    code,
    points,
    reason,
    signalCategories
  });
}

function deductPoints(
  bucket: ScoreBucket,
  code: string,
  points: number,
  reason: string,
  signalCategories: SignalCategory[]
) {
  fireRule(bucket, {
    code,
    points: points * -1,
    reason,
    signalCategories
  });
}

function finalizeBucket(bucket: ScoreBucket, limit: number) {
  return {
    score: clamp(bucket.score, 0, limit),
    positives: bucket.positives,
    negatives: bucket.negatives,
    contributions: bucket.contributions
  };
}

function scoreBehavioural(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const bucket = createScoreBucket("behavioural");
  const metrics = payload.behaviouralMetrics;
  const completionRatePercent = normalized.effectiveCompletionRatePercent;

  if (normalized.completionRateSource === "declared") {
    if (completionRatePercent >= 100) {
      addPoints(
        bucket,
        "FULL_COMPLETION_RATE",
        2,
        "The submission reached full completion, which improves behavioural confidence when other telemetry is coherent.",
        ["commitment", "purchase_readiness"]
      );
    } else if (completionRatePercent >= 90) {
      addPoints(
        bucket,
        "HIGH_COMPLETION_RATE",
        1,
        "Near-complete form coverage suggests the buyer engaged with most diagnostic questions.",
        ["commitment"]
      );
    } else if (completionRatePercent < 70) {
      deductPoints(
        bucket,
        "LOW_COMPLETION_RATE",
        2,
        "Low completion weakens confidence because the demand profile remained partially formed.",
        ["commitment", "clarity"]
      );
    }
  } else {
    if (completionRatePercent >= 100) {
      addPoints(
        bucket,
        "FULL_DECLARATION_COMPLETION",
        2,
        "The buyer completed the full declaration set, so missing frontend telemetry is not treated as incomplete engagement.",
        ["commitment", "purchase_readiness"]
      );
    } else if (completionRatePercent >= 75) {
      addPoints(
        bucket,
        "STRONG_DECLARATION_COVERAGE",
        1,
        "Most declaration questions were answered, so the session looks sufficiently complete for intent reading.",
        ["commitment", "clarity"]
      );
    } else if (completionRatePercent < 50) {
      deductPoints(
        bucket,
        "LOW_DECLARATION_COVERAGE",
        2,
        "Too few declaration questions were answered to trust the behavioural completeness of the session.",
        ["commitment", "clarity"]
      );
    }
  }

  if (normalized.engagementPace === "measured") {
    addPoints(
      bucket,
      "MEASURED_RESPONSE_RHYTHM",
      3,
      "Measured completion speed is more consistent with deliberate choice-making than rapid clicking.",
      ["clarity", "commitment"]
    );
  } else if (normalized.engagementPace === "rushed") {
    deductPoints(
      bucket,
      "RUSHED_COMPLETION_PATTERN",
      2,
      "Very fast completion introduces some skepticism that the buyer fully processed the declaration, though it is not treated as definitive low intent on its own.",
      ["clarity", "consistency"]
    );
  } else if (normalized.engagementPace === "slow") {
    deductPoints(
      bucket,
      "SLOW_COMPLETION_WINDOW",
      1,
      "Unusually slow completion can reflect distraction or uncertainty rather than focused buying intent.",
      ["commitment"]
    );
  }

  if (
    normalized.stepTimingCoverageCount >= Math.min(normalized.answeredQuestionCount, 8) &&
    normalized.averageStepSeconds !== null &&
    normalized.averageStepSeconds >= 6 &&
    normalized.averageStepSeconds <= 24
  ) {
    addPoints(
      bucket,
      "STEP_TELEMETRY_ALIGNMENT",
      2,
      "Step-level timing is both rich and plausible, which improves trust in the observed behavioural pattern.",
      ["consistency", "clarity"]
    );
  } else if (normalized.answeredQuestionCount >= 8 && normalized.stepTimingCoverageCount <= 3) {
    deductPoints(
      bucket,
      "LIMITED_BEHAVIOURAL_TELEMETRY",
      1,
      "Limited step-by-step telemetry means we have less behavioural evidence to validate how the declaration was completed. This is a light confidence reduction, not a fraud signal.",
      ["consistency"]
    );
  }

  if ((metrics.answerEdits ?? 0) >= 1 && (metrics.answerEdits ?? 0) <= 4) {
    addPoints(
      bucket,
      "HEALTHY_ANSWER_REFINEMENT",
      1,
      "A few answer edits suggest reflective refinement rather than random clicking.",
      ["clarity"]
    );
  } else if ((metrics.answerEdits ?? 0) >= 10) {
    deductPoints(
      bucket,
      "EXCESSIVE_ANSWER_VOLATILITY",
      1,
      "Heavy answer editing often indicates unstable intent or low confidence in the purchase path.",
      ["clarity", "consistency"]
    );
  }

  if ((metrics.backtracks ?? 0) >= 1 && (metrics.backtracks ?? 0) <= 3) {
    addPoints(
      bucket,
      "MEASURED_REVIEW_BEHAVIOUR",
      1,
      "Moderate review behaviour can be healthy when a buyer is comparing options carefully.",
      ["clarity"]
    );
  } else if ((metrics.backtracks ?? 0) >= 8) {
    deductPoints(
      bucket,
      "HEAVY_BACKTRACKING",
      1,
      "Heavy backtracking can indicate uncertainty rather than a stable near-term purchase path.",
      ["clarity", "commitment"]
    );
  }

  if (normalized.sessionFocus === "strong") {
    addPoints(
      bucket,
      "FOCUSED_SESSION",
      1,
      "Low distraction signals suggest the session stayed focused on the purchase flow.",
      ["commitment"]
    );
  } else if (normalized.sessionFocus === "weak") {
    deductPoints(
      bucket,
      "FRAGMENTED_ATTENTION",
      1,
      "Frequent pauses or tab switches make the behavioural signal less trustworthy.",
      ["commitment"]
    );
  }

  if (normalized.frictionLevel === "high") {
    deductPoints(
      bucket,
      "HIGH_FORM_FRICTION",
      1,
      "High interaction friction often accompanies unstable or low-confidence intent.",
      ["consistency", "commitment"]
    );
  }

  if ((metrics.scrollDepthPercent ?? 0) >= 85) {
    addPoints(
      bucket,
      "HIGH_SCROLL_DEPTH",
      1,
      "Deep scroll engagement suggests the buyer explored the flow rather than bouncing early.",
      ["commitment"]
    );
  }

  return finalizeBucket(bucket, AUTO_SCORE_LIMITS.behaviouralScore);
}

function scoreInteraction(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const bucket = createScoreBucket("interaction");

  if (normalized.answeredCoreQuestionCount >= 8) {
    addPoints(
      bucket,
      "RICH_CORE_DECISION_CONTEXT",
      7,
      "The submission answered most core diagnostic questions, making the profile substantially more interpretable.",
      ["clarity", "consistency"]
    );
  } else if (normalized.answeredCoreQuestionCount >= 6) {
    addPoints(
      bucket,
      "SOLID_CORE_DECISION_CONTEXT",
      5,
      "The submission covers enough core questions to support a useful prediction.",
      ["clarity"]
    );
  } else if (normalized.answeredCoreQuestionCount >= 4) {
    addPoints(
      bucket,
      "BASELINE_CORE_CONTEXT",
      3,
      "Partial core context is present but still leaves meaningful ambiguity in the demand profile.",
      ["clarity"]
    );
  } else {
    deductPoints(
      bucket,
      "THIN_CORE_CONTEXT",
      2,
      "Too few core questions were answered to support a confident decision-context read.",
      ["clarity", "consistency"]
    );
  }

  if (normalized.answeredOptionalQuestionCount >= 6) {
    addPoints(
      bucket,
      "SUPPLEMENTAL_CONTEXT_COMPLETE",
      4,
      "Supporting questions add useful specificity around affordability and readiness.",
      ["clarity", "affordability"]
    );
  } else if (normalized.answeredOptionalQuestionCount >= 4) {
    addPoints(
      bucket,
      "SUPPORTING_CONTEXT_PRESENT",
      3,
      "A moderate amount of supporting context was provided, improving model confidence.",
      ["clarity"]
    );
  } else if (normalized.answeredOptionalQuestionCount <= 2) {
    deductPoints(
      bucket,
      "LIMITED_SUPPORTING_CONTEXT",
      1,
      "Thin supporting context limits the system's ability to validate feasibility and seriousness.",
      ["clarity", "consistency"]
    );
  }

  if (normalized.brandCount >= 2 && normalized.brandCount <= 3) {
    addPoints(
      bucket,
      "FOCUSED_BRAND_SHORTLIST",
      2,
      "A focused shortlist usually signals more mature comparison than broad brand browsing.",
      ["clarity", "commitment"]
    );
  } else if (normalized.brandCount > 3) {
    deductPoints(
      bucket,
      "OVERLY_BROAD_SHORTLIST",
      1,
      "A very broad shortlist often reflects research breadth rather than purchase narrowing.",
      ["clarity"]
    );
  }

  if (normalized.demandSignalCount >= 7) {
    addPoints(
      bucket,
      "DENSE_DEMAND_SIGNAL_SET",
      1,
      "The form carries a dense set of demand signals rather than only surface-level attributes.",
      ["clarity", "purchase_readiness"]
    );
  }

  if (
    normalized.stepTimingCoverageCount >= Math.min(normalized.answeredQuestionCount, 10) &&
    normalized.engagementPace !== "rushed"
  ) {
    addPoints(
      bucket,
      "RICH_BEHAVIOURAL_TELEMETRY",
      1,
      "The submission includes enough telemetry to evaluate not just what was answered, but how it was answered.",
      ["consistency"]
    );
  }

  if (payload.metadata.formId) {
    addPoints(
      bucket,
      "FORM_CONTEXT_PRESENT",
      1,
      "Form-level metadata improves traceability for later validation and CRM reconciliation.",
      ["consistency"]
    );
  }

  if (normalized.engagementPace === "rushed") {
    deductPoints(
      bucket,
      "SHALLOW_ENGAGEMENT_PATTERN",
      2,
      "Rushed behaviour reduces confidence that the interaction depth reflects genuine evaluation, but the penalty stays moderate unless other weak signals appear too.",
      ["commitment", "clarity"]
    );
  }

  if (normalized.sessionFocus === "weak") {
    deductPoints(
      bucket,
      "LOW_INTERACTION_CONFIDENCE",
      2,
      "Low session focus makes the observed interaction depth less reliable.",
      ["commitment", "consistency"]
    );
  }

  if (normalized.frictionLevel === "high") {
    deductPoints(
      bucket,
      "UNSTABLE_COMPLETION_CONTEXT",
      2,
      "A high-friction completion pattern makes the interaction look less stable and less deliberate.",
      ["consistency"]
    );
  }

  if (
    normalized.engagementPace === "rushed" &&
    normalized.effectiveCompletionRatePercent >= 100 &&
    normalized.averageStepSeconds !== null &&
    normalized.averageStepSeconds < 3
  ) {
    deductPoints(
      bucket,
      "FAST_FULL_COMPLETION_SKEPTICISM",
      1,
      "A perfectly completed form finished exceptionally quickly is treated with extra scepticism.",
      ["consistency", "commitment"]
    );
  }

  return finalizeBucket(bucket, AUTO_SCORE_LIMITS.interactionScore);
}

function scoreDemand(_payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const bucket = createScoreBucket("demand");

  if (normalized.demandClarity === "high") {
    addPoints(
      bucket,
      "DEMAND_PROFILE_HIGH_CLARITY",
      8,
      "The demand profile is specific across multiple dimensions, which is a strong signal of real buying intent.",
      ["clarity"]
    );
  } else if (normalized.demandClarity === "medium") {
    addPoints(
      bucket,
      "DEMAND_PROFILE_MODERATE_CLARITY",
      4,
      "The buyer has moved beyond vague curiosity but still lacks full purchase specificity.",
      ["clarity"]
    );
  } else {
    deductPoints(
      bucket,
      "DEMAND_PROFILE_LOW_CLARITY",
      3,
      "Low demand clarity suggests the buyer has not yet formed a stable product preference.",
      ["clarity"]
    );
  }

  if (normalized.brandCount >= 2 && normalized.brandCount <= 3) {
    addPoints(
      bucket,
      "MULTI_OPTION_EVALUATION",
      3,
      "Comparing a small number of options usually indicates a real evaluation stage.",
      ["clarity", "commitment"]
    );
  } else if (normalized.brandCount === 1 && normalized.variantClarity === "exact_variant") {
    addPoints(
      bucket,
      "PRECISE_SINGLE_PATH",
      2,
      "A single-brand path with exact variant clarity can still reflect highly specific demand.",
      ["clarity", "purchase_readiness"]
    );
  }

  if (normalized.variantClarity === "exact_variant") {
    addPoints(
      bucket,
      "VARIANT_LEVEL_CLARITY",
      4,
      "Knowing the exact variant strongly signals a specific, advanced demand state.",
      ["clarity", "purchase_readiness"]
    );
  } else if (normalized.variantClarity === "trim_shortlist") {
    addPoints(
      bucket,
      "TRIM_LEVEL_CLARITY",
      2,
      "Trim-level clarity suggests the buyer has progressed beyond generic brand research.",
      ["clarity"]
    );
  }

  if (normalized.testDriveReadiness === "scheduled_soon") {
    addPoints(
      bucket,
      "TEST_DRIVE_MOMENTUM",
      5,
      "A near-term test drive is one of the strongest demand-to-action bridges in dealer funnels.",
      ["urgency", "commitment", "purchase_readiness"]
    );
  } else if (normalized.testDriveReadiness === "open") {
    addPoints(
      bucket,
      "TEST_DRIVE_OPENNESS",
      2,
      "Openness to a test drive is a positive sign, though still weaker than an imminent booking.",
      ["commitment", "purchase_readiness"]
    );
  }

  if (normalized.purchaseReason === "replacement" || normalized.purchaseReason === "upgrade") {
    addPoints(
      bucket,
      "REPLACEMENT_OR_UPGRADE_DEMAND",
      2,
      "Upgrade and replacement journeys often come with clearer demand and shorter paths to action.",
      ["urgency", "commitment"]
    );
  } else if (normalized.purchaseReason === "additional_car") {
    addPoints(
      bucket,
      "ADDITIONAL_CAR_DEMAND",
      1,
      "An additional-car journey still suggests intent, but urgency is often lower than replacement.",
      ["commitment"]
    );
  }

  if (normalized.demandStage === "transaction_ready") {
    addPoints(
      bucket,
      "TRANSACTION_READY_SIGNAL",
      3,
      "The combination of urgency, specificity, and action readiness suggests a near-transaction state.",
      ["urgency", "purchase_readiness"]
    );
  } else if (normalized.demandStage === "active_eval") {
    addPoints(
      bucket,
      "ACTIVE_EVAL_SIGNAL",
      1,
      "The buyer appears to be actively evaluating rather than merely exploring.",
      ["commitment", "clarity"]
    );
  }

  if (normalized.comparisonBreadth === "broad" && normalized.purchaseTimeline === "exploring") {
    deductPoints(
      bucket,
      "RESEARCH_HEAVY_PATTERN",
      2,
      "Broad comparison combined with an exploratory timeline looks more like research than imminent purchase intent.",
      ["clarity", "urgency"]
    );
  }

  return finalizeBucket(bucket, AUTO_SCORE_LIMITS.demandScore);
}

function scoreConsistency(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const bucket = createScoreBucket("consistency");
  const luxurySelected = normalized.brandSegments.includes("luxury");

  if (normalized.budgetBrandAlignment === "strong") {
    addPoints(
      bucket,
      "BUDGET_BRAND_ALIGNMENT",
      6,
      "The declared budget supports the shortlisted brands, which makes the intent more credible.",
      ["affordability", "consistency"]
    );
  } else if (normalized.budgetBrandAlignment === "stretch") {
    addPoints(
      bucket,
      "BUDGET_BRAND_STRETCH",
      2,
      "The shortlist is a stretch but still somewhat plausible, especially with financing.",
      ["affordability", "consistency"]
    );
  } else if (normalized.budgetBrandAlignment === "mismatch") {
    deductPoints(
      bucket,
      "BUDGET_BRAND_MISMATCH",
      7,
      "The shortlisted brands materially exceed the declared budget, which strongly weakens intent credibility.",
      ["affordability", "consistency"]
    );
  }

  if (normalized.salaryBudgetAlignment === "strong") {
    addPoints(
      bucket,
      "SALARY_BUDGET_ALIGNMENT",
      5,
      "Income and budget are directionally aligned, improving feasibility confidence.",
      ["affordability", "consistency"]
    );
  } else if (normalized.salaryBudgetAlignment === "moderate") {
    addPoints(
      bucket,
      "MODERATE_SALARY_BUDGET_ALIGNMENT",
      2,
      "Income and budget are not perfect, but they remain plausibly workable.",
      ["affordability"]
    );
  } else if (normalized.salaryBudgetAlignment === "weak") {
    deductPoints(
      bucket,
      "SALARY_BUDGET_MISMATCH",
      6,
      "Income and budget appear misaligned, reducing confidence that the purchase path is realistic.",
      ["affordability", "consistency"]
    );
  }

  if (normalized.budgetEmiAlignment === "strong") {
    addPoints(
      bucket,
      "EMI_BUDGET_ALIGNMENT",
      3,
      "The buyer's stated EMI comfort aligns with the selected price range.",
      ["affordability", "consistency"]
    );
  } else if (normalized.budgetEmiAlignment === "weak") {
    deductPoints(
      bucket,
      "EMI_BUDGET_MISMATCH",
      3,
      "The EMI comfort band does not support the stated purchase budget.",
      ["affordability", "consistency"]
    );
  }

  if (normalized.preferenceBrandAlignment === "strong") {
    addPoints(
      bucket,
      "PREFERENCE_BRAND_ALIGNMENT",
      3,
      "The chosen brands fit the buyer's stated vehicle priorities.",
      ["clarity", "consistency"]
    );
  } else if (normalized.preferenceBrandAlignment === "weak") {
    deductPoints(
      bucket,
      "PREFERENCE_BRAND_TENSION",
      3,
      "The shortlist conflicts with the buyer's stated purchase preference.",
      ["clarity", "consistency"]
    );
  }

  if (normalized.bodyStyleUsageAlignment === "strong") {
    addPoints(
      bucket,
      "BODY_STYLE_USAGE_ALIGNMENT",
      3,
      "The preferred body style matches the declared use case.",
      ["clarity", "consistency"]
    );
  } else if (normalized.bodyStyleUsageAlignment === "weak") {
    deductPoints(
      bucket,
      "BODY_STYLE_USAGE_CONFLICT",
      2,
      "The body style choice conflicts with the intended use pattern.",
      ["clarity", "consistency"]
    );
  }

  if (normalized.fuelUsageAlignment === "strong") {
    addPoints(
      bucket,
      "FUEL_USAGE_ALIGNMENT",
      3,
      "Fuel choice is coherent with usage intensity and pattern.",
      ["affordability", "consistency"]
    );
  } else if (normalized.fuelUsageAlignment === "weak") {
    deductPoints(
      bucket,
      "FUEL_USAGE_CONFLICT",
      2,
      "Fuel choice appears inconsistent with usage pattern or expected running intensity.",
      ["affordability", "consistency"]
    );
  }

  if (
    normalized.timelineUrgency >= 3 &&
    normalized.demandClarity === "high" &&
    normalized.fundingReadiness !== "weak"
  ) {
    addPoints(
      bucket,
      "URGENT_AND_COHERENT_BUY_PATH",
      2,
      "Urgency, specificity, and funding coherence all point in the same direction.",
      ["urgency", "consistency", "purchase_readiness"]
    );
  } else if (
    normalized.timelineUrgency >= 3 &&
    (normalized.demandClarity === "low" || normalized.fundingReadiness === "weak")
  ) {
    deductPoints(
      bucket,
      "URGENCY_WITHOUT_SUPPORTING_EVIDENCE",
      3,
      "Claimed urgency without supporting clarity or funding evidence is treated sceptically.",
      ["urgency", "consistency"]
    );
  }

  if (
    payload.answers.financePreference === "no" &&
    luxurySelected &&
    normalized.budgetBrandAlignment === "strong" &&
    normalized.salaryBudgetAlignment === "strong"
  ) {
    addPoints(
      bucket,
      "SELF_FUNDED_PREMIUM_SIGNAL",
      2,
      "A premium buyer declining finance can be credible when affordability is otherwise strong.",
      ["affordability", "purchase_readiness"]
    );
  }

  if (luxurySelected && normalized.budgetBrandAlignment === "mismatch") {
    deductPoints(
      bucket,
      "PREMIUM_WITHOUT_FUNDING_PATH",
      4,
      "Luxury demand without a credible economic path is treated as low-feasibility intent.",
      ["affordability", "consistency"]
    );
  }

  if (
    luxurySelected &&
    normalized.budgetBrandAlignment === "mismatch" &&
    normalized.preferenceBrandAlignment === "strong"
  ) {
    deductPoints(
      bucket,
      "ASPIRATION_OVER_FEASIBILITY",
      2,
      "The profile looks aspirational rather than purchasable: the taste is coherent, but the economics are not.",
      ["affordability", "consistency"]
    );
  }

  return finalizeBucket(bucket, AUTO_SCORE_LIMITS.consistencyScore);
}

function scoreReadiness(payload: ScorePayload, normalized: ReturnType<typeof normalizeAutoAnswers>) {
  const bucket = createScoreBucket("readiness");
  const luxurySelected = normalized.brandSegments.includes("luxury");

  if (normalized.fundingReadiness === "strong") {
    addPoints(
      bucket,
      "FUNDED_BUY_PATH",
      8,
      "The buyer has supplied a coherent and actionable funding path.",
      ["affordability", "commitment", "purchase_readiness"]
    );
  } else if (normalized.fundingReadiness === "moderate") {
    addPoints(
      bucket,
      "PARTIAL_FUNDING_PATH",
      4,
      "There is some evidence of a real funding path, though it is not yet fully formed.",
      ["affordability", "purchase_readiness"]
    );
  } else if (normalized.fundingReadiness === "weak") {
    deductPoints(
      bucket,
      "THIN_FUNDING_PATH",
      4,
      "The profile lacks a convincing path to actually fund the purchase.",
      ["affordability", "purchase_readiness"]
    );
  }

  if (payload.answers.downPaymentBand === "10_20_percent") {
    addPoints(
      bucket,
      "DOWN_PAYMENT_COMMITMENT",
      3,
      "A moderate down payment suggests the buyer is preparing financially for the transaction.",
      ["commitment", "affordability"]
    );
  } else if (payload.answers.downPaymentBand === "20_30_percent") {
    addPoints(
      bucket,
      "STRONG_DOWN_PAYMENT_COMMITMENT",
      5,
      "A strong down payment is a meaningful signal of transaction readiness.",
      ["commitment", "purchase_readiness"]
    );
  } else if (payload.answers.downPaymentBand === "30_plus_percent") {
    addPoints(
      bucket,
      "VERY_STRONG_DOWN_PAYMENT_COMMITMENT",
      6,
      "A very high down payment materially strengthens readiness and feasibility.",
      ["commitment", "affordability", "purchase_readiness"]
    );
  }

  if (payload.answers.tradeInAvailable) {
    addPoints(
      bucket,
      "TRADE_IN_READY",
      3,
      "A trade-in is a practical readiness signal that often accompanies an active purchase journey.",
      ["commitment", "purchase_readiness"]
    );
  }

  if (normalized.replacementPressure === "high") {
    addPoints(
      bucket,
      "HIGH_REPLACEMENT_PRESSURE",
      4,
      "Strong replacement pressure usually shortens the path from research to action.",
      ["urgency", "purchase_readiness"]
    );
  } else if (normalized.replacementPressure === "medium") {
    addPoints(
      bucket,
      "ACTIVE_REPLACEMENT_CYCLE",
      2,
      "A moderate replacement signal suggests the purchase is more real than abstract.",
      ["urgency", "commitment"]
    );
  }

  if (normalized.testDriveReadiness === "scheduled_soon") {
    addPoints(
      bucket,
      "FIELD_ACTION_READY",
      3,
      "Near-term willingness to meet or test the vehicle is a strong readiness bridge.",
      ["commitment", "purchase_readiness"]
    );
  } else if (normalized.testDriveReadiness === "open") {
    addPoints(
      bucket,
      "OPEN_TO_FIELD_ACTION",
      1,
      "Openness to a test drive slightly improves readiness, though without near-term commitment.",
      ["purchase_readiness"]
    );
  }

  if (normalized.decisionAuthority === "strong") {
    addPoints(
      bucket,
      "PRIMARY_DECISION_MAKER",
      2,
      "The form appears to be completed by a direct decision-maker.",
      ["commitment", "purchase_readiness"]
    );
  } else if (normalized.decisionAuthority === "shared") {
    addPoints(
      bucket,
      "SHARED_DECISION_PATH",
      1,
      "A shared decision path is still workable, though usually slower than direct authority.",
      ["commitment"]
    );
  }

  if (payload.answers.financePreference === "yes") {
    addPoints(
      bucket,
      "FINANCE_INTENT_DECLARED",
      2,
      "Declaring finance interest indicates the buyer has engaged with the transaction mechanics.",
      ["commitment", "purchase_readiness"]
    );
  } else if (
    payload.answers.financePreference === "no" &&
    normalized.salaryBudgetAlignment === "strong" &&
    normalized.budgetBrandAlignment !== "mismatch"
  ) {
    addPoints(
      bucket,
      "CASH_CAPABLE_PROFILE",
      2,
      "A non-finance path can still be credible when the economics support a self-funded purchase.",
      ["affordability", "purchase_readiness"]
    );
  }

  if (normalized.budgetBrandAlignment === "mismatch") {
    deductPoints(
      bucket,
      "WEAK_TRANSACTION_FEASIBILITY",
      5,
      "A weak budget-to-product fit lowers the chance that the current enquiry can realistically transact.",
      ["affordability", "purchase_readiness"]
    );
  }

  if (
    luxurySelected &&
    payload.answers.financePreference === "no" &&
    normalized.budgetBrandAlignment === "mismatch"
  ) {
    deductPoints(
      bucket,
      "PREMIUM_CASHFLOW_GAP",
      4,
      "A premium cash purchase claim without supporting economics is treated as low-feasibility readiness.",
      ["affordability", "consistency"]
    );
  }

  return finalizeBucket(bucket, AUTO_SCORE_LIMITS.readinessScore);
}

export function scoreAutoLead(payload: ScorePayload): ScoredLead {
  const normalized = normalizeAutoAnswers(payload);
  const behavioural = scoreBehavioural(payload, normalized);
  const interaction = scoreInteraction(payload, normalized);
  const demand = scoreDemand(payload, normalized);
  const consistency = scoreConsistency(payload, normalized);
  const readiness = scoreReadiness(payload, normalized);

  const breakdown: ScoreBreakdown = {
    behaviouralScore: behavioural.score,
    interactionScore: interaction.score,
    demandScore: demand.score,
    consistencyScore: consistency.score,
    readinessScore: readiness.score
  };

  const totalScore = clamp(
    breakdown.behaviouralScore +
      breakdown.interactionScore +
      breakdown.demandScore +
      breakdown.consistencyScore +
      breakdown.readinessScore,
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
        ...demand.positives,
        ...consistency.positives,
        ...readiness.positives
      ])
    ],
    negatives: [
      ...new Set([
        ...behavioural.negatives,
        ...interaction.negatives,
        ...demand.negatives,
        ...consistency.negatives,
        ...readiness.negatives
      ])
    ],
    normalizedAnswers: normalized as unknown as Record<string, unknown>,
    ruleContributions: [
      ...behavioural.contributions,
      ...interaction.contributions,
      ...demand.contributions,
      ...consistency.contributions,
      ...readiness.contributions
    ],
    scoreVersion: AUTO_SCORE_VERSION,
    weightVersion: AUTO_WEIGHT_VERSION,
    ruleSetVersion: AUTO_RULESET_VERSION,
    predictionContext: {
      posture: "prediction_under_validation",
      note: AUTO_PREDICTION_NOTE
    }
  };
}
