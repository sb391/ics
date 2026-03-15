import { INTENT_SCORE_BANDS } from "../../scoring.types";

export const autoBudgetRanges = [
  "under_8_lakh",
  "8_12_lakh",
  "12_20_lakh",
  "20_plus_lakh"
] as const;

export const autoPrimaryPreferences = [
  "mileage",
  "safety",
  "features",
  "comfort",
  "performance",
  "resale",
  "brand_prestige",
  "after_sales",
  "maintenance",
  "ev_ecosystem"
] as const;

export const autoPurchaseTimelines = [
  "immediate",
  "30_days",
  "90_days",
  "exploring"
] as const;

export const autoFinancePreferences = ["yes", "no", "undecided"] as const;

export const autoBrands = [
  "hyundai",
  "kia",
  "tata",
  "mahindra",
  "maruti_suzuki",
  "toyota",
  "honda",
  "skoda",
  "volkswagen",
  "mg",
  "bmw",
  "mercedes_benz",
  "audi"
] as const;

export const autoDownPaymentBands = [
  "below_10_percent",
  "10_20_percent",
  "20_30_percent",
  "30_plus_percent"
] as const;

export const autoSalaryBands = [
  "under_5_lakh",
  "5_10_lakh",
  "10_20_lakh",
  "20_35_lakh",
  "35_plus_lakh"
] as const;

export const autoBodyStyles = [
  "hatchback",
  "sedan",
  "suv",
  "mpv",
  "luxury_suv"
] as const;

export const autoFuelTypes = [
  "petrol",
  "diesel",
  "hybrid",
  "ev",
  "cng",
  "open"
] as const;

export const autoUsagePatterns = [
  "city_commute",
  "family_use",
  "highway_travel",
  "business_use",
  "rideshare",
  "enthusiast"
] as const;

export const autoMonthlyKmBands = [
  "under_500",
  "500_1000",
  "1000_2000",
  "2000_plus"
] as const;

export const autoPurchaseReasons = [
  "first_car",
  "upgrade",
  "replacement",
  "additional_car",
  "fleet_expansion",
  "business_use_shift",
  "ev_shift",
  "other"
] as const;

export const autoShowroomVisitStatuses = [
  "not_visited",
  "visited_once",
  "visited_multiple"
] as const;

export const autoBudgetFlexibilities = [
  "fixed",
  "slightly_flexible",
  "very_flexible"
] as const;

export const autoCurrentVehicleAgeBands = [
  "none",
  "0_3_years",
  "4_7_years",
  "8_plus_years"
] as const;

export const autoDecisionMakers = [
  "self",
  "self_and_spouse",
  "family",
  "company"
] as const;

export const autoVariantClarityLevels = [
  "open",
  "trim_shortlist",
  "exact_variant"
] as const;

export const autoTestDriveReadinessLevels = [
  "not_interested",
  "open",
  "scheduled_soon"
] as const;

export const autoMonthlyEmiComfortBands = [
  "under_10k",
  "10k_20k",
  "20k_35k",
  "35k_plus",
  "not_sure"
] as const;

export const AUTO_SCORE_LIMITS = {
  behaviouralScore: 10,
  interactionScore: 15,
  demandScore: 25,
  consistencyScore: 25,
  readinessScore: 25
} as const;

export const AUTO_SCORE_LAYER_GUIDANCE = {
  behaviouralScore: {
    title: "Behavioural Quality",
    diagnosticPurpose:
      "Scores how the declaration was completed: pace, focus, friction, telemetry quality, and whether completion looks deliberate or careless."
  },
  interactionScore: {
    title: "Interaction Depth",
    diagnosticPurpose:
      "Scores how much interpretable context the buyer supplied, including core demand questions, shortlist depth, and supporting detail."
  },
  demandScore: {
    title: "Demand Clarity",
    diagnosticPurpose:
      "Scores how specific the buyer's product demand is: urgency, shortlist maturity, variant clarity, and willingness to take the next step."
  },
  consistencyScore: {
    title: "Consistency",
    diagnosticPurpose:
      "Scores whether the answers make sense together, such as budget versus brands, usage versus body style, and preference versus shortlist."
  },
  readinessScore: {
    title: "Purchase Readiness",
    diagnosticPurpose:
      "Scores whether the buyer has an actionable path to transact, including funding readiness, decision authority, replacement pressure, and field action readiness."
  }
} as const;

export const AUTO_SCORE_VERSION = "ics-auto-score-2026.03.15";
export const AUTO_WEIGHT_VERSION = "ics-auto-weights-2026.03.15";
export const AUTO_RULESET_VERSION = "ics-auto-rules-2026.03.15";
export const AUTO_PREDICTION_NOTE =
  "ICS is an explainable prediction being validated against downstream outcomes. It should inform decisions, not replace them.";

export const AUTO_SIGNAL_CATEGORIES = [
  "urgency",
  "clarity",
  "commitment",
  "affordability",
  "consistency",
  "purchase_readiness"
] as const;

