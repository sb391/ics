import type { IntentCategorySlug, PredictionContext, ScoreLayer } from "../scoring/scoring.types";
import type { OutcomeStatus } from "../submissions/submission.types";

export interface AnalyticsSubmissionSummary {
  submissionId: string;
  totalScore: number;
  categorySlug: IntentCategorySlug;
  category: string;
  latestOutcomeStatus: OutcomeStatus | null;
  scoreVersion: string;
  topRules: Array<{
    ruleCode: string;
    points: number;
    layer: ScoreLayer;
  }>;
}

export interface ConversionRateByBandEntry {
  bandSlug: IntentCategorySlug;
  bandLabel: string;
  totalSubmissions: number;
  labeledSubmissions: number;
  convertedSubmissions: number;
  conversionRate: number | null;
  labeledConversionRate: number | null;
}

export interface RulePerformanceEntry {
  ruleCode: string;
  layer: ScoreLayer;
  firedCount: number;
  labeledCount: number;
  convertedCount: number;
  conversionRate: number | null;
  conversionLift: number | null;
  negativeOutcomeRate: number | null;
  averageContribution: number | null;
}

export interface FunnelByScoreBandEntry {
  bandSlug: IntentCategorySlug;
  bandLabel: string;
  totalSubmissions: number;
  contacted: number;
  qualified: number;
  visitBooked: number;
  financeApplied: number;
  converted: number;
  rejected: number;
  junk: number;
}

export interface VersionCoverageSummary {
  scoreVersions: Array<{ version: string; count: number }>;
  weightVersions: Array<{ version: string; count: number }>;
  ruleSetVersions: Array<{ version: string; count: number }>;
}

export interface ValidationAnalytics {
  generatedAt: string;
  posture: PredictionContext;
  dataset: {
    totalSubmissions: number;
    labeledSubmissions: number;
    convertedSubmissions: number;
    rejectedOrJunkSubmissions: number;
  };
  conversionRateByBand: ConversionRateByBandEntry[];
  averageScoreComparison: {
    converted: number | null;
    nonConverted: number | null;
  };
  falsePositives: {
    definition: string;
    count: number;
    submissions: AnalyticsSubmissionSummary[];
  };
  falseNegatives: {
    definition: string;
    count: number;
    submissions: AnalyticsSubmissionSummary[];
  };
  topPerformingRules: RulePerformanceEntry[];
  weakestRules: RulePerformanceEntry[];
  funnelByScoreBand: FunnelByScoreBandEntry[];
  versionCoverage: VersionCoverageSummary;
}

export interface AnalyticsSnapshot {
  id: string;
  snapshotDate: string;
  generatedAt: string;
  totalSubmissions: number;
  labeledSubmissions: number;
  convertedSubmissions: number;
  payload: ValidationAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAnalyticsSnapshotInput {
  snapshotDate: string;
  payload: ValidationAnalytics;
}
