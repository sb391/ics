import { randomUUID } from "crypto";

import { AppError } from "../../lib/errors";
import { buildPaginationMeta } from "../../lib/pagination";
import { getIndustryModel } from "../scoring/industry.registry";
import { getIntentBandFromSlug, type ScorePayload } from "../scoring/scoring.types";
import { prepareDealerRouting } from "../routing/dealer-matching.service";
import { buildSubmissionScoredEvent } from "../webhooks/event-builder";
import type { SubmissionRepository } from "./submission.repository";
import type {
  CreateOutcomeEventInput,
  OutcomeEvent,
  OutcomeSummary,
  SubmissionListQuery,
  SubmissionRecord
} from "./submission.types";

function buildOutcomeSummary(outcomes: OutcomeEvent[]): OutcomeSummary {
  const ordered = [...outcomes].sort(
    (left, right) => new Date(left.happenedAt).getTime() - new Date(right.happenedAt).getTime()
  );
  const latestStatus = ordered.at(-1)?.status ?? null;
  const convertedAt = ordered.find((event) => event.status === "converted")?.happenedAt ?? null;
  const terminalDisposition =
    latestStatus === "converted" || latestStatus === "rejected" || latestStatus === "junk"
      ? latestStatus
      : null;

  return {
    latestStatus,
    journey: [...new Set(ordered.map((event) => event.status))],
    convertedAt,
    terminalDisposition
  };
}

export class SubmissionService {
  constructor(private readonly submissionRepository: SubmissionRepository) {}

  scorePayload(payload: ScorePayload) {
    const model = getIndustryModel(payload.industry);
    const scored = model.score(payload);

    return {
      submissionId: `score_${randomUUID()}`,
      totalScore: scored.totalScore,
      category: scored.categoryLabel,
      breakdown: scored.breakdown,
      positives: scored.positives,
      negatives: scored.negatives,
      recommendedAction: scored.recommendedAction,
      normalizedAnswers: scored.normalizedAnswers,
      ruleContributions: scored.ruleContributions,
      scoreVersion: scored.scoreVersion,
      weightVersion: scored.weightVersion,
      ruleSetVersion: scored.ruleSetVersion,
      predictionContext: scored.predictionContext,
      createdAt: new Date().toISOString()
    };
  }

  async createSubmission(payload: ScorePayload) {
    const model = getIndustryModel(payload.industry);
    const scored = model.score(payload);
    const submissionId = `sub_${randomUUID()}`;
    const webhookEvent = buildSubmissionScoredEvent({
      submissionId,
      industry: payload.industry,
      category: scored.category,
      totalScore: scored.totalScore,
      recommendedAction: scored.recommendedAction,
      breakdown: scored.breakdown,
      positives: scored.positives,
      negatives: scored.negatives,
      scoreVersion: scored.scoreVersion,
      weightVersion: scored.weightVersion,
      ruleSetVersion: scored.ruleSetVersion,
      predictionContext: scored.predictionContext,
      metadata: payload.metadata,
      financePreference: payload.answers.financePreference,
      purchaseTimeline: payload.answers.purchaseTimeline,
      purchaseReason: payload.answers.purchaseReason,
      testDriveReadiness: payload.answers.testDriveReadiness
    });

    const created = await this.submissionRepository.create({
      id: submissionId,
      industry: payload.industry,
      answers: payload.answers,
      behaviouralMetrics: payload.behaviouralMetrics,
      metadata: payload.metadata,
      routing: payload.routing ? prepareDealerRouting(payload.routing) : null,
      consent: payload.consent
        ? {
            dealerContactConsent: payload.consent.dealerContactConsent,
            consentedAt: payload.consent.consentedAt ?? new Date().toISOString(),
            privacyNoticeVersion: payload.consent.privacyNoticeVersion,
            consentSource: payload.consent.consentSource
          }
        : null,
      rawPayload: payload,
      normalizedAnswers: scored.normalizedAnswers,
      totalScore: scored.totalScore,
      category: scored.category,
      breakdown: scored.breakdown,
      positives: scored.positives,
      negatives: scored.negatives,
      recommendedAction: scored.recommendedAction,
      ruleContributions: scored.ruleContributions,
      scoreVersion: scored.scoreVersion,
      weightVersion: scored.weightVersion,
      ruleSetVersion: scored.ruleSetVersion,
      predictionContext: scored.predictionContext,
      webhookEvent
    });

    return this.toDetailResponse(created);
  }