export const AUTO_STEP_KEYS = [
  "budgetRange",
  "primaryPreference",
  "purchaseTimeline",
  "financePreference",
  "brandsComparing",
  "downPaymentBand",
  "tradeInAvailable",
  "salaryBand",
  "bodyStyle",
  "fuelType",
  "usagePattern",
  "monthlyKmBand",
  "purchaseReason",
  "currentVehicleAgeBand",
  "decisionMaker",
  "variantClarity",
  "testDriveReadiness",
  "monthlyEmiComfortBand"
] as const;

export const AUTO_SAMPLE_PAYLOAD = {
  industry: "auto",
  answers: {
    budgetRange: "12_20_lakh",
    primaryPreference: "mileage",
    purchaseTimeline: "30_days",
    financePreference: "yes",
    brandsComparing: ["hyundai", "kia"],
    downPaymentBand: "20_30_percent",
    tradeInAvailable: true,
    salaryBand: "10_20_lakh",
    bodyStyle: "suv",
    fuelType: "hybrid",
    usagePattern: "family_use",
    monthlyKmBand: "1000_2000",
    purchaseReason: "upgrade",
    currentVehicleAgeBand: "4_7_years",
    decisionMaker: "self_and_spouse",
    variantClarity: "trim_shortlist",
    testDriveReadiness: "scheduled_soon",
    monthlyEmiComfortBand: "20k_35k"
  },
  behaviouralMetrics: {
    totalCompletionSeconds: 228,
    timePerStepSeconds: {
      budgetRange: 14,
      primaryPreference: 10,
      purchaseTimeline: 12,
      financePreference: 10,
      brandsComparing: 24,
      downPaymentBand: 10,
      tradeInAvailable: 5,
      salaryBand: 10,
      bodyStyle: 9,
      fuelType: 10,
      usagePattern: 13,
      monthlyKmBand: 8,
      purchaseReason: 12,
      currentVehicleAgeBand: 8,
      decisionMaker: 10,
      variantClarity: 12,
      testDriveReadiness: 11,
      monthlyEmiComfortBand: 10
    },
    backtracks: 2,
    answerEdits: 3,
    idlePauses: 1,
    tabSwitches: 1,
    scrollDepthPercent: 94,
    completionRatePercent: 100
  },
  metadata: {
    source: "dealer_website",
    campaign: "march_auto_campaign",
    formId: "lead_form_1",
    sessionId: "sess_123",
    channel: "web",
    sdkVersion: "lab-0.2"
  }
};

