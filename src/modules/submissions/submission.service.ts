import { randomUUID } from "crypto";

import { AppError } from "../../lib/errors";
import { buildPaginationMeta } from "../../lib/pagination";
import { getIndustryModel } from "../scoring/industry.registry";
import { getIntentBandFromSlug, type ScorePayload } from "../scoring/scoring.types";
import { buildSubmissionScoredEvent } from "../webhooks/event-builder";
import type { SubmissionRepository } from "./submission.repository";
import type { SubmissionListQuery, SubmissionRecord } from "./submission.types";

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
      metadata: payload.metadata,
      financePreference: payload.answers.financePreference,
      purchaseTimeline: payload.answers.purchaseTimeline
    });

    const created = await this.submissionRepository.create({
      id: submissionId,
      industry: payload.industry,
      lead: payload.lead,
      answers: payload.answers,
      behaviouralMetrics: payload.behaviouralMetrics,
      metadata: payload.metadata,
      rawPayload: payload,
      normalizedAnswers: scored.normalizedAnswers,
      totalScore: scored.totalScore,
      category: scored.category,
      breakdown: scored.breakdown,
      positives: scored.positives,
      negatives: scored.negatives,
      recommendedAction: scored.recommendedAction,
      webhookEvent
    });

    return this.toDetailResponse(created);
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

  async ping() {
    return this.submissionRepository.ping();
  }

  private toListItem(record: SubmissionRecord) {
    const band = getIntentBandFromSlug(record.category);

    return {
      id: record.id,
      industry: record.industry,
      lead: record.lead,
      totalScore: record.totalScore,
      category: band.label,
      recommendedAction: record.recommendedAction,
      financePreference: record.answers.financePreference ?? null,
      purchaseTimeline: record.answers.purchaseTimeline ?? null,
      createdAt: record.createdAt
    };
  }

  private toDetailResponse(record: SubmissionRecord) {
    const band = getIntentBandFromSlug(record.category);

    return {
      submissionId: record.id,
      industry: record.industry,
      lead: record.lead,
      answers: record.answers,
      behaviouralMetrics: record.behaviouralMetrics,
      metadata: record.metadata,
      totalScore: record.totalScore,
      category: band.label,
      breakdown: record.breakdown,
      positives: record.positives,
      negatives: record.negatives,
      recommendedAction: record.recommendedAction,
      normalizedAnswers: record.normalizedAnswers,
      rawPayload: record.rawPayload,
      webhookEvent: record.webhookEvent,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
