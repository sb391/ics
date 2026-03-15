import type {
  CreateOutcomeEventInput,
  CreateSubmissionRecordInput,
  PaginatedSubmissions,
  SubmissionListQuery,
  SubmissionRecord
} from "./submission.types";

export interface SubmissionRepository {
  create(input: CreateSubmissionRecordInput): Promise<SubmissionRecord>;
  list(query: SubmissionListQuery): Promise<PaginatedSubmissions>;
  findById(id: string): Promise<SubmissionRecord | null>;
  findAll(): Promise<SubmissionRecord[]>;
  appendOutcome(submissionId: string, input: CreateOutcomeEventInput): Promise<SubmissionRecord | null>;
  ping(): Promise<boolean>;
}