export const AUTO_MODEL_CONFIG = {
  slug: "auto",
  displayName: "Auto Intent Confidence Score",
  version: AUTO_SCORE_VERSION,
  supportedQuestions: {
    answers: {
      budgetRange: autoBudgetRanges,
      primaryPreference: autoPrimaryPreferences,
      purchaseTimeline: autoPurchaseTimelines,
      financePreference: autoFinancePreferences,
      brandsComparing: autoBrands,
      downPaymentBand: autoDownPaymentBands,
      tradeInAvailable: ["true", "false"],
      salaryBand: autoSalaryBands,
      bodyStyle: autoBodyStyles,
      fuelType: autoFuelTypes,
      usagePattern: autoUsagePatterns,
      monthlyKmBand: autoMonthlyKmBands,
      purchaseReason: autoPurchaseReasons,
      currentVehicleAgeBand: autoCurrentVehicleAgeBands,
      decisionMaker: autoDecisionMakers,
      variantClarity: autoVariantClarityLevels,
      testDriveReadiness: autoTestDriveReadinessLevels,
      monthlyEmiComfortBand: autoMonthlyEmiComfortBands
    }
  },
  scoreBands: INTENT_SCORE_BANDS,
  metadata: {
    vertical: "auto",
    description:
      "Anonymous auto-intent prediction for buyers using behavioural quality, demand clarity, feasibility, and transaction readiness. ICS is validated against real downstream outcomes over time.",
    scoreWeights: AUTO_SCORE_LIMITS,
    scoreVersion: AUTO_SCORE_VERSION,
    weightVersion: AUTO_WEIGHT_VERSION,
    ruleSetVersion: AUTO_RULESET_VERSION,
    predictionContext: {
      posture: "prediction_under_validation",
      note: AUTO_PREDICTION_NOTE
    },
    signalCategories: AUTO_SIGNAL_CATEGORIES,
    scoreLayerGuidance: AUTO_SCORE_LAYER_GUIDANCE,
    questionArchitecture: {
      budgetRange: {
        signalCategories: ["affordability", "consistency"],
        diagnosticPurpose: "Anchors the economic lane and constrains which brand and variant choices are plausible."
      },
      primaryPreference: {
        signalCategories: ["clarity", "consistency"],
        diagnosticPurpose: "Shows what job the vehicle must do well and tests whether shortlist choices match that motivation."
      },
      purchaseTimeline: {
        signalCategories: ["urgency", "purchase_readiness"],
        diagnosticPurpose: "Separates active buying windows from passive research behaviour."
      },
      financePreference: {
        signalCategories: ["affordability", "commitment", "purchase_readiness"],
        diagnosticPurpose: "Signals whether the buyer has started choosing a payment path instead of only browsing."
      },
      brandsComparing: {
        signalCategories: ["clarity", "commitment", "consistency"],
        diagnosticPurpose: "A narrow shortlist suggests deeper consideration than loose multi-brand curiosity."
      },
      downPaymentBand: {
        signalCategories: ["affordability", "commitment", "purchase_readiness"],
        diagnosticPurpose: "Indicates ability and willingness to move beyond abstract intent into a funded plan."
      },
      tradeInAvailable: {
        signalCategories: ["commitment", "purchase_readiness"],
        diagnosticPurpose: "Trade-in readiness often marks a more operationally real purchase journey."
      },
      salaryBand: {
        signalCategories: ["affordability", "consistency"],
        diagnosticPurpose: "Supports feasibility checks between budget, finance path, and likely ownership cost."
      },
      bodyStyle: {
        signalCategories: ["clarity", "consistency"],
        diagnosticPurpose: "Captures concrete product demand instead of generic market interest."
      },
      fuelType: {
        signalCategories: ["clarity", "affordability", "consistency"],
        diagnosticPurpose: "Shows whether the buyer is translating usage patterns into a specific ownership tradeoff."
      },
      usagePattern: {
        signalCategories: ["clarity", "consistency"],
        diagnosticPurpose: "Explains why the buyer is in-market and what a coherent vehicle choice should look like."
      },
      monthlyKmBand: {
        signalCategories: ["clarity", "affordability", "consistency"],
        diagnosticPurpose: "Adds intensity of usage, which sharpens fuel, body style, and cost-fit checks."
      },
      purchaseReason: {
        signalCategories: ["urgency", "clarity", "commitment"],
        diagnosticPurpose: "First-car, upgrade, replacement, and fleet intent each imply different urgency and seriousness."
      },
      currentVehicleAgeBand: {
        signalCategories: ["urgency", "consistency", "purchase_readiness"],
        diagnosticPurpose: "Helps distinguish abstract browsing from a genuine replacement cycle."
      },
      decisionMaker: {
        signalCategories: ["commitment", "purchase_readiness"],
        diagnosticPurpose: "Shows whether the person filling the form can directly advance the buying process."
      },
      variantClarity: {
        signalCategories: ["clarity", "commitment", "purchase_readiness"],
        diagnosticPurpose: "Knowing trim or exact variant is a strong sign that demand has become specific."
      },
      testDriveReadiness: {
        signalCategories: ["urgency", "commitment", "purchase_readiness"],
        diagnosticPurpose: "One of the strongest behavioural bridges from interest to sales action."
      },
      monthlyEmiComfortBand: {
        signalCategories: ["affordability", "consistency", "purchase_readiness"],
        diagnosticPurpose: "Improves affordability reasoning by capturing payment comfort instead of income alone."
      }
    },
    questionAnalysis: {
      budgetRange: "Sets the economic lane of the buyer and constrains which brands or variants are plausible.",
      purchaseTimeline: "Separates active buyers from passive researchers.",
      brandsComparing: "A focused shortlist is stronger than vague brand curiosity.",
      bodyStyle: "Captures concrete product demand instead of general shopping interest.",
      fuelType: "Signals whether the buyer has begun translating needs into ownership decisions.",
      usagePattern: "Explains why the buyer is in-market and what product fit should look like.",
      purchaseReason: "First car, upgrade, replacement, and fleet intent have different urgency profiles.",
      currentVehicleAgeBand:
        "Helps distinguish curiosity from a real replacement cycle or upgrade trigger.",
      variantClarity: "A buyer who knows trim depth is further along than one who only knows a brand.",
      testDriveReadiness: "One of the cleanest downstream demand indicators for dealer workflows.",
      monthlyEmiComfortBand:
        "Lets the model reason about finance feasibility more realistically than salary alone."
    },
    behaviouralAnalysis: {
      totalCompletionSeconds:
        "Useful only alongside step-level timing and friction signals; fast completion alone is weak evidence.",
      timePerStepSeconds:
        "High-quality telemetry lets the model distinguish deliberate selection from shallow clicking.",
      answerEdits:
        "A few edits suggest reflection, while many edits suggest uncertainty or low confidence.",
      backtracks:
        "Moderate backtracking can be healthy; heavy backtracking often reflects unstable demand.",
      idlePauses:
        "Pauses are interpreted differently depending on focus, timing coverage, and form depth.",
      tabSwitches:
        "Frequent switching often means loose comparison behavior rather than committed buying."
    },
    validationAnalytics: {
      positiveValidationOutcomes: ["visit_booked", "finance_applied", "converted"],
      negativeValidationOutcomes: ["rejected", "junk"],
      highIntentBands: ["serious_buyer", "high_intent_buyer"],
      lowIntentBands: ["casual_browser", "early_interest"]
    },
    webhookEventType: "ics.submission.scored",
    samplePayload: AUTO_SAMPLE_PAYLOAD
  }
} as const;
