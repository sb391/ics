import { getIntentBandFromSlug, INTENT_SCORE_BANDS, type IntentCategorySlug } from "../scoring/scoring.types";
import type { SubmissionService } from "../submissions/submission.service";
import type { OutcomeEvent, OutcomeStatus, SubmissionRecord } from "../submissions/submission.types";
import { AppError } from "../../lib/errors";
import type { AnalyticsSnapshotRepository } from "./analytics-snapshot.repository";
import type {
  AnalyticsSubmissionSummary,
  RulePerformanceEntry,
  ValidationAnalytics
} from "./analytics.types";
import type { ScoreLayer } from "../scoring/scoring.types";

const POSITIVE_VALIDATION_OUTCOMES = new Set<OutcomeStatus>(["visit_booked", "finance_applied", "converted"]);
const NEGATIVE_VALIDATION_OUTCOMES = new Set<OutcomeStatus>(["rejected", "junk"]);
const HIGH_INTENT_BANDS = new Set<IntentCategorySlug>(["serious_buyer", "high_intent_buyer"]);
const LOW_INTENT_BANDS = new Set<IntentCategorySlug>(["casual_browser", "early_interest"]);

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function getLatestOutcome(outcomes: OutcomeEvent[]) {
  const ordered = [...outcomes].sort(
    (left, right) => new Date(left.happenedAt).getTime() - new Date(right.happenedAt).getTime()
  );

  return ordered.at(-1) ?? null;
}

function hasReachedOutcome(record: SubmissionRecord, status: OutcomeStatus) {
  return record.outcomes.some((outcome) => outcome.status === status);
}

function hasPositiveValidation(record: SubmissionRecord) {
  return record.outcomes.some((outcome) => POSITIVE_VALIDATION_OUTCOMES.has(outcome.status));
}

function hasNegativeValidation(record: SubmissionRecord) {
  return record.outcomes.some((outcome) => NEGATIVE_VALIDATION_OUTCOMES.has(outcome.status));
}

function summarizeSubmission(record: SubmissionRecord): AnalyticsSubmissionSummary {
  return {
    submissionId: record.id,
    totalScore: record.totalScore,
    categorySlug: record.category,
    category: getIntentBandFromSlug(record.category).label,
    latestOutcomeStatus: getLatestOutcome(record.outcomes)?.status ?? null,
    scoreVersion: record.scoreVersion,
    topRules: record.ruleContributions
      .slice()
      .sort((left, right) => Math.abs(right.points) - Math.abs(left.points))
      .slice(0, 5)
      .map((rule) => ({
        ruleCode: rule.ruleCode,
        points: rule.points,
        layer: rule.layer
      }))
  };
}

function buildVersionCoverage(records: SubmissionRecord[]) {
  return {
    scoreVersions: Object.entries(
      records.reduce<Record<string, number>>((accumulator, record) => {
        accumulator[record.scoreVersion] = (accumulator[record.scoreVersion] ?? 0) + 1;
        return accumulator;
      }, {})
    ).map(([version, count]) => ({ version, count })),
    weightVersions: Object.entries(
      records.reduce<Record<string, number>>((accumulator, record) => {
        accumulator[record.weightVersion] = (accumulator[record.weightVersion] ?? 0) + 1;
        return accumulator;
      }, {})
    ).map(([version, count]) => ({ version, count })),
    ruleSetVersions: Object.entries(
      records.reduce<Record<string, number>>((accumulator, record) => {
        accumulator[record.ruleSetVersion] = (accumulator[record.ruleSetVersion] ?? 0) + 1;
        return accumulator;
      }, {})
    ).map(([version, count]) => ({ version, count }))
  };
}

