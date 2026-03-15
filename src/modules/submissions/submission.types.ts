import type {
  IntentCategorySlug,
  PredictionContext,
  RuleContribution,
  ScoreBreakdown,
  ScorePayload
} from "../scoring/scoring.types";

export const OUTCOME_STATUSES = [
  "contacted",
  "qualified",
  "visit_booked",
  "finance_applied",
  "converted",
  "rejected",
  "junk"
] as const;

export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

export const DEALER_MATCH_STATUSES = ["pending", "matched", "unmatched", "manual_review"] as const;
export type DealerMatchStatus = (typeof DEALER_MATCH_STATUSES)[number];

export const ROUTING_STATUSES = ["captured", "ready_for_assignment", "assigned"] as const;
export type RoutingStatus = (typeof ROUTING_STATUSES)[number];

export interface DealerRoutingRecord {
  pincode: string;
  city: string;
  locality: string;
  addressLine: string | null;
  assignedDealerId: string | null;
  matchedDealerName: string | null;
  dealerMatchStatus: DealerMatchStatus;
  routingStatus: RoutingStatus;
  matchedAt: string | null;
}

export interface SubmissionConsentRecord {
  dealerContactConsent: boolean;
  consentedAt: string;
  privacyNoticeVersion?: string;
  consentSource?: string;
}

export interface OutcomeEvent {
  id: string;
  status: OutcomeStatus;
  note?: string;
  source?: string;
  happenedAt: string;
  createdAt: string;
}

export interface OutcomeSummary {
  latestStatus: OutcomeStatus | null;
  journey: OutcomeStatus[];
  convertedAt: string | null;
  terminalDisposition: "converted" | "rejected" | "junk" | null;
}

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
    scoreVersion: string;
    weightVersion: string;
    ruleSetVersion: string;
    financePreference?: string;
    purchaseTimeline?: string;
    purchaseReason?: string;
    testDriveReadiness?: string;
    metadata: ScorePayload["metadata"];
    predictionContext: PredictionContext;
  };
}

export interface SubmissionRecord {
  id: string;
  industry: ScorePayload["industry"];
  answers: ScorePayload["answers"];
  behaviouralMetrics: ScorePayload["behaviouralMetrics"];
  metadata: ScorePayload["metadata"];
  routing: DealerRoutingRecord | null;
  consent: SubmissionConsentRecord | null;
  rawPayload: ScorePayload;
  normalizedAnswers: Record<string, unknown>;
  totalScore: number;
  category: IntentCategorySlug;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  recommendedAction: string;
  ruleContributions: RuleContribution[];
  scoreVersion: string;
  weightVersion: string;
  ruleSetVersion: string;
  predictionContext: PredictionContext;
  outcomes: OutcomeEvent[];
  currentOutcomeStatus: OutcomeStatus | null;
  webhookEvent: SubmissionScoredEvent;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRecordInput {
  id: string;
  industry: ScorePayload["industry"];
  answers: ScorePayload["answers"];
  behaviouralMetrics: ScorePayload["behaviouralMetrics"];
  metadata: ScorePayload["metadata"];
  routing: DealerRoutingRecord | null;
  consent: SubmissionConsentRecord | null;
  rawPayload: ScorePayload;
  normalizedAnswers: Record<string, unknown>;
  totalScore: number;
  category: IntentCategorySlug;
  breakdown: ScoreBreakdown;
  positives: string[];
  negatives: string[];
  recommendedAction: string;
  ruleContributions: RuleContribution[];
  scoreVersion: string;
  weightVersion: string;
  ruleSetVersion: string;
  predictionContext: PredictionContext;
  webhookEvent: SubmissionScoredEvent;
}

export interface CreateOutcomeEventInput {
  status: OutcomeStatus;
  note?: string;
  source?: string;
  happenedAt: string;
}

export interface SubmissionListQuery {
  page: number;
  pageSize: number;
  minScore?: number;
  maxScore?: number;
  category?: IntentCategorySlug;
  timeline?: ScorePayload["answers"]["purchaseTimeline"];
  financePreference?: ScorePayload["answers"]["financePreference"];
  outcomeStatus?: OutcomeStatus;
  reviewState?: "open" | "closed" | "all";
  sortBy: "createdAt" | "score";
  sortOrder: "asc" | "desc";
}

export interface PaginatedSubmissions {
  items: SubmissionRecord[];
  totalItems: number;
}
