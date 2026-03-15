import { Router, type RequestHandler } from "express";

import { parseWithSchema } from "../../lib/http";
import { AnalyticsService } from "./analytics.service";
import { analyticsSnapshotCreateSchema } from "./analytics.schemas";

export function createAnalyticsHandlers(analyticsService: AnalyticsService): Record<string, RequestHandler> {
  return {
    async validation(_request, response, next) {
      try {
        const result = await analyticsService.getValidationAnalytics();
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async saveSnapshot(request, response, next) {
      try {
        const payload = parseWithSchema(
          analyticsSnapshotCreateSchema,
          request.body ?? {},
          "INVALID_ANALYTICS_SNAPSHOT_PAYLOAD"
        );
        const result = await analyticsService.saveValidationSnapshot(payload.snapshotDate);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    async listSnapshots(_request, response, next) {
      try {
        const result = await analyticsService.listValidationSnapshots();
        response.status(200).json({
          data: result
        });
      } catch (error) {
        next(error);
      }
    },

    async getSnapshot(request, response, next) {
      try {
        const snapshotId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
        const result = await analyticsService.getValidationSnapshot(snapshotId);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  };
}

export function createAnalyticsRouter(analyticsService: AnalyticsService) {
  const router = Router();
  const handlers = createAnalyticsHandlers(analyticsService);

  router.get("/analytics/validation", handlers.validation);
  router.post("/analytics/validation/snapshots", handlers.saveSnapshot);
  router.get("/analytics/validation/snapshots", handlers.listSnapshots);
  router.get("/analytics/validation/snapshots/:id", handlers.getSnapshot);

  return router;
}
