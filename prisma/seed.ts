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
    answers: {
      budgetRange: "under_8_lakh",
      primaryPreference: "mileage",
      purchaseTimeline: "90_days",
      financePreference: "yes",
      brandsComparing: ["maruti_suzuki", "hyundai"],
      downPaymentBand: "10_20_percent",
      salaryBand: "5_10_lakh",
      bodyStyle: "hatchback",
      fuelType: "cng",
      usagePattern: "city_commute",
      monthlyKmBand: "1000_2000",
      purchaseReason: "first_car",
      currentVehicleAgeBand: "none",
      decisionMaker: "family",
      variantClarity: "trim_shortlist",
      testDriveReadiness: "open",
      monthlyEmiComfortBand: "10k_20k"
    },
    behaviouralMetrics: {
      totalCompletionSeconds: 164,
      timePerStepSeconds: {
        budgetRange: 9,
        primaryPreference: 8,
        purchaseTimeline: 11,
        financePreference: 8,
        brandsComparing: 13,
        downPaymentBand: 9,
        salaryBand: 8,
        bodyStyle: 8,
        fuelType: 7,
        usagePattern: 10,
        monthlyKmBand: 6,
        purchaseReason: 7,
        currentVehicleAgeBand: 5,
        decisionMaker: 8,
        variantClarity: 10,
        testDriveReadiness: 8,
        monthlyEmiComfortBand: 7
      },
      backtracks: 1,
      answerEdits: 2,
      idlePauses: 1,
      tabSwitches: 1,
      scrollDepthPercent: 82,
      completionRatePercent: 95
    },
    metadata: {
      source: "marketplace_widget",
      campaign: "first_car_q2",
      formId: "lead_form_2",
      sessionId: "sess_456",
      channel: "mobile_web",
      sdkVersion: "seed-1"
    }
  },
  {
    industry: "auto",
    answers: {
      budgetRange: "20_plus_lakh",
      primaryPreference: "brand_prestige",
      purchaseTimeline: "immediate",
      financePreference: "no",
      brandsComparing: ["bmw", "mercedes_benz"],
      downPaymentBand: "30_plus_percent",
      tradeInAvailable: true,
      salaryBand: "35_plus_lakh",
      bodyStyle: "luxury_suv",
      fuelType: "hybrid",
      usagePattern: "business_use",
      monthlyKmBand: "1000_2000",
      purchaseReason: "upgrade",
      currentVehicleAgeBand: "4_7_years",
      decisionMaker: "self",
      variantClarity: "exact_variant",
      testDriveReadiness: "scheduled_soon",
      monthlyEmiComfortBand: "35k_plus"
    },
    behaviouralMetrics: {
      totalCompletionSeconds: 211,
      timePerStepSeconds: {
        budgetRange: 18,
        primaryPreference: 15,
        purchaseTimeline: 16,
        financePreference: 12,
        brandsComparing: 25,
        downPaymentBand: 14,
        tradeInAvailable: 6,
        salaryBand: 11,
        bodyStyle: 10,
        fuelType: 12,
        usagePattern: 11,
        monthlyKmBand: 8,
        purchaseReason: 9,
        currentVehicleAgeBand: 7,
        decisionMaker: 8,
        variantClarity: 12,
        testDriveReadiness: 10,
        monthlyEmiComfortBand: 9
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
      sessionId: "sess_789",
      channel: "web",
      sdkVersion: "seed-1"
    }
  },
  {
    industry: "auto",
    answers: {
      budgetRange: "12_20_lakh",
      primaryPreference: "safety",
      purchaseTimeline: "30_days",
      financePreference: "yes",
      brandsComparing: ["tata", "mahindra"],
      downPaymentBand: "20_30_percent",
      tradeInAvailable: true,
      salaryBand: "10_20_lakh",
      bodyStyle: "suv",
      fuelType: "diesel",
      usagePattern: "highway_travel",
      monthlyKmBand: "2000_plus",
      purchaseReason: "replacement",
      currentVehicleAgeBand: "8_plus_years",
      decisionMaker: "self_and_spouse",
      variantClarity: "trim_shortlist",
      testDriveReadiness: "scheduled_soon",
      monthlyEmiComfortBand: "20k_35k"
    },
    behaviouralMetrics: {
      totalCompletionSeconds: 243,
      timePerStepSeconds: {
        budgetRange: 13,
        primaryPreference: 10,
        purchaseTimeline: 13,
        financePreference: 10,
        brandsComparing: 18,
        downPaymentBand: 11,
        tradeInAvailable: 5,
        salaryBand: 9,
        bodyStyle: 8,
        fuelType: 9,
        usagePattern: 12,
        monthlyKmBand: 8,
        purchaseReason: 11,
        currentVehicleAgeBand: 8,
        decisionMaker: 10,
        variantClarity: 11,
        testDriveReadiness: 10,
        monthlyEmiComfortBand: 9
      },
      backtracks: 2,
      answerEdits: 4,
      idlePauses: 1,
      tabSwitches: 1,
      scrollDepthPercent: 93,
      completionRatePercent: 100
    },
    metadata: {
      source: "dealer_website",
      campaign: "replacement_push",
      formId: "lead_form_4",
      sessionId: "sess_901",
      channel: "dealer_widget",
      sdkVersion: "seed-1"
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
  await prisma.ruleContribution.deleteMany();
  await prisma.submissionOutcome.deleteMany();
  await prisma.scoreBreakdown.deleteMany();
  await prisma.leadMetadata.deleteMany();
  await prisma.submission.deleteMany();

  const submissionService = new SubmissionService(new PrismaSubmissionRepository(prisma));

  const createdSubmissions = [];

  for (const payload of demoPayloads) {
    const created = await submissionService.createSubmission(submissionPayloadSchema.parse(payload));
    createdSubmissions.push(created);
  }

  await submissionService.trackOutcome(createdSubmissions[0].submissionId, {
    status: "contacted",
    source: "seed",
    happenedAt: new Date("2026-03-16T10:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[0].submissionId, {
    status: "qualified",
    source: "seed",
    happenedAt: new Date("2026-03-16T14:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[0].submissionId, {
    status: "visit_booked",
    source: "seed",
    happenedAt: new Date("2026-03-17T09:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[0].submissionId, {
    status: "finance_applied",
    source: "seed",
    happenedAt: new Date("2026-03-18T12:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[0].submissionId, {
    status: "converted",
    source: "seed",
    happenedAt: new Date("2026-03-20T16:00:00.000Z").toISOString()
  });

  await submissionService.trackOutcome(createdSubmissions[1].submissionId, {
    status: "contacted",
    source: "seed",
    happenedAt: new Date("2026-03-16T11:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[1].submissionId, {
    status: "qualified",
    source: "seed",
    happenedAt: new Date("2026-03-17T13:00:00.000Z").toISOString()
  });

  await submissionService.trackOutcome(createdSubmissions[2].submissionId, {
    status: "contacted",
    source: "seed",
    happenedAt: new Date("2026-03-16T09:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[2].submissionId, {
    status: "qualified",
    source: "seed",
    happenedAt: new Date("2026-03-17T10:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[2].submissionId, {
    status: "visit_booked",
    source: "seed",
    happenedAt: new Date("2026-03-18T10:30:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[2].submissionId, {
    status: "converted",
    source: "seed",
    happenedAt: new Date("2026-03-21T15:00:00.000Z").toISOString()
  });

  await submissionService.trackOutcome(createdSubmissions[3].submissionId, {
    status: "contacted",
    source: "seed",
    happenedAt: new Date("2026-03-16T08:00:00.000Z").toISOString()
  });
  await submissionService.trackOutcome(createdSubmissions[3].submissionId, {
    status: "rejected",
    source: "seed",
    happenedAt: new Date("2026-03-16T18:00:00.000Z").toISOString()
  });

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