export class AnalyticsService {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly analyticsSnapshotRepository: AnalyticsSnapshotRepository
  ) {}

  async getValidationAnalytics(): Promise<ValidationAnalytics> {
    const records = await this.submissionService.getAllSubmissions();
    const labeledRecords = records.filter((record) => record.outcomes.length > 0);
    const convertedRecords = labeledRecords.filter((record) => hasReachedOutcome(record, "converted"));
    const nonConvertedRecords = labeledRecords.filter((record) => !hasReachedOutcome(record, "converted"));
    const baselineConversionRate =
      labeledRecords.length === 0 ? null : convertedRecords.length / labeledRecords.length;

    const conversionRateByBand = INTENT_SCORE_BANDS.map((band) => {
      const bandRecords = records.filter((record) => record.category === band.slug);
      const bandLabeledRecords = bandRecords.filter((record) => record.outcomes.length > 0);
      const bandConvertedRecords = bandRecords.filter((record) => hasReachedOutcome(record, "converted"));

      return {
        bandSlug: band.slug,
        bandLabel: band.label,
        totalSubmissions: bandRecords.length,
        labeledSubmissions: bandLabeledRecords.length,
        convertedSubmissions: bandConvertedRecords.length,
        conversionRate: bandRecords.length === 0 ? null : Number((bandConvertedRecords.length / bandRecords.length).toFixed(3)),
        labeledConversionRate:
          bandLabeledRecords.length === 0
            ? null
            : Number((bandConvertedRecords.length / bandLabeledRecords.length).toFixed(3))
      };
    });

    const falsePositives = labeledRecords
      .filter((record) => HIGH_INTENT_BANDS.has(record.category) && hasNegativeValidation(record))
      .map((record) => summarizeSubmission(record));
    const falseNegatives = labeledRecords
      .filter((record) => LOW_INTENT_BANDS.has(record.category) && hasPositiveValidation(record))
      .map((record) => summarizeSubmission(record));

    const ruleMap = new Map<
      string,
      {
        ruleCode: string;
        layer: ScoreLayer;
        averageContribution: number[];
        firedCount: number;
        labeledCount: number;
        convertedCount: number;
        negativeCount: number;
      }
    >();

    for (const record of records) {
      const labeled = record.outcomes.length > 0;
      const converted = hasReachedOutcome(record, "converted");
      const negative = hasNegativeValidation(record);

      for (const rule of record.ruleContributions) {
        const existing =
          ruleMap.get(rule.ruleCode) ??
          {
            ruleCode: rule.ruleCode,
            layer: rule.layer,
            averageContribution: [],
            firedCount: 0,
            labeledCount: 0,
            convertedCount: 0,
            negativeCount: 0
          };

        existing.firedCount += 1;
        existing.averageContribution.push(rule.points);
        if (labeled) {
          existing.labeledCount += 1;
        }
        if (converted) {
          existing.convertedCount += 1;
        }
        if (negative) {
          existing.negativeCount += 1;
        }

        ruleMap.set(rule.ruleCode, existing);
      }
    }

    const rulePerformance: RulePerformanceEntry[] = [...ruleMap.values()].map((rule) => {
      const conversionRate =
        rule.labeledCount === 0 ? null : Number((rule.convertedCount / rule.labeledCount).toFixed(3));
      const negativeOutcomeRate =
        rule.labeledCount === 0 ? null : Number((rule.negativeCount / rule.labeledCount).toFixed(3));
      const conversionLift =
        conversionRate === null || baselineConversionRate === null
          ? null
          : Number((conversionRate - baselineConversionRate).toFixed(3));

      return {
        ruleCode: rule.ruleCode,
        layer: rule.layer,
        firedCount: rule.firedCount,
        labeledCount: rule.labeledCount,
        convertedCount: rule.convertedCount,
        conversionRate,
        conversionLift,
        negativeOutcomeRate,
        averageContribution: average(rule.averageContribution)
      };
    });

    const funnelByScoreBand = INTENT_SCORE_BANDS.map((band) => {
      const bandRecords = records.filter((record) => record.category === band.slug);

      return {
        bandSlug: band.slug,
        bandLabel: band.label,
        totalSubmissions: bandRecords.length,
        contacted: bandRecords.filter((record) => hasReachedOutcome(record, "contacted")).length,
        qualified: bandRecords.filter((record) => hasReachedOutcome(record, "qualified")).length,
        visitBooked: bandRecords.filter((record) => hasReachedOutcome(record, "visit_booked")).length,
        financeApplied: bandRecords.filter((record) => hasReachedOutcome(record, "finance_applied")).length,
        converted: bandRecords.filter((record) => hasReachedOutcome(record, "converted")).length,
        rejected: bandRecords.filter((record) => hasReachedOutcome(record, "rejected")).length,
        junk: bandRecords.filter((record) => hasReachedOutcome(record, "junk")).length
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      posture: {
        posture: "prediction_under_validation",
        note: "ICS is an explainable prediction under validation against downstream outcomes, not ground truth."
      },
      dataset: {
        totalSubmissions: records.length,
        labeledSubmissions: labeledRecords.length,
        convertedSubmissions: convertedRecords.length,
        rejectedOrJunkSubmissions: labeledRecords.filter((record) => hasNegativeValidation(record)).length
      },
      conversionRateByBand,
      averageScoreComparison: {
        converted: average(convertedRecords.map((record) => record.totalScore)),
        nonConverted: average(nonConvertedRecords.map((record) => record.totalScore))
      },
      falsePositives: {
        definition: "High-intent predictions that later reached rejected or junk outcomes.",
        count: falsePositives.length,
        submissions: falsePositives.slice(0, 10)
      },
      falseNegatives: {
        definition:
          "Low-intent predictions that later reached visit booked, finance applied, or converted outcomes.",
        count: falseNegatives.length,
        submissions: falseNegatives.slice(0, 10)
      },
      topPerformingRules: rulePerformance
        .slice()
        .sort(
          (left, right) =>
            (right.conversionLift ?? Number.NEGATIVE_INFINITY) -
              (left.conversionLift ?? Number.NEGATIVE_INFINITY) ||
            right.convertedCount - left.convertedCount ||
            right.firedCount - left.firedCount
        )
        .slice(0, 10),
      weakestRules: rulePerformance
        .slice()
        .sort(
          (left, right) =>
            (left.conversionLift ?? Number.POSITIVE_INFINITY) -
              (right.conversionLift ?? Number.POSITIVE_INFINITY) ||
            (right.negativeOutcomeRate ?? Number.NEGATIVE_INFINITY) -
              (left.negativeOutcomeRate ?? Number.NEGATIVE_INFINITY) ||
            right.firedCount - left.firedCount
        )
        .slice(0, 10),
      funnelByScoreBand,
      versionCoverage: buildVersionCoverage(records)
    };
  }

  async saveValidationSnapshot(snapshotDate?: string) {
    const payload = await this.getValidationAnalytics();
    const normalizedSnapshotDate = snapshotDate ?? new Date().toISOString().slice(0, 10);

    return this.analyticsSnapshotRepository.saveValidationSnapshot({
      snapshotDate: normalizedSnapshotDate,
      payload
    });
  }

  async listValidationSnapshots() {
    return this.analyticsSnapshotRepository.listValidationSnapshots();
  }

  async getValidationSnapshot(id: string) {
    const snapshot = await this.analyticsSnapshotRepository.findValidationSnapshotById(id);

    if (!snapshot) {
      throw new AppError(404, "ANALYTICS_SNAPSHOT_NOT_FOUND", "Analytics snapshot not found");
    }

    return snapshot;
  }
}
