import { randomUUID } from "crypto";

import { getIntentBandFromSlug, type IntentCategorySlug, type ScoreBreakdown, type ScorePayload } from "../scoring/scoring.types";
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
  metadata: ScorePayload["metadata"];
  financePreference?: string;
  purchaseTimeline?: string;
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
      financePreference: input.financePreference,
      purchaseTimeline: input.purchaseTimeline,
      metadata: input.metadata
    }
  };
}
