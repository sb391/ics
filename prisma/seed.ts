import { PrismaClient } from "@prisma/client";

import { AUTO_MODEL_CONFIG, AUTO_SAMPLE_PAYLOAD } from "../src/modules/scoring/industries/auto/auto.constants";
import { InMemorySubmissionRepository } from "../src/modules/submissions/in-memory-submission.repository";
import { PrismaSubmissionRepository } from "../src/modules/submissions/prisma-submission.repository";
import { submissionPayloadSchema } from "../src/modules/submissions/submission.schemas";
import { SubmissionService } from "../src/modules/submissions/submission.service";

const prisma = new PrismaClient();

const demoPayloads = [
  AUTO_SAMPLE_PAYLOAD,
  {
    industry: "auto",
    lead: {
      name: "Riya Kapoor",
      email: "riya@example.com",
      city: "Pune"
    },
    answers: {
      budgetRange: "under_8_lakh",
      primaryPreference: "mileage",
      purchaseTimeline: "exploring",
      financePreference: "undecided",
      brandsComparing: ["maruti_suzuki", "hyundai"],
      salaryBand: "5_10_lakh"
    },
    behaviouralMetrics: {
      totalCompletionSeconds: 82,
      timePerStepSeconds: {
        budgetRange: 8,
        primaryPreference: 7,
        purchaseTimeline: 10
      },
      backtracks: 1,
      answerEdits: 1,
      idlePauses: 1,
      tabSwitches: 1,
      scrollDepthPercent: 74,
      completionRatePercent: 78
    },
    metadata: {
      source: "marketplace_widget",
      campaign: "warm_leads",
      formId: "lead_form_2",
      sessionId: "sess_456"
    }
  },
  {
    industry: "auto",
    lead: {
      name: "Dev Mehta",
      email: "dev@example.com",
      phone: "+919899991111",
      city: "Mumbai"
    },
    answers: {
      budgetRange: "20_plus_lakh",
      primaryPreference: "brand_prestige",
      purchaseTimeline: "immediate",
      financePreference: "no",
      brandsComparing: ["bmw", "audi"],
      downPaymentBand: "30_plus_percent",
      tradeInAvailable: true,
      salaryBand: "35_plus_lakh"
    },
    behaviouralMetrics: {
      totalCompletionSeconds: 211,
      timePerStepSeconds: {
        budgetRange: 18,
        primaryPreference: 15,
        purchaseTimeline: 16,
        financePreference: 12,
        brandsComparing: 25
      },
      backtracks: 2,
      answerEdits: 2,
      idlePauses: 0,
      tabSwitches: 0,
      scrollDepthPercent: 95,
      completionRatePercent: 100
    },
    metadata: {
      source: "dealer_website",
      campaign: "luxury_march",
      formId: "lead_form_3",
      sessionId: "sess_789"
    }
  }
];

async function main() {
  await prisma.industryModel.upsert({
    where: { slug: "auto" },
    update: {
      displayName: AUTO_MODEL_CONFIG.displayName,
      version: AUTO_MODEL_CONFIG.version,
      supportedQuestions: AUTO_MODEL_CONFIG.supportedQuestions,
      scoreBands: AUTO_MODEL_CONFIG.scoreBands,
      config: AUTO_MODEL_CONFIG.metadata
    },
    create: {
      slug: "auto",
      displayName: AUTO_MODEL_CONFIG.displayName,
      version: AUTO_MODEL_CONFIG.version,
      supportedQuestions: AUTO_MODEL_CONFIG.supportedQuestions,
      scoreBands: AUTO_MODEL_CONFIG.scoreBands,
      config: AUTO_MODEL_CONFIG.metadata
    }
  });

  await prisma.behaviouralMetrics.deleteMany();
  await prisma.scoreBreakdown.deleteMany();
  await prisma.leadMetadata.deleteMany();
  await prisma.submission.deleteMany();

  const submissionService = new SubmissionService(new PrismaSubmissionRepository(prisma));

  for (const payload of demoPayloads) {
    await submissionService.createSubmission(submissionPayloadSchema.parse(payload));
  }

  const previewService = new SubmissionService(new InMemorySubmissionRepository());
  const preview = previewService.scorePayload(submissionPayloadSchema.parse(AUTO_SAMPLE_PAYLOAD));
  console.log("Seeded auto model and demo submissions.");
  console.log(`Preview score: ${preview.totalScore} (${preview.category})`);
}

main()
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
