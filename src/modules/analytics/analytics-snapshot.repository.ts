import type { AnalyticsSnapshot, SaveAnalyticsSnapshotInput } from "./analytics.types";

export interface AnalyticsSnapshotRepository {
  saveValidationSnapshot(input: SaveAnalyticsSnapshotInput): Promise<AnalyticsSnapshot>;
  listValidationSnapshots(): Promise<AnalyticsSnapshot[]>;
  findValidationSnapshotById(id: string): Promise<AnalyticsSnapshot | null>;
}
