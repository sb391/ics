import type { z } from "zod";

import type { scorePayloadSchema } from "./scoring.schemas";

export const INTENT_SCORE_BANDS = [
  {
    slug: "casual_browser",
    prisma: "CASUAL_BROWSER",
    label: "Casual Browser",
    minScore: 0,
    maxScore: 30,
    recommendedAction: "Low priority nurture"
  },
  {
    slug: "early_interest",
    prisma: "EARLY_INTEREST",
    label: "Early Interest",
    minScore: 31,
    maxScore: 55,
    recommendedAction: "Light follow-up"
  },
  {
    slug: "consideration_stage",
    prisma: "CONSIDERATION_STAGE",
    label: "Consideration Stage",
    minScore: 56,
    maxScore: 75,
    recommendedAction: "Standard sales callback"
  },
  {
    slug: "serious_buyer",
    prisma: "SERIOUS_BUYER",
    label: "Serious Buyer",
    minScore: 76,
    maxScore: 90,
    recommendedAction: "Priority callback within 2 hours"
  },
  {
    slug: "high_intent_buyer",
    prisma: "HIGH_INTENT_BUYER",
    label: "High Intent Buyer",
    minScore: 91,
    maxScore: 100,
    recommendedAction: "Immediate high-priority outreach"
  }
] as const;

export const INTENT_CATEGORY_SLUGS = [
  "casual_browser",
  "early_interest",
  "consideration_stage",
  "serious_buyer",
  "high_intent_buyer"
] as const;

export type IntentBand = (typeof INTENT_SCORE_BANDS)[number];
export type IntentCategorySlug = IntentBand["slug"];
export type IntentCategoryPrisma = IntentBand["prisma"];
export type IndustrySlug = "auto";
export type ScorePayload = z.infer<typeof scorePayloadSchema>;
export type ScoreLayer = "behavioural" | "interaction" | "demand" | "consistency" | "readiness";
export type SignalCategory =
  | "urgency"
  | "clarity"
  | "commitment"
  | "affordability"
  | "consistency"
  | "purchase_readiness";
export type RuleDirection = "positive" | "negative";

export interface ScoreBreakdown {
  behaviouralScore: number;
  interactionScore: number;
  demandScore: number;
  consistencyScore: number;
  readinessScore: number;
}

export interface RuleContribution {
  ruleCode: string;
  layer: ScoreLayer;
  signalCategories: SignalCategory[];
  points: number;
  direction: RuleDirection;
  reason: string;
}

export interface PredictionContext {
  posture: "prediction_under_validation";
  note: string;
}

export interface ScoredLead {
  totalScore: number;
  category: IntentCategorySlug;
  categoryLabel: string;
  recommendedAction: string;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  normalizedAnswers: Record<string, unknown>;
  ruleContributions: RuleContribution[];
  scoreVersion: string;
  weightVersion: string;
  ruleSetVersion: string;
  predictionContext: PredictionContext;
}

export interface IndustryModelConfig {
  slug: IndustrySlug;
  displayName: string;
  version: string;
  supportedQuestions: unknown;
  scoreBands: typeof INTENT_SCORE_BANDS;
  metadata: Record<string, unknown>;
}

export interface IndustryScoringModel {
  industry: IndustrySlug;
  config: IndustryModelConfig;
  score: (payload: ScorePayload) => ScoredLead;
}

export function getIntentBand(score: number): IntentBand {
  return (
    INTENT_SCORE_BANDS.find((band) => score >= band.minScore && score <= band.maxScore) ??
    INTENT_SCORE_BANDS[0]
  );
}

export function getIntentBandFromSlug(slug: IntentCategorySlug): IntentBand {
  return INTENT_SCORE_BANDS.find((band) => band.slug === slug) ?? INTENT_SCORE_BANDS[0];
}

export function getIntentBandFromPrisma(prisma: IntentCategoryPrisma): IntentBand {
  return INTENT_SCORE_BANDS.find((band) => band.prisma === prisma) ?? INTENT_SCORE_BANDS[0];
}
