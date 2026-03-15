import { PrismaClient } from "@prisma/client";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { PrismaSubmissionRepository } from "./modules/submissions/prisma-submission.repository";

async function bootstrap() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const app = createApp({
    submissionRepository: new PrismaSubmissionRepository(prisma)
  });

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        docsUrl: `http://localhost:${env.PORT}/docs`
      },
      "ICS API is listening"
    );
  });

  const shutdown = async () => {
    logger.info("Shutting down ICS API");
    server.close(async () => {
      await prisma.$disconnect();
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
