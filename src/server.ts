import { PrismaClient } from "@prisma/client";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { InMemoryAnalyticsSnapshotRepository } from "./modules/analytics/in-memory-analytics-snapshot.repository";
import { PrismaAnalyticsSnapshotRepository } from "./modules/analytics/prisma-analytics-snapshot.repository";
import { InMemorySubmissionRepository } from "./modules/submissions/in-memory-submission.repository";
import { PrismaSubmissionRepository } from "./modules/submissions/prisma-submission.repository";
import type { SubmissionRepository } from "./modules/submissions/submission.repository";
import type { AnalyticsSnapshotRepository } from "./modules/analytics/analytics-snapshot.repository";

async function bootstrap() {
  let prisma: PrismaClient | null = null;
  let submissionRepository: SubmissionRepository;
  let analyticsSnapshotRepository: AnalyticsSnapshotRepository;

  if (env.STORAGE_MODE === "memory") {
    submissionRepository = new InMemorySubmissionRepository();
    analyticsSnapshotRepository = new InMemoryAnalyticsSnapshotRepository();
    logger.warn("Starting ICS API in memory mode");
  } else {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL!
        }
      }
    });
    await prisma.$connect();
    submissionRepository = new PrismaSubmissionRepository(prisma);
    analyticsSnapshotRepository = new PrismaAnalyticsSnapshotRepository(prisma);
  }

  const app = createApp({
    submissionRepository,
    analyticsSnapshotRepository
  });

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        storageMode: env.STORAGE_MODE,
        docsUrl: `http://localhost:${env.PORT}/docs`
      },
      "ICS API is listening"
    );
  });

  const shutdown = async () => {
    logger.info("Shutting down ICS API");
    server.close(async () => {
      if (prisma) {
        await prisma.$disconnect();
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to bootstrap server");
  process.exit(1);
});
