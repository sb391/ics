import type {
  IntentCategorySlug,
  ScoreBreakdown,
  ScorePayload
} from "../scoring/scoring.types";

export interface SubmissionScoredEvent {
  eventId: string;
  eventType: "ics.submission.scored";
  version: string;
  occurredAt: string;
  submission: {
    id: string;
    industry: ScorePayload["industry"];
    totalScore: number;
    category: {
      slug: IntentCategorySlug;
      label: string;
    };
    recommendedAction: string;
    breakdown: ScoreBreakdown;
    positives: string[];
    negatives: string[];
    financePreference?: string;
    purchaseTimeline?: string;
    metadata: ScorePayload["metadata"];
  };
}

export interface SubmissionRecord {
  id: string;
  industry: ScorePayload["industry"];
  lead: ScorePayload["lead"];
  answers: ScorePayload["answers"];
  behaviouralMetrics: ScorePayload["behaviouralMetrics"];
  metadata: ScorePayload["metadata"];
  rawPayload: ScorePayload;
  normalizedAnswers: Record<string, unknown>;
  totalScore: number;
  category: IntentCategorySlug;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  recommendedAction: string;
  webhookEvent: SubmissionScoredEvent;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRecordInput {
  id: string;
  industry: ScorePayload["industry"];
  lead: ScorePayload["lead"];
  answers: ScorePayload["answers"];
  behaviouralMetrics: ScorePayload["behaviouralMetrics"];
  metadata: ScorePayload["metadata"];
  rawPayload: ScorePayload;
  normalizedAnswers: Record<string, unknown>;
  totalScore: number;
  category: IntentCategorySlug;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  recommendedAction: string;
  webhookEvent: SubmissionScoredEvent;
}

export interface SubmissionListQuery {
  page: number;
  pageSize: number;
  minScore?: number;
  maxScore?: number;
  category?: IntentCategorySlug;
  timeline?: ScorePayload["answers"]["purchaseTimeline"];
  financePreference?: ScorePayload["answers"]["financePreference"];
  sortBy: "createdAt" | "score";
  sortOrder: "asc" | "desc";
}

export interface PaginatedSubmissions {
  items: SubmissionRecord[];
  totalItems: number;
}
