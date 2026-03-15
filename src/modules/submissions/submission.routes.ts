import { Router, type RequestHandler } from "express";

import { parseWithSchema } from "../../lib/http";
import { submissionListQuerySchema, submissionOutcomeSchema, submissionPayloadSchema } from "./submission.schemas";
import { SubmissionService } from "./submission.service";

export function createSubmissionHandlers(submissionService: SubmissionService): Record<string, RequestHandler> {
  return {
    score(request, response, next) {
      try {
        const payload = parseWithSchema(submissionPayloadSchema, request.body, "INVALID_SCORE_PAYLOAD");
        const result = submissionService.scorePayload(payload);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async create(request, response, next) {
      try {
        const payload = parseWithSchema(
          submissionPayloadSchema,
          request.body,
          "INVALID_SUBMISSION_PAYLOAD"
        );
        const created = await submissionService.createSubmission(payload);
        response.status(201).json(created);
      } catch (error) {
        next(error);
      }
    },

    async list(request, response, next) {
      try {
        const query = parseWithSchema(
          submissionListQuerySchema,
          request.query,
          "INVALID_SUBMISSION_FILTERS"
        );
        const result = await submissionService.listSubmissions(query);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async getById(request, response, next) {
      try {
        const submissionId = Array.isArray(request.params.id)
          ? request.params.id[0]
          : request.params.id;
        const result = await submissionService.getSubmissionById(submissionId);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async trackOutcome(request, response, next) {
      try {
        const submissionId = Array.isArray(request.params.id)
          ? request.params.id[0]
          : request.params.id;
        const payload = parseWithSchema(
          submissionOutcomeSchema,
          request.body,
          "INVALID_OUTCOME_PAYLOAD"
        );
        const result = await submissionService.trackOutcome(submissionId, {
          ...payload,
          happenedAt: payload.happenedAt ?? new Date().toISOString()
        });
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  };
}

export function createSubmissionRouter(submissionService: SubmissionService) {
  const router = Router();
  const handlers = createSubmissionHandlers(submissionService);

  router.post("/score", handlers.score);
  router.post("/submissions", handlers.create);
  router.get("/submissions", handlers.list);
  router.get("/submissions/:id", handlers.getById);
  router.post("/submissions/:id/outcomes", handlers.trackOutcome);

  return router;
}
