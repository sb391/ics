import { Router, type RequestHandler } from "express";

export function createHealthHandler(healthCheck: () => Promise<boolean>): RequestHandler {
  return async (_request, response) => {
    const databaseOk = await healthCheck();

    response.status(200).json({
      status: "ok",
      service: "ics-api",
      database: databaseOk ? "connected" : "degraded",
      timestamp: new Date().toISOString()
    });
  };
}

export function createHealthRouter(healthCheck: () => Promise<boolean>) {
  const router = Router();
  router.get("/health", createHealthHandler(healthCheck));
  return router;
}
