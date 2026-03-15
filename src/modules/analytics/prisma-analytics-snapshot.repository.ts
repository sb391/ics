import { Prisma, PrismaClient } from "@prisma/client";

import type { AnalyticsSnapshotRepository } from "./analytics-snapshot.repository";
import type { AnalyticsSnapshot, SaveAnalyticsSnapshotInput, ValidationAnalytics } from "./analytics.types";

export class PrismaAnalyticsSnapshotRepository implements AnalyticsSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveValidationSnapshot(input: SaveAnalyticsSnapshotInput): Promise<AnalyticsSnapshot> {
    const saved = await this.prisma.analyticsSnapshot.upsert({
      where: {
        snapshotDate: input.snapshotDate
      },
      update: {
        generatedAt: new Date(input.payload.generatedAt),
        totalSubmissions: input.payload.dataset.totalSubmissions,
        labeledSubmissions: input.payload.dataset.labeledSubmissions,
        convertedSubmissions: input.payload.dataset.convertedSubmissions,
        payload: input.payload as unknown as Prisma.InputJsonValue
      },
      create: {
        snapshotDate: input.snapshotDate,
        generatedAt: new Date(input.payload.generatedAt),
        totalSubmissions: input.payload.dataset.totalSubmissions,
        labeledSubmissions: input.payload.dataset.labeledSubmissions,
        convertedSubmissions: input.payload.dataset.convertedSubmissions,
        payload: input.payload as unknown as Prisma.InputJsonValue
      }
    });

    return this.mapSnapshot(saved);
  }

  async listValidationSnapshots(): Promise<AnalyticsSnapshot[]> {
    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      orderBy: {
        snapshotDate: "desc"
      }
    });

    return snapshots.map((snapshot) => this.mapSnapshot(snapshot));
  }

  async findValidationSnapshotById(id: string): Promise<AnalyticsSnapshot | null> {
    const snapshot = await this.prisma.analyticsSnapshot.findUnique({
      where: { id }
    });

    return snapshot ? this.mapSnapshot(snapshot) : null;
  }

  private mapSnapshot(snapshot: {
    id: string;
    snapshotDate: string;
    generatedAt: Date;
    totalSubmissions: number;
    labeledSubmissions: number;
    convertedSubmissions: number;
    payload: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }): AnalyticsSnapshot {
    return {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate,
      generatedAt: snapshot.generatedAt.toISOString(),
      totalSubmissions: snapshot.totalSubmissions,
      labeledSubmissions: snapshot.labeledSubmissions,
      convertedSubmissions: snapshot.convertedSubmissions,
      payload: snapshot.payload as unknown as ValidationAnalytics,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString()
    };
  }
}
