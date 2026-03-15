import express, { type NextFunction, type Request, type Response } from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { logger } from "./config/logger";
import { buildOpenApiDocument } from "./docs/openapi";
import { AppError } from "./lib/errors";
import { buildErrorBody } from "./lib/http";
import { createConfigRouter } from "./modules/config/config.routes";
import { createHealthRouter } from "./modules/health/health.routes";
import type { SubmissionRepository } from "./modules/submissions/submission.repository";
import { SubmissionService } from "./modules/submissions/submission.service";
import { createSubmissionRouter } from "./modules/submissions/submission.routes";

export interface AppDependencies {
  submissionRepository: SubmissionRepository;
}

export function createApp({ submissionRepository }: AppDependencies) {
  const app = express();
  const submissionService = new SubmissionService(submissionRepository);
  const openApiDocument = buildOpenApiDocument();

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

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api/v1", createHealthRouter(() => submissionService.ping()));
  app.use("/api/v1", createConfigRouter());
  app.use("/api/v1", createSubmissionRouter(submissionService));

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
