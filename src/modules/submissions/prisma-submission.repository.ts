import { Prisma, PrismaClient } from "@prisma/client";

import { AUTO_PREDICTION_NOTE } from "../scoring/industries/auto/auto.constants";
import type {
  PredictionContext,
  RuleContribution as ScoreRuleContribution,
  ScoreLayer
} from "../scoring/scoring.types";
import { getIntentBandFromPrisma, type IntentCategorySlug } from "../scoring/scoring.types";
import type { SubmissionRepository } from "./submission.repository";
import type {
  CreateOutcomeEventInput,
  CreateSubmissionRecordInput,
  DealerMatchStatus,
  OutcomeStatus,
  PaginatedSubmissions,
  RoutingStatus,
  SubmissionListQuery,
  SubmissionRecord
} from "./submission.types";

const categoryToPrisma: Record<
  IntentCategorySlug,
  "CASUAL_BROWSER" | "EARLY_INTEREST" | "CONSIDERATION_STAGE" | "SERIOUS_BUYER" | "HIGH_INTENT_BUYER"
> = {
  casual_browser: "CASUAL_BROWSER",
  early_interest: "EARLY_INTEREST",
  consideration_stage: "CONSIDERATION_STAGE",
  serious_buyer: "SERIOUS_BUYER",
  high_intent_buyer: "HIGH_INTENT_BUYER"
};

const outcomeToPrisma: Record<
  OutcomeStatus,
  "CONTACTED" | "QUALIFIED" | "VISIT_BOOKED" | "FINANCE_APPLIED" | "CONVERTED" | "REJECTED" | "JUNK"
> = {
  contacted: "CONTACTED",
  qualified: "QUALIFIED",
  visit_booked: "VISIT_BOOKED",
  finance_applied: "FINANCE_APPLIED",
  converted: "CONVERTED",
  rejected: "REJECTED",
  junk: "JUNK"
};

const prismaToOutcome: Record<
  "CONTACTED" | "QUALIFIED" | "VISIT_BOOKED" | "FINANCE_APPLIED" | "CONVERTED" | "REJECTED" | "JUNK",
  OutcomeStatus
> = {
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  VISIT_BOOKED: "visit_booked",
  FINANCE_APPLIED: "finance_applied",
  CONVERTED: "converted",
  REJECTED: "rejected",
  JUNK: "junk"
};

const dealerMatchToPrisma: Record<DealerMatchStatus, "PENDING" | "MATCHED" | "UNMATCHED" | "MANUAL_REVIEW"> = {
  pending: "PENDING",
  matched: "MATCHED",
  unmatched: "UNMATCHED",
  manual_review: "MANUAL_REVIEW"
};

const prismaToDealerMatch: Record<
  "PENDING" | "MATCHED" | "UNMATCHED" | "MANUAL_REVIEW",
  NonNullable<SubmissionRecord["routing"]>["dealerMatchStatus"]
> = {
  PENDING: "pending",
  MATCHED: "matched",
  UNMATCHED: "unmatched",
  MANUAL_REVIEW: "manual_review"
};

const routingStatusToPrisma: Record<RoutingStatus, "CAPTURED" | "READY_FOR_ASSIGNMENT" | "ASSIGNED"> = {
  captured: "CAPTURED",
  ready_for_assignment: "READY_FOR_ASSIGNMENT",
  assigned: "ASSIGNED"
};

const prismaToRoutingStatus: Record<
  "CAPTURED" | "READY_FOR_ASSIGNMENT" | "ASSIGNED",
  NonNullable<SubmissionRecord["routing"]>["routingStatus"]
> = {
  CAPTURED: "captured",
  READY_FOR_ASSIGNMENT: "ready_for_assignment",
  ASSIGNED: "assigned"
};

const TERMINAL_PRISMA_OUTCOMES = ["CONVERTED", "REJECTED", "JUNK"] as const;

const layerToPrisma: Record<ScoreLayer, "BEHAVIOURAL" | "INTERACTION" | "DEMAND" | "CONSISTENCY" | "READINESS"> = {
  behavioural: "BEHAVIOURAL",
  interaction: "INTERACTION",
  demand: "DEMAND",
  consistency: "CONSISTENCY",
  readiness: "READINESS"
};

const prismaToLayer: Record<
  "BEHAVIOURAL" | "INTERACTION" | "DEMAND" | "CONSISTENCY" | "READINESS",
  ScoreLayer
> = {
  BEHAVIOURAL: "behavioural",
  INTERACTION: "interaction",
  DEMAND: "demand",
  CONSISTENCY: "consistency",
  READINESS: "readiness"
};

