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
  "performance",
  "brand_prestige",
  "after_sales"
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

export const AUTO_SAMPLE_PAYLOAD = {
  industry: "auto",
  lead: {
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+919900001234",
    city: "Bengaluru"
  },
  answers: {
    budgetRange: "12_20_lakh",
    primaryPreference: "mileage",
    purchaseTimeline: "30_days",
    financePreference: "yes",
    brandsComparing: ["hyundai", "kia"],
    downPaymentBand: "20_30_percent",
    tradeInAvailable: true,
    salaryBand: "10_20_lakh"
  },
  behaviouralMetrics: {
    totalCompletionSeconds: 185,
    timePerStepSeconds: {
      budgetRange: 12,
      primaryPreference: 8,
      purchaseTimeline: 16,
      financePreference: 9,
      brandsComparing: 24,
      downPaymentBand: 11,
      tradeInAvailable: 6,
      salaryBand: 10
    },
    backtracks: 2,
    answerEdits: 3,
    idlePauses: 1,
    tabSwitches: 1,
    scrollDepthPercent: 92,
    completionRatePercent: 100
  },
  metadata: {
    source: "dealer_website",
    campaign: "march_auto_campaign",
    formId: "lead_form_1",
    sessionId: "sess_123"
  }
};

export const AUTO_MODEL_CONFIG = {
  slug: "auto",
  displayName: "Auto Intent Confidence Score",
  version: "2026.03.15",
  supportedQuestions: {
    leadFields: ["name", "email", "phone", "city"],
    answers: {
      budgetRange: autoBudgetRanges,
      primaryPreference: autoPrimaryPreferences,
      purchaseTimeline: autoPurchaseTimelines,
      financePreference: autoFinancePreferences,
      brandsComparing: autoBrands,
      downPaymentBand: autoDownPaymentBands,
      tradeInAvailable: ["true", "false"],
      salaryBand: autoSalaryBands
    }
  },
  scoreBands: INTENT_SCORE_BANDS,
  metadata: {
    vertical: "auto",
    description:
      "Scores lead intent for auto buyers using behavioural, interaction, consistency, and economic signals.",
    webhookEventType: "ics.submission.scored",
    samplePayload: AUTO_SAMPLE_PAYLOAD
  }
} as const;
