import { z } from "zod";

import {
  AUTO_STEP_KEYS,
  autoBodyStyles,
  autoBrands,
  autoBudgetRanges,
  autoCurrentVehicleAgeBands,
  autoDecisionMakers,
  autoDownPaymentBands,
  autoFinancePreferences,
  autoFuelTypes,
  autoBudgetFlexibilities,
  autoMonthlyEmiComfortBands,
  autoMonthlyKmBands,
  autoPrimaryPreferences,
  autoPurchaseReasons,
  autoPurchaseTimelines,
  autoSalaryBands,
  autoShowroomVisitStatuses,
  autoTestDriveReadinessLevels,
  autoUsagePatterns,
  autoVariantClarityLevels
} from "./industries/auto/auto.constants";

const optionalString = (maxLength: number) => z.string().trim().min(1).max(maxLength).optional();

const stepTimingShape = Object.fromEntries(
  AUTO_STEP_KEYS.map((key) => [key, z.number().int().positive().max(600).optional()])
) as Record<(typeof AUTO_STEP_KEYS)[number], z.ZodOptional<z.ZodNumber>>;

const stepTimingSecondsSchema = z
  .object(stepTimingShape)
  .catchall(z.number().int().positive().max(600))
  .default({});

export const answersSchema = z
  .object({
    budgetRange: z.enum(autoBudgetRanges).optional(),
    primaryPreference: z.enum(autoPrimaryPreferences).optional(),
    purchaseTimeline: z.enum(autoPurchaseTimelines).optional(),
    financePreference: z.enum(autoFinancePreferences).optional(),
    brandsComparing: z
      .array(z.enum(autoBrands))
      .min(1)
      .max(5)
      .refine((values) => new Set(values).size === values.length, {
        message: "brandsComparing cannot contain duplicates"
      })
      .optional(),
    downPaymentBand: z.enum(autoDownPaymentBands).optional(),
    tradeInAvailable: z.boolean().optional(),
    salaryBand: z.enum(autoSalaryBands).optional(),
    bodyStyle: z.enum(autoBodyStyles).optional(),
    fuelType: z.enum(autoFuelTypes).optional(),
    usagePattern: z.enum(autoUsagePatterns).optional(),
    monthlyKmBand: z.enum(autoMonthlyKmBands).optional(),
    purchaseReason: z.enum(autoPurchaseReasons).optional(),
    currentVehicleAgeBand: z.enum(autoCurrentVehicleAgeBands).optional(),
    decisionMaker: z.enum(autoDecisionMakers).optional(),
    variantClarity: z.enum(autoVariantClarityLevels).optional(),
    testDriveReadiness: z.enum(autoTestDriveReadinessLevels).optional(),
    monthlyEmiComfortBand: z.enum(autoMonthlyEmiComfortBands).optional(),
    showroomVisitStatus: z.enum(autoShowroomVisitStatuses).optional(),
    timelineConfidencePercent: z.number().int().min(0).max(100).optional(),
    budgetFlexibility: z.enum(autoBudgetFlexibilities).optional(),
    openToBudgetIncrease: z.boolean().optional()
  })
  .strict();

export const behaviouralMetricsSchema = z
  .object({
    totalCompletionSeconds: z.number().int().positive().max(3600).optional(),
    timePerStepSeconds: stepTimingSecondsSchema,
    backtracks: z.number().int().nonnegative().max(30).optional(),
    answerEdits: z.number().int().nonnegative().max(40).optional(),
    idlePauses: z.number().int().nonnegative().max(20).optional(),
    tabSwitches: z.number().int().nonnegative().max(20).optional(),
    scrollDepthPercent: z.number().int().min(0).max(100).optional(),
    completionRatePercent: z.number().int().min(0).max(100).optional()
  })
  .strict()
  .default({ timePerStepSeconds: {} });

export const metadataSchema = z
  .object({
    source: optionalString(80),
    campaign: optionalString(120),
    formId: optionalString(120),
    sessionId: optionalString(120),
    channel: z.enum(["web", "mobile_web", "dealer_widget", "marketplace_widget"]).optional(),
    sdkVersion: optionalString(40)
  })
  .strict()
  .default({});

export const routingSchema = z
  .object({
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "pincode must be a valid 6 digit code"),
    city: z.string().trim().min(1).max(80),
    locality: z.string().trim().min(1).max(120),
    addressLine: optionalString(180)
  })
  .strict();

export const consentSchema = z
  .object({
    dealerContactConsent: z.boolean(),
    consentedAt: z.string().datetime().optional(),
    privacyNoticeVersion: optionalString(40),
    consentSource: optionalString(80)
  })
  .strict();

