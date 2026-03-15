import { randomUUID } from "crypto";

import type { AnalyticsSnapshotRepository } from "./analytics-snapshot.repository";
import type { AnalyticsSnapshot, SaveAnalyticsSnapshotInput } from "./analytics.types";

export class InMemoryAnalyticsSnapshotRepository implements AnalyticsSnapshotRepository {
  private readonly snapshots: AnalyticsSnapshot[] = [];

  async saveValidationSnapshot(input: SaveAnalyticsSnapshotInput): Promise<AnalyticsSnapshot> {
    const now = new Date().toISOString();
    const existing = this.snapshots.find((snapshot) => snapshot.snapshotDate === input.snapshotDate);

    if (existing) {
      existing.generatedAt = input.payload.generatedAt;
      existing.totalSubmissions = input.payload.dataset.totalSubmissions;
      existing.labeledSubmissions = input.payload.dataset.labeledSubmissions;
      existing.convertedSubmissions = input.payload.dataset.convertedSubmissions;
      existing.payload = input.payload;
      existing.updatedAt = now;
      return existing;
    }

    const snapshot: AnalyticsSnapshot = {
      id: `snap_${randomUUID()}`,
      snapshotDate: input.snapshotDate,
      generatedAt: input.payload.generatedAt,
      totalSubmissions: input.payload.dataset.totalSubmissions,
      labeledSubmissions: input.payload.dataset.labeledSubmissions,
      convertedSubmissions: input.payload.dataset.convertedSubmissions,
      payload: input.payload,
      createdAt: now,
      updatedAt: now
    };

    this.snapshots.unshift(snapshot);
    return snapshot;
  }

  async listValidationSnapshots(): Promise<AnalyticsSnapshot[]> {
    return [...this.snapshots].sort((left, right) => right.snapshotDate.localeCompare(left.snapshotDate));
  }

  async findValidationSnapshotById(id: string): Promise<AnalyticsSnapshot | null> {
    return this.snapshots.find((snapshot) => snapshot.id === id) ?? null;
  }
}
