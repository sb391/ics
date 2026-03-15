import { randomUUID } from "crypto";

import {
  getIntentBandFromSlug,
  type IntentCategorySlug,
  type PredictionContext,
  type ScoreBreakdown,
  type ScorePayload
} from "../scoring/scoring.types";
import type { SubmissionScoredEvent } from "../submissions/submission.types";

interface BuildWebhookEventInput {
  submissionId: string;
  industry: ScorePayload["industry"];
  category: IntentCategorySlug;
  totalScore: number;
  recommendedAction: string;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  scoreVersion: string;
  weightVersion: string;
  ruleSetVersion: string;
  predictionContext: PredictionContext;
  metadata: ScorePayload["metadata"];
  financePreference?: string;
  purchaseTimeline?: string;
  purchaseReason?: string;
  testDriveReadiness?: string;
}

export function buildSubmissionScoredEvent(input: BuildWebhookEventInput): SubmissionScoredEvent {
  const band = getIntentBandFromSlug(input.category);

  return {
    eventId: `evt_${randomUUID()}`,
    eventType: "ics.submission.scored",
    version: "2026-03-15",
    occurredAt: new Date().toISOString(),
    submission: {
      id: input.submissionId,
      industry: input.industry,
      totalScore: input.totalScore,
      category: {
        slug: input.category,
        label: band.label
      },
      recommendedAction: input.recommendedAction,
      breakdown: input.breakdown,
      positives: input.positives,
      negatives: input.negatives,
      scoreVersion: input.scoreVersion,
      weightVersion: input.weightVersion,
      ruleSetVersion: input.ruleSetVersion,
      financePreference: input.financePreference,
      purchaseTimeline: input.purchaseTimeline,
      purchaseReason: input.purchaseReason,
      testDriveReadiness: input.testDriveReadiness,
      metadata: input.metadata,
      predictionContext: input.predictionContext
    }
  };
}