  async createConsumerDemand(payload: ScorePayload) {
    const created = await this.createSubmission(payload);

    return this.toConsumerDemandResponse(created);
  }

  async getConsumerDemandStatus(submissionId: string) {
    const submission = await this.submissionRepository.findById(submissionId);

    if (!submission) {
      throw new AppError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
    }

    return this.toConsumerDemandResponse(this.toDetailResponse(submission));
  }

  async trackOutcome(submissionId: string, outcome: CreateOutcomeEventInput) {
    const updated = await this.submissionRepository.appendOutcome(submissionId, outcome);

    if (!updated) {
      throw new AppError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
    }

    return this.toDetailResponse(updated);
  }

  async listSubmissions(query: SubmissionListQuery) {
    const { items, totalItems } = await this.submissionRepository.list(query);

    return {
      data: items.map((item) => this.toListItem(item)),
      pagination: buildPaginationMeta(query.page, query.pageSize, totalItems)
    };
  }

  async getSubmissionById(id: string) {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new AppError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
    }

    return this.toDetailResponse(submission);
  }

  async getAllSubmissions() {
    return this.submissionRepository.findAll();
  }

  async ping() {
    return this.submissionRepository.ping();
  }

  private toListItem(record: SubmissionRecord) {
    const band = getIntentBandFromSlug(record.category);
    const outcomeSummary = buildOutcomeSummary(record.outcomes);

    return {
      id: record.id,
      industry: record.industry,
      purchaseReason: record.answers.purchaseReason ?? null,
      bodyStyle: record.answers.bodyStyle ?? null,
      totalScore: record.totalScore,
      category: band.label,
      recommendedAction: record.recommendedAction,
      financePreference: record.answers.financePreference ?? null,
      purchaseTimeline: record.answers.purchaseTimeline ?? null,
      testDriveReadiness: record.answers.testDriveReadiness ?? null,
      currentOutcomeStatus: outcomeSummary.latestStatus,
      routingStatus: record.routing?.routingStatus ?? null,
      dealerMatchStatus: record.routing?.dealerMatchStatus ?? null,
      assignedDealerId: record.routing?.assignedDealerId ?? null,
      city: record.routing?.city ?? null,
      pincode: record.routing?.pincode ?? null,
      scoreVersion: record.scoreVersion,
      ruleSetVersion: record.ruleSetVersion,
      createdAt: record.createdAt
    };
  }

  private toDetailResponse(record: SubmissionRecord) {
    const band = getIntentBandFromSlug(record.category);

    return {
      submissionId: record.id,
      industry: record.industry,
      answers: record.answers,
      behaviouralMetrics: record.behaviouralMetrics,
      metadata: record.metadata,
      routing: record.routing,
      consent: record.consent,
      totalScore: record.totalScore,
      category: band.label,
      breakdown: record.breakdown,
      positives: record.positives,
      negatives: record.negatives,
      recommendedAction: record.recommendedAction,
      normalizedAnswers: record.normalizedAnswers,
      ruleContributions: record.ruleContributions,
      scoreVersion: record.scoreVersion,
      weightVersion: record.weightVersion,
      ruleSetVersion: record.ruleSetVersion,
      predictionContext: record.predictionContext,
      outcomes: record.outcomes,
      outcomeSummary: buildOutcomeSummary(record.outcomes),
      rawPayload: record.rawPayload,
      webhookEvent: record.webhookEvent,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  private toConsumerDemandResponse(detail: ReturnType<SubmissionService["toDetailResponse"]>) {
    return {
      demandId: detail.submissionId,
      submissionId: detail.submissionId,
      status: "recorded",
      message: "Your demand has been recorded. We are identifying relevant options and dealers in your area.",
      routingStatus: detail.routing?.routingStatus ?? null,
      dealerMatchStatus: detail.routing?.dealerMatchStatus ?? null,
      assignedDealerId: detail.routing?.assignedDealerId ?? null,
      city: detail.routing?.city ?? null,
      pincode: detail.routing?.pincode ?? null,
      createdAt: detail.createdAt
    };
  }
}