const includeRelations = {
  scoreBreakdown: true,
  behaviouralMetrics: true,
  metadata: true,
  routingProfile: true,
  consentRecord: true,
  ruleContributions: {
    orderBy: {
      sequence: "asc" as const
    }
  },
  outcomes: {
    orderBy: {
      happenedAt: "asc" as const
    }
  }
} satisfies Prisma.SubmissionInclude;

type SubmissionWithRelations = Prisma.SubmissionGetPayload<{
  include: typeof includeRelations;
}>;

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateSubmissionRecordInput): Promise<SubmissionRecord> {
    const data: Prisma.SubmissionCreateInput = {
      id: input.id,
      industry: input.industry,
      financePreference: input.answers.financePreference,
      purchaseTimeline: input.answers.purchaseTimeline,
      purchaseReason: input.answers.purchaseReason,
      testDriveReadiness: input.answers.testDriveReadiness,
      scoreVersion: input.scoreVersion,
      weightVersion: input.weightVersion,
      ruleSetVersion: input.ruleSetVersion,
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
          demandScore: input.breakdown.demandScore,
          consistencyScore: input.breakdown.consistencyScore,
          readinessScore: input.breakdown.readinessScore
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
          sessionId: input.metadata.sessionId,
          channel: input.metadata.channel,
          sdkVersion: input.metadata.sdkVersion
        }
      },
      routingProfile: input.routing
        ? {
            create: {
              pincode: input.routing.pincode,
              city: input.routing.city,
              locality: input.routing.locality,
              addressLine: input.routing.addressLine,
              assignedDealerId: input.routing.assignedDealerId,
              matchedDealerName: input.routing.matchedDealerName,
              dealerMatchStatus: dealerMatchToPrisma[input.routing.dealerMatchStatus],
              routingStatus: routingStatusToPrisma[input.routing.routingStatus],
              matchedAt: input.routing.matchedAt ? new Date(input.routing.matchedAt) : null
            }
          }
        : undefined,
      consentRecord: input.consent
        ? {
            create: {
              dealerContactConsent: input.consent.dealerContactConsent,
              consentedAt: new Date(input.consent.consentedAt),
              privacyNoticeVersion: input.consent.privacyNoticeVersion,
              consentSource: input.consent.consentSource
            }
          }
        : undefined,
      ruleContributions: {
        create: input.ruleContributions.map((contribution, index) => ({
          sequence: index,
          ruleCode: contribution.ruleCode,
          layer: layerToPrisma[contribution.layer],
          direction: contribution.direction === "positive" ? "POSITIVE" : "NEGATIVE",
          points: contribution.points,
          reason: contribution.reason,
          signalCategories: contribution.signalCategories
        }))
      }
    };

    const created = await this.prisma.submission.create({
      data,
      include: includeRelations
    });

    return this.mapRecord(created);
  }

  async list(query: SubmissionListQuery): Promise<PaginatedSubmissions> {
    const conditions: Prisma.SubmissionWhereInput[] = [
      {
        totalScore:
          query.minScore !== undefined || query.maxScore !== undefined
            ? {
                gte: query.minScore,
                lte: query.maxScore
              }
            : undefined,
        category: query.category ? categoryToPrisma[query.category] : undefined,
        purchaseTimeline: query.timeline ?? undefined,
        financePreference: query.financePreference ?? undefined,
        currentOutcomeStatus: query.outcomeStatus ? outcomeToPrisma[query.outcomeStatus] : undefined
      }
    ];

    if (query.reviewState === "open") {
      conditions.push({
        OR: [
          {
            currentOutcomeStatus: null
          },
          {
            currentOutcomeStatus: {
              notIn: [...TERMINAL_PRISMA_OUTCOMES]
            }
          }
        ]
      });
    }

    if (query.reviewState === "closed") {
      conditions.push({
        currentOutcomeStatus: {
          in: [...TERMINAL_PRISMA_OUTCOMES]
        }
      });
    }

    const where: Prisma.SubmissionWhereInput =
      conditions.length === 1
        ? conditions[0]
        : {
            AND: conditions
          };

    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
        where,
        include: includeRelations,
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
      include: includeRelations
    });

    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<SubmissionRecord[]> {
    const items = await this.prisma.submission.findMany({
      include: includeRelations,
      orderBy: {
        createdAt: "desc"
      }
    });

    return items.map((item) => this.mapRecord(item));
  }

  async appendOutcome(submissionId: string, input: CreateOutcomeEventInput): Promise<SubmissionRecord | null> {
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        currentOutcomeStatus: outcomeToPrisma[input.status],
        outcomeUpdatedAt: new Date(input.happenedAt),
        outcomes: {
          create: {
            status: outcomeToPrisma[input.status],
            note: input.note,
            source: input.source,
            happenedAt: new Date(input.happenedAt)
          }
        }
      },
      include: includeRelations
    }).catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    });

    return updated ? this.mapRecord(updated) : null;
  }

  async ping(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private mapRuleContribution(
    contribution: {
      ruleCode: string;
      layer: "BEHAVIOURAL" | "INTERACTION" | "DEMAND" | "CONSISTENCY" | "READINESS";
      direction: "POSITIVE" | "NEGATIVE";
      points: number;
      reason: string;
      signalCategories: string[];
    }
  ): ScoreRuleContribution {
    return {
      ruleCode: contribution.ruleCode,
      layer: prismaToLayer[contribution.layer],
      direction: contribution.direction === "POSITIVE" ? "positive" : "negative",
      points: contribution.points,
      reason: contribution.reason,
      signalCategories: contribution.signalCategories as ScoreRuleContribution["signalCategories"]
    };
  }

  private mapPredictionContext(
    rawPayload: SubmissionRecord["rawPayload"],
    scoreVersion: string,
    weightVersion: string,
    ruleSetVersion: string
  ): PredictionContext {
    const predictionContext =
      (
        (rawPayload as {
          predictionContext?: PredictionContext;
        }).predictionContext
      ) ?? null;

    return (
      predictionContext ?? {
        posture: "prediction_under_validation",
        note: `${AUTO_PREDICTION_NOTE} (${scoreVersion}, ${weightVersion}, ${ruleSetVersion})`
      }
    );
  }

  private mapRecord(
    record: SubmissionWithRelations
  ): SubmissionRecord {
    const band = getIntentBandFromPrisma(record.category);
    const rawPayload = record.rawPayload as SubmissionRecord["rawPayload"];

    return {
      id: record.id,
      industry: record.industry as SubmissionRecord["industry"],
      answers: rawPayload.answers,
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
            sessionId: record.metadata.sessionId ?? undefined,
            channel:
              (record.metadata.channel as SubmissionRecord["metadata"]["channel"] | null) ?? undefined,
            sdkVersion: record.metadata.sdkVersion ?? undefined
          }
        : {},
      routing: record.routingProfile
        ? {
            pincode: record.routingProfile.pincode,
            city: record.routingProfile.city,
            locality: record.routingProfile.locality,
            addressLine: record.routingProfile.addressLine ?? null,
            assignedDealerId: record.routingProfile.assignedDealerId ?? null,
            matchedDealerName: record.routingProfile.matchedDealerName ?? null,
            dealerMatchStatus: prismaToDealerMatch[record.routingProfile.dealerMatchStatus],
            routingStatus: prismaToRoutingStatus[record.routingProfile.routingStatus],
            matchedAt: record.routingProfile.matchedAt?.toISOString() ?? null
          }
        : null,
      consent: record.consentRecord
        ? {
            dealerContactConsent: record.consentRecord.dealerContactConsent,
            consentedAt: record.consentRecord.consentedAt.toISOString(),
            privacyNoticeVersion: record.consentRecord.privacyNoticeVersion ?? undefined,
            consentSource: record.consentRecord.consentSource ?? undefined
          }
        : null,
      rawPayload,
      normalizedAnswers: record.normalizedAnswers as Record<string, unknown>,
      totalScore: record.totalScore,
      category: band.slug,
      breakdown: {
        behaviouralScore: record.scoreBreakdown?.behaviouralScore ?? 0,
        interactionScore: record.scoreBreakdown?.interactionScore ?? 0,
        demandScore: record.scoreBreakdown?.demandScore ?? 0,
        consistencyScore: record.scoreBreakdown?.consistencyScore ?? 0,
        readinessScore: record.scoreBreakdown?.readinessScore ?? 0
      },
      positives: (record.positives as string[]) ?? [],
      negatives: (record.negatives as string[]) ?? [],
      recommendedAction: record.recommendedAction,
      ruleContributions: record.ruleContributions.map((contribution) => this.mapRuleContribution(contribution)),
      scoreVersion: record.scoreVersion,
      weightVersion: record.weightVersion,
      ruleSetVersion: record.ruleSetVersion,
      predictionContext: this.mapPredictionContext(
        rawPayload,
        record.scoreVersion,
        record.weightVersion,
        record.ruleSetVersion
      ),
      outcomes: record.outcomes.map((outcome) => ({
        id: outcome.id,
        status: prismaToOutcome[outcome.status],
        note: outcome.note ?? undefined,
        source: outcome.source ?? undefined,
        happenedAt: outcome.happenedAt.toISOString(),
        createdAt: outcome.createdAt.toISOString()
      })),
      currentOutcomeStatus: record.currentOutcomeStatus ? prismaToOutcome[record.currentOutcomeStatus] : null,
      webhookEvent: record.webhookEvent as unknown as SubmissionRecord["webhookEvent"],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }
}