export const scorePayloadSchema = z
  .object({
    industry: z.literal("auto"),
    answers: answersSchema,
    behaviouralMetrics: behaviouralMetricsSchema,
    metadata: metadataSchema,
    routing: routingSchema.optional(),
    consent: consentSchema.optional()
  })
  .strict()
  .superRefine((payload, context) => {
    const answerCount = Object.values(payload.answers).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined
    ).length;

    if (answerCount < 6) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers"],
        message: "At least six answered fields are required for a meaningful anonymous intent score."
      });
    }

    const demandAnchorCount = [
      payload.answers.purchaseTimeline,
      payload.answers.purchaseReason,
      payload.answers.bodyStyle,
      payload.answers.variantClarity,
      payload.answers.testDriveReadiness
    ].filter(Boolean).length;

    if (demandAnchorCount < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers"],
        message:
          "Provide at least two demand anchors such as purchaseTimeline, purchaseReason, bodyStyle, variantClarity, or testDriveReadiness."
      });
    }

    const answeredStepMap: Record<(typeof AUTO_STEP_KEYS)[number], boolean> = {
      budgetRange: payload.answers.budgetRange !== undefined,
      primaryPreference: payload.answers.primaryPreference !== undefined,
      purchaseTimeline: payload.answers.purchaseTimeline !== undefined,
      financePreference: payload.answers.financePreference !== undefined,
      brandsComparing: Boolean(payload.answers.brandsComparing?.length),
      downPaymentBand: payload.answers.downPaymentBand !== undefined,
      tradeInAvailable: payload.answers.tradeInAvailable !== undefined,
      salaryBand: payload.answers.salaryBand !== undefined,
      bodyStyle: payload.answers.bodyStyle !== undefined,
      fuelType: payload.answers.fuelType !== undefined,
      usagePattern: payload.answers.usagePattern !== undefined,
      monthlyKmBand: payload.answers.monthlyKmBand !== undefined,
      purchaseReason: payload.answers.purchaseReason !== undefined,
      currentVehicleAgeBand: payload.answers.currentVehicleAgeBand !== undefined,
      decisionMaker: payload.answers.decisionMaker !== undefined,
      variantClarity: payload.answers.variantClarity !== undefined,
      testDriveReadiness: payload.answers.testDriveReadiness !== undefined,
      monthlyEmiComfortBand: payload.answers.monthlyEmiComfortBand !== undefined
    };

    for (const key of AUTO_STEP_KEYS) {
      if (payload.behaviouralMetrics.timePerStepSeconds[key] !== undefined && !answeredStepMap[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["behaviouralMetrics", "timePerStepSeconds", key],
          message: `Step timing for ${key} requires the matching answer to be present.`
        });
      }
    }

    const totalStepSeconds = Object.values(payload.behaviouralMetrics.timePerStepSeconds).reduce(
      (sum, seconds) => sum + seconds,
      0
    );

    if (
      payload.behaviouralMetrics.totalCompletionSeconds !== undefined &&
      totalStepSeconds > payload.behaviouralMetrics.totalCompletionSeconds * 1.25
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["behaviouralMetrics", "timePerStepSeconds"],
        message: "Sum of timePerStepSeconds is unrealistically larger than totalCompletionSeconds."
      });
    }

    if (
      payload.behaviouralMetrics.totalCompletionSeconds !== undefined &&
      Object.values(payload.behaviouralMetrics.timePerStepSeconds).some(
        (seconds) => seconds > payload.behaviouralMetrics.totalCompletionSeconds!
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["behaviouralMetrics", "timePerStepSeconds"],
        message: "A step time cannot exceed the total completion time."
      });
    }

    if (
      payload.answers.purchaseReason === "first_car" &&
      payload.answers.currentVehicleAgeBand &&
      payload.answers.currentVehicleAgeBand !== "none"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "currentVehicleAgeBand"],
        message: "currentVehicleAgeBand should be 'none' when purchaseReason is 'first_car'."
      });
    }

    if (
      payload.answers.purchaseReason !== "first_car" &&
      payload.answers.purchaseReason !== undefined &&
      payload.answers.currentVehicleAgeBand === "none"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "currentVehicleAgeBand"],
        message: "Provide a currentVehicleAgeBand when the purchase is not a first car."
      });
    }

    if (
      payload.answers.testDriveReadiness === "scheduled_soon" &&
      payload.answers.variantClarity === "open"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "variantClarity"],
        message: "A scheduled-soon test drive should have at least trim-level clarity."
      });
    }
  });
