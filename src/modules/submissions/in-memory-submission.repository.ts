import { randomUUID } from "crypto";

import type { SubmissionRepository } from "./submission.repository";
import type {
  CreateOutcomeEventInput,
  CreateSubmissionRecordInput,
  PaginatedSubmissions,
  SubmissionListQuery,
  SubmissionRecord
} from "./submission.types";

const TERMINAL_OUTCOME_STATUSES = new Set(["converted", "rejected", "junk"]);

export class InMemorySubmissionRepository implements SubmissionRepository {
  private readonly submissions: SubmissionRecord[] = [];

  async create(input: CreateSubmissionRecordInput): Promise<SubmissionRecord> {
    const now = new Date().toISOString();
    const record: SubmissionRecord = {
      ...input,
      outcomes: [],
      currentOutcomeStatus: null,
      createdAt: now,
      updatedAt: now
    };

    this.submissions.unshift(record);
    return record;
  }

  async list(query: SubmissionListQuery): Promise<PaginatedSubmissions> {
    const filtered = this.submissions
      .filter((record) => (query.minScore === undefined ? true : record.totalScore >= query.minScore))
      .filter((record) => (query.maxScore === undefined ? true : record.totalScore <= query.maxScore))
      .filter((record) => (query.category === undefined ? true : record.category === query.category))
      .filter((record) =>
        query.timeline === undefined ? true : record.answers.purchaseTimeline === query.timeline
      )
      .filter((record) =>
        query.financePreference === undefined
          ? true
          : record.answers.financePreference === query.financePreference
      )
      .filter((record) => {
        if (!query.reviewState || query.reviewState === "all") {
          return true;
        }

        const isClosed =
          record.currentOutcomeStatus !== null && TERMINAL_OUTCOME_STATUSES.has(record.currentOutcomeStatus);

        return query.reviewState === "closed" ? isClosed : !isClosed;
      })
      .filter((record) =>
        query.outcomeStatus === undefined ? true : record.currentOutcomeStatus === query.outcomeStatus
      )
      .sort((left, right) => {
        if (query.sortBy === "score") {
          return query.sortOrder === "asc"
            ? left.totalScore - right.totalScore
            : right.totalScore - left.totalScore;
        }

        return query.sortOrder === "asc"
          ? left.createdAt.localeCompare(right.createdAt)
          : right.createdAt.localeCompare(left.createdAt);
      });

    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize;

    return {
      items: filtered.slice(start, end),
      totalItems: filtered.length
    };
  }

  async findById(id: string): Promise<SubmissionRecord | null> {
    return this.submissions.find((record) => record.id === id) ?? null;
  }

  async findAll(): Promise<SubmissionRecord[]> {
    return [...this.submissions];
  }

  async appendOutcome(submissionId: string, input: CreateOutcomeEventInput): Promise<SubmissionRecord | null> {
    const record = this.submissions.find((candidate) => candidate.id === submissionId);

    if (!record) {
      return null;
    }

    const outcome = {
      id: `out_${randomUUID()}`,
      status: input.status,
      note: input.note,
      source: input.source,
      happenedAt: input.happenedAt,
      createdAt: new Date().toISOString()
    };

    record.outcomes.push(outcome);
    record.currentOutcomeStatus = input.status;
    record.updatedAt = new Date().toISOString();

    return record;
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
