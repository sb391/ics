import type { ScorePayload } from "../../scoring.types";

export interface NormalizedAutoAnswers {
  budgetRange: ScorePayload["answers"]["budgetRange"] | null;
  budgetTier: number | null;
  budgetMidpointLakh: number | null;
  primaryPreference: ScorePayload["answers"]["primaryPreference"] | null;
  purchaseTimeline: ScorePayload["answers"]["purchaseTimeline"] | null;
  timelineUrgency: number;
  financePreference: ScorePayload["answers"]["financePreference"] | null;
  brandCount: number;
  brandsComparing: string[];
  brandSegments: string[];
  downPaymentBand: ScorePayload["answers"]["downPaymentBand"] | null;
  salaryBand: ScorePayload["answers"]["salaryBand"] | null;
  salaryTier: number | null;
  salaryMidpointLakh: number | null;
  tradeInAvailable: boolean | null;
  answeredQuestionCount: number;
  financialAnswerCount: number;
  contactFieldCount: number;
  salaryBudgetAlignment: "strong" | "moderate" | "weak" | "unknown";
}
