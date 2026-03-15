import type { NextFunction, Request, RequestHandler, Response } from "express";
import { describe, expect, it } from "vitest";

import { AppError } from "../../src/lib/errors";
import { createAutoConfigHandler } from "../../src/modules/config/config.routes";
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
  });

  it("stores, filters, and retrieves submissions", async () => {
    const repository = new InMemorySubmissionRepository();
    const submissionService = new SubmissionService(repository);
    const handlers = createSubmissionHandlers(submissionService);

    const createdResponse = await invokeHandler(handlers.create, {
      body: AUTO_SAMPLE_PAYLOAD
    });
    const submissionId = (createdResponse.body as { submissionId: string }).submissionId;

    const listResponse = await invokeHandler(handlers.list, {
      query: {
        category: "serious_buyer",
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

    expect(createdResponse.statusCode).toBe(201);
    expect(listResponse.statusCode).toBe(200);
    expect(detailResponse.statusCode).toBe(200);
    expect(configResponse.statusCode).toBe(200);
    expect(healthResponse.statusCode).toBe(200);

    expect((detailResponse.body as { rawPayload: typeof AUTO_SAMPLE_PAYLOAD }).rawPayload.answers.budgetRange).toBe(
      "12_20_lakh"
    );
    expect((detailResponse.body as { webhookEvent: { eventType: string } }).webhookEvent.eventType).toBe(
      "ics.submission.scored"
    );
    expect(
      Array.isArray((listResponse.body as { data: unknown[] }).data)
    ).toBe(true);
    expect((configResponse.body as { slug: string }).slug).toBe("auto");
    expect((healthResponse.body as { status: string }).status).toBe("ok");
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
          }
        }
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
