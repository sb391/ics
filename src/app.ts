import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { logger } from "./config/logger";
import { buildOpenApiDocument } from "./docs/openapi";
import { AppError } from "./lib/errors";
import { buildErrorBody } from "./lib/http";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes";
import type { AnalyticsSnapshotRepository } from "./modules/analytics/analytics-snapshot.repository";
import { AnalyticsService } from "./modules/analytics/analytics.service";
import { createConfigRouter } from "./modules/config/config.routes";
import { createConsumerRouter } from "./modules/consumer/consumer.routes";
import { createHealthRouter } from "./modules/health/health.routes";
import type { SubmissionRepository } from "./modules/submissions/submission.repository";
import { SubmissionService } from "./modules/submissions/submission.service";
import { createSubmissionRouter } from "./modules/submissions/submission.routes";

export interface AppDependencies {
  submissionRepository: SubmissionRepository;
  analyticsSnapshotRepository: AnalyticsSnapshotRepository;
}

export function createApp({ submissionRepository, analyticsSnapshotRepository }: AppDependencies) {
  const app = express();
  const submissionService = new SubmissionService(submissionRepository);
  const analyticsService = new AnalyticsService(submissionService, analyticsSnapshotRepository);
  const openApiDocument = buildOpenApiDocument();
  const publicDir = path.resolve(process.cwd(), "public");
  const labDir = path.join(publicDir, "lab");
  const reviewDir = path.join(publicDir, "review");

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      logger
    })
  );

  app.get("/docs/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });

  app.get("/", (_request, response) => {
    response.redirect("/review");
  });

  app.get("/lab", (_request, response) => {
    response.sendFile(path.join(labDir, "index.html"));
  });

  app.get("/review", (_request, response) => {
    response.sendFile(path.join(reviewDir, "index.html"));
  });

  app.use("/lab", express.static(labDir));
  app.use("/review", express.static(reviewDir));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api/v1", createHealthRouter(() => submissionService.ping()));
  app.use("/api/v1", createConfigRouter());
  app.use("/api/v1", createConsumerRouter(submissionService));
  app.use("/api/v1", createSubmissionRouter(submissionService));
  app.use("/api/v1", createAnalyticsRouter(analyticsService));

  app.use((_request, _response, next) => {
    next(new AppError(404, "NOT_FOUND", "Route not found"));
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      const appError = new AppError(400, "INVALID_JSON", "Malformed JSON request body");
      response.status(appError.statusCode).json(buildErrorBody(appError));
      return;
    }

    if (error instanceof AppError) {
      response.status(error.statusCode).json(buildErrorBody(error));
      return;
    }

    logger.error({ error }, "Unhandled application error");
    const appError = new AppError(500, "INTERNAL_SERVER_ERROR", "Something went wrong");
    response.status(appError.statusCode).json(buildErrorBody(appError));
  });

  return app;
}
