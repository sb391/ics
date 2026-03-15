import type { NextFunction, Request, RequestHandler, Response } from "express";
import { describe, expect, it } from "vitest";

import { AppError } from "../../src/lib/errors";
import { createAnalyticsHandlers } from "../../src/modules/analytics/analytics.routes";
import { InMemoryAnalyticsSnapshotRepository } from "../../src/modules/analytics/in-memory-analytics-snapshot.repository";
import { AnalyticsService } from "../../src/modules/analytics/analytics.service";
import { createAutoConfigHandler } from "../../src/modules/config/config.routes";
import { createConsumerHandlers } from "../../src/modules/consumer/consumer.routes";
import { createHealthHandler } from "../../src/modules/health/health.routes";
import { AUTO_SAMPLE_PAYLOAD } from "../../src/modules/scoring/industries/auto/auto.constants";
import { InMemorySubmissionRepository } from "../../src/modules/submissions/in-memory-submission.repository";
import { createSubmissionHandlers } from "../../src/modules/submissions/submission.routes";
import { SubmissionService } from "../../src/modules/submissions/submission.service";

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
}

async function invokeHandler(
  handler: RequestHandler,
  options: {
    body?: unknown;
    query?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
) {
  const request = {
    body: options.body,
    query: options.query ?? {},
    params: options.params ?? {}
  } as Request;
  const response = createMockResponse() as Response & ReturnType<typeof createMockResponse>;
  let nextError: unknown;

  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  await Promise.resolve(handler(request, response, next));

  if (nextError) {
    throw nextError;
  }

  return response;
}

describe("ICS API handlers", () => {
  it("scores a payload without persisting it", async () => {
    const submissionService = new SubmissionService(new InMemorySubmissionRepository());
    const handlers = createSubmissionHandlers(submissionService);

    const response = await invokeHandler(handlers.score, {
      body: AUTO_SAMPLE_PAYLOAD
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("submissionId");
    expect((response.body as { totalScore: number }).totalScore).toBeGreaterThan(0);
    expect((response.body as { breakdown: { demandScore: number; readinessScore: number } }).breakdown).toMatchObject({
      demandScore: expect.any(Number),
      readinessScore: expect.any(Number)
    });
    expect((response.body as { ruleContributions: unknown[] }).ruleContributions.length).toBeGreaterThan(0);
    expect((response.body as { scoreVersion: string }).scoreVersion).toBe("ics-auto-score-2026.03.15");
    expect((response.body as { normalizedAnswers: Record<string, unknown> }).normalizedAnswers).toHaveProperty(
      "demandClarity"
    );
  });

  it("stores, tracks outcomes, retrieves explainability, and produces validation analytics", async () => {
    const repository = new InMemorySubmissionRepository();
    const submissionService = new SubmissionService(repository);
    const handlers = createSubmissionHandlers(submissionService);
    const analyticsHandlers = createAnalyticsHandlers(
      new AnalyticsService(submissionService, new InMemoryAnalyticsSnapshotRepository())
    );

    const createdResponse = await invokeHandler(handlers.create, {
      body: AUTO_SAMPLE_PAYLOAD
    });
    const submissionId = (createdResponse.body as { submissionId: string }).submissionId;

    const outcomeResponse = await invokeHandler(handlers.trackOutcome, {
      params: {
        id: submissionId
      },
      body: {
        status: "contacted",
        source: "manual_review"
      }
    });

    await invokeHandler(handlers.trackOutcome, {
      params: {
        id: submissionId
      },
      body: {
        status: "converted",
        source: "manual_review"
      }
    });

    const listResponse = await invokeHandler(handlers.list, {
      query: {
        reviewState: "closed",
        outcomeStatus: "converted",
        sortBy: "score",
        sortOrder: "desc"
      }
    });
    const detailResponse = await invokeHandler(handlers.getById, {
      params: {
        id: submissionId
      }
    });
    const configResponse = await invokeHandler(createAutoConfigHandler());
    const healthResponse = await invokeHandler(createHealthHandler(async () => true));
    const analyticsResponse = await invokeHandler(analyticsHandlers.validation);
    const savedSnapshotResponse = await invokeHandler(analyticsHandlers.saveSnapshot, {
      body: {
        snapshotDate: "2026-03-15"
      }
    });
    const snapshotsResponse = await invokeHandler(analyticsHandlers.listSnapshots);
    const snapshotId = (savedSnapshotResponse.body as { id: string }).id;
    const snapshotDetailResponse = await invokeHandler(analyticsHandlers.getSnapshot, {
      params: {
        id: snapshotId
      }
    });

    expect(createdResponse.statusCode).toBe(201);
    expect(outcomeResponse.statusCode).toBe(200);
    expect(listResponse.statusCode).toBe(200);
    expect(detailResponse.statusCode).toBe(200);
    expect(configResponse.statusCode).toBe(200);
    expect(healthResponse.statusCode).toBe(200);
    expect(analyticsResponse.statusCode).toBe(200);
    expect(savedSnapshotResponse.statusCode).toBe(201);
    expect(snapshotsResponse.statusCode).toBe(200);
    expect(snapshotDetailResponse.statusCode).toBe(200);

    expect((detailResponse.body as { rawPayload: typeof AUTO_SAMPLE_PAYLOAD }).rawPayload.answers.budgetRange).toBe(
      "12_20_lakh"
    );
    expect((detailResponse.body as { rawPayload: { lead?: unknown } }).rawPayload.lead).toBeUndefined();
    expect(
      (detailResponse.body as { outcomeSummary: { latestStatus: string } }).outcomeSummary.latestStatus
    ).toBe("converted");
    expect((detailResponse.body as { outcomes: unknown[] }).outcomes).toHaveLength(2);
    expect((detailResponse.body as { ruleContributions: unknown[] }).ruleContributions.length).toBeGreaterThan(0);
    expect((detailResponse.body as { scoreVersion: string }).scoreVersion).toBe("ics-auto-score-2026.03.15");
    expect((detailResponse.body as { webhookEvent: { eventType: string } }).webhookEvent.eventType).toBe(
      "ics.submission.scored"
    );
    expect(
      (listResponse.body as { data: Array<{ currentOutcomeStatus: string }> }).data[0].currentOutcomeStatus
    ).toBe("converted");
    expect(
      (listResponse.body as { data: Array<{ purchaseReason: string; bodyStyle: string }> }).data[0]
    ).toMatchObject({
      purchaseReason: expect.any(String),
      bodyStyle: expect.any(String)
    });
    expect(
      Array.isArray((listResponse.body as { data: unknown[] }).data)
    ).toBe(true);
    expect(
      (analyticsResponse.body as { conversionRateByBand: Array<{ bandSlug: string; totalSubmissions: number }> })
        .conversionRateByBand
    ).toEqual(expect.arrayContaining([expect.objectContaining({ bandSlug: "high_intent_buyer" })]));
    expect(
      (analyticsResponse.body as { averageScoreComparison: { converted: number | null } }).averageScoreComparison
        .converted
    ).toBeGreaterThan(0);
    expect(
      Array.isArray((analyticsResponse.body as { topPerformingRules: unknown[] }).topPerformingRules)
    ).toBe(true);
    expect(
      (savedSnapshotResponse.body as { snapshotDate: string; payload: { dataset: { totalSubmissions: number } } })
        .snapshotDate
    ).toBe("2026-03-15");
    expect(
      (snapshotDetailResponse.body as { payload: { dataset: { totalSubmissions: number } } }).payload.dataset
        .totalSubmissions
    ).toBe(1);
    expect(
      (snapshotsResponse.body as { data: Array<{ snapshotDate: string }> }).data[0].snapshotDate
    ).toBe("2026-03-15");
    expect((configResponse.body as { slug: string }).slug).toBe("auto");
    expect((healthResponse.body as { status: string }).status).toBe("ok");
  });

  it("creates and retrieves a consumer demand with routing and consent", async () => {
    const repository = new InMemorySubmissionRepository();
    const submissionService = new SubmissionService(repository);
    const handlers = createConsumerHandlers(submissionService);

    const consumerPayload = {
      ...AUTO_SAMPLE_PAYLOAD,
      routing: {
        pincode: "560001",
        city: "Bengaluru",
        locality: "Ashok Nagar",
        addressLine: "MG Road"
      },
      consent: {
        dealerContactConsent: true,
        consentedAt: "2026-03-15T10:30:00.000Z",
        privacyNoticeVersion: "consumer-web-1.0",
        consentSource: "consumer_web"
      }
    };

    const createdResponse = await invokeHandler(handlers.createDemand, {
      body: consumerPayload
    });
    const submissionId = (createdResponse.body as { submissionId: string }).submissionId;

    const detailResponse = await invokeHandler(handlers.getDemand, {
      params: {
        id: submissionId
      }
    });

    expect(createdResponse.statusCode).toBe(201);
    expect(detailResponse.statusCode).toBe(200);
    expect((createdResponse.body as { demandId: string }).demandId).toMatch(/^sub_/);
    expect((createdResponse.body as { routingStatus: string }).routingStatus).toBe("ready_for_assignment");
    expect((createdResponse.body as { dealerMatchStatus: string }).dealerMatchStatus).toBe("matched");
    expect((detailResponse.body as { city: string }).city).toBe("Bengaluru");
    expect((detailResponse.body as { pincode: string }).pincode).toBe("560001");
  });

  it("returns structured validation errors through next()", async () => {
    const submissionService = new SubmissionService(new InMemorySubmissionRepository());
    const handlers = createSubmissionHandlers(submissionService);

    await expect(
      invokeHandler(handlers.score, {
        body: {
          industry: "auto",
          answers: {
            budgetRange: "invalid_value"
          },
          behaviouralMetrics: {
            timePerStepSeconds: {}
          },
          metadata: {
            sessionId: "sess_invalid"
          }
        }
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
