import { Prisma, PrismaClient } from "@prisma/client";

import { getIntentBandFromPrisma, getIntentBandFromSlug, type IntentCategorySlug } from "../scoring/scoring.types";
import type { SubmissionRepository } from "./submission.repository";
import type { CreateSubmissionRecordInput, PaginatedSubmissions, SubmissionListQuery, SubmissionRecord } from "./submission.types";

const categoryToPrisma: Record<IntentCategorySlug, "CASUAL_BROWSER" | "EARLY_INTEREST" | "CONSIDERATION_STAGE" | "SERIOUS_BUYER" | "HIGH_INTENT_BUYER"> = {
  casual_browser: "CASUAL_BROWSER",
  early_interest: "EARLY_INTEREST",
  consideration_stage: "CONSIDERATION_STAGE",
  serious_buyer: "SERIOUS_BUYER",
  high_intent_buyer: "HIGH_INTENT_BUYER"
};

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateSubmissionRecordInput): Promise<SubmissionRecord> {
    const created = await this.prisma.submission.create({
      data: {
        id: input.id,
        industry: input.industry,
        leadName: input.lead.name,
        leadEmail: input.lead.email,
        leadPhone: input.lead.phone,
        leadCity: input.lead.city,
        financePreference: input.answers.financePreference,
        purchaseTimeline: input.answers.purchaseTimeline,
        rawPayload: input.rawPayload as Prisma.InputJsonValue,
        normalizedAnswers: input.normalizedAnswers as Prisma.InputJsonValue,
        webhookEvent: input.webhookEvent as unknown as Prisma.InputJsonValue,
        totalScore: input.totalScore,
        category: categoryToPrisma[input.category],
        positives: input.positives as unknown as Prisma.InputJsonValue,
        negatives: input.negatives as unknown as Prisma.InputJsonValue,
        recommendedAction: input.recommendedAction,
        scoreBreakdown: {
          create: {
            behaviouralScore: input.breakdown.behaviouralScore,
            interactionScore: input.breakdown.interactionScore,
            consistencyScore: input.breakdown.consistencyScore,
            economicScore: input.breakdown.economicScore
          }
        },
        behaviouralMetrics: {
          create: {
            totalCompletionSeconds: input.behaviouralMetrics.totalCompletionSeconds,
            timePerStepSeconds: input.behaviouralMetrics.timePerStepSeconds as Prisma.InputJsonValue,
            backtracks: input.behaviouralMetrics.backtracks,
            answerEdits: input.behaviouralMetrics.answerEdits,
            idlePauses: input.behaviouralMetrics.idlePauses,
            tabSwitches: input.behaviouralMetrics.tabSwitches,
            scrollDepthPercent: input.behaviouralMetrics.scrollDepthPercent,
            completionRatePercent: input.behaviouralMetrics.completionRatePercent
          }
        },
        metadata: {
          create: {
            source: input.metadata.source,
            campaign: input.metadata.campaign,
            formId: input.metadata.formId,
            sessionId: input.metadata.sessionId
          }
        }
      },
      include: {
        scoreBreakdown: true,
        behaviouralMetrics: true,
        metadata: true
      }
    });

    return this.mapRecord(created);
  }

  async list(query: SubmissionListQuery): Promise<PaginatedSubmissions> {
    const where: Prisma.SubmissionWhereInput = {
      totalScore:
        query.minScore !== undefined || query.maxScore !== undefined
          ? {
              gte: query.minScore,
              lte: query.maxScore
            }
          : undefined,
      category: query.category ? categoryToPrisma[query.category] : undefined,
      purchaseTimeline: query.timeline ?? undefined,
      financePreference: query.financePreference ?? undefined
    };

    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
        where,
        include: {
          scoreBreakdown: true,
          behaviouralMetrics: true,
          metadata: true
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy:
          query.sortBy === "score"
            ? { totalScore: query.sortOrder }
            : { createdAt: query.sortOrder }
      })
    ]);

    return {
      items: items.map((item) => this.mapRecord(item)),
      totalItems
    };
  }

  async findById(id: string): Promise<SubmissionRecord | null> {
    const record = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        scoreBreakdown: true,
        behaviouralMetrics: true,
        metadata: true
      }
    });

    return record ? this.mapRecord(record) : null;
  }

  async ping(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private mapRecord(
    record: Prisma.SubmissionGetPayload<{
      include: {
        scoreBreakdown: true;
        behaviouralMetrics: true;
        metadata: true;
      };
    }>
  ): SubmissionRecord {
    const band = getIntentBandFromPrisma(record.category);

    return {
      id: record.id,
      industry: record.industry as SubmissionRecord["industry"],
      lead: {
        name: record.leadName ?? undefined,
        email: record.leadEmail ?? undefined,
        phone: record.leadPhone ?? undefined,
        city: record.leadCity ?? undefined
      },
      answers: (record.rawPayload as SubmissionRecord["rawPayload"]).answers,
      behaviouralMetrics: record.behaviouralMetrics
        ? {
            totalCompletionSeconds: record.behaviouralMetrics.totalCompletionSeconds ?? undefined,
            timePerStepSeconds:
              (record.behaviouralMetrics.timePerStepSeconds as Record<string, number>) ?? {},
            backtracks: record.behaviouralMetrics.backtracks ?? undefined,
            answerEdits: record.behaviouralMetrics.answerEdits ?? undefined,
            idlePauses: record.behaviouralMetrics.idlePauses ?? undefined,
            tabSwitches: record.behaviouralMetrics.tabSwitches ?? undefined,
            scrollDepthPercent: record.behaviouralMetrics.scrollDepthPercent ?? undefined,
            completionRatePercent: record.behaviouralMetrics.completionRatePercent ?? undefined
          }
        : { timePerStepSeconds: {} },
      metadata: record.metadata
        ? {
            source: record.metadata.source ?? undefined,
            campaign: record.metadata.campaign ?? undefined,
            formId: record.metadata.formId ?? undefined,
            sessionId: record.metadata.sessionId ?? undefined
          }
        : {},
      rawPayload: record.rawPayload as SubmissionRecord["rawPayload"],
      normalizedAnswers: record.normalizedAnswers as Record<string, unknown>,
      totalScore: record.totalScore,
      category: band.slug,
      breakdown: {
        behaviouralScore: record.scoreBreakdown?.behaviouralScore ?? 0,
        interactionScore: record.scoreBreakdown?.interactionScore ?? 0,
        consistencyScore: record.scoreBreakdown?.consistencyScore ?? 0,
        economicScore: record.scoreBreakdown?.economicScore ?? 0
      },
      positives: (record.positives as string[]) ?? [],
      negatives: (record.negatives as string[]) ?? [],
      recommendedAction: record.recommendedAction,
      webhookEvent: record.webhookEvent as unknown as SubmissionRecord["webhookEvent"],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }
}
