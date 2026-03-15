import type { CreateSubmissionRecordInput, PaginatedSubmissions, SubmissionListQuery, SubmissionRecord } from "./submission.types";

export interface SubmissionRepository {
  create(input: CreateSubmissionRecordInput): Promise<SubmissionRecord>;
  list(query: SubmissionListQuery): Promise<PaginatedSubmissions>;
  findById(id: string): Promise<SubmissionRecord | null>;
  ping(): Promise<boolean>;
}
