import { Router, type RequestHandler } from "express";

import { parseWithSchema } from "../../lib/http";
import { SubmissionService } from "../submissions/submission.service";
import { consumerDemandPayloadSchema } from "./consumer.schemas";

export function createConsumerHandlers(submissionService: SubmissionService): Record<string, RequestHandler> {
  return {
    async createDemand(request, response, next) {
      try {
        const payload = parseWithSchema(
          consumerDemandPayloadSchema,
          request.body,
          "INVALID_CONSUMER_DEMAND_PAYLOAD"
        );
        const created = await submissionService.createConsumerDemand(payload);
        response.status(201).json(created);
      } catch (error) {
        next(error);
      }
    },

    async getDemand(request, response, next) {
      try {
        const submissionId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
        const detail = await submissionService.getConsumerDemandStatus(submissionId);
        response.status(200).json(detail);
      } catch (error) {
        next(error);
      }
    }
  };
}

export function createConsumerRouter(submissionService: SubmissionService) {
  const router = Router();
  const handlers = createConsumerHandlers(submissionService);

  router.post("/consumer/demands", handlers.createDemand);
  router.get("/consumer/demands/:id", handlers.getDemand);

  return router;
}
