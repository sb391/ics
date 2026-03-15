import { z } from "zod";

import {
  bodyStyleValues,
  brandValues,
  budgetFlexibilityValues,
  budgetRangeValues,
  currentVehicleAgeBandValues,
  decisionMakerValues,
  downPaymentBandValues,
  financePreferenceValues,
  fuelTypeValues,
  monthlyEmiComfortBandValues,
  monthlyKmBandValues,
  primaryPreferenceValues,
  purchaseReasonValues,
  purchaseTimelineValues,
  salaryBandValues,
  showroomVisitStatusValues,
  testDriveReadinessValues,
  usagePatternValues,
  variantClarityValues
} from "@/lib/demand-config";

const requiredString = (maxLength: number) => z.string().trim().min(1).max(maxLength);
const optionalString = (maxLength: number) => z.string().trim().min(1).max(maxLength).optional().or(z.literal(""));

export const consumerDemandFormSchema = z
  .object({
    answers: z.object({
      bodyStyle: z.enum(bodyStyleValues),
      budgetRange: z.enum(budgetRangeValues),
      primaryPreference: z.enum(primaryPreferenceValues),
      brandsComparing: z
        .array(z.enum(brandValues))
        .min(1, "Choose at least one serious brand.")
        .max(5, "Choose at most five brands.")
        .refine((values) => new Set(values).size === values.length, "Duplicate brands are not allowed."),
      fuelType: z.enum(fuelTypeValues),
      usagePattern: z.enum(usagePatternValues),
      monthlyKmBand: z.enum(monthlyKmBandValues),
      purchaseTimeline: z.enum(purchaseTimelineValues),
      purchaseReason: z.enum(purchaseReasonValues),
      currentVehicleAgeBand: z.enum(currentVehicleAgeBandValues),
      showroomVisitStatus: z.enum(showroomVisitStatusValues),
      variantClarity: z.enum(variantClarityValues),
      testDriveReadiness: z.enum(testDriveReadinessValues),
      decisionMaker: z.enum(decisionMakerValues),
      timelineConfidencePercent: z.number().int().min(0).max(100),
      financePreference: z.enum(financePreferenceValues),
      downPaymentBand: z.enum(downPaymentBandValues),
      salaryBand: z.enum(salaryBandValues),
      monthlyEmiComfortBand: z.enum(monthlyEmiComfortBandValues),
      budgetFlexibility: z.enum(budgetFlexibilityValues),
      openToBudgetIncrease: z.boolean(),
      tradeInAvailable: z.boolean()
    }),
    routing: z.object({
      pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode."),
      city: requiredString(80),
      locality: requiredString(120),
      addressLine: optionalString(180)
    }),
    consent: z.object({
      dealerContactConsent: z.boolean()
    })
  })
  .superRefine((value, context) => {
    if (value.answers.purchaseReason === "first_car" && value.answers.currentVehicleAgeBand !== "none") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "currentVehicleAgeBand"],
        message: "If this is your first car, choose the option that says you do not currently own one."
      });
    }

    if (value.answers.purchaseReason !== "first_car" && value.answers.currentVehicleAgeBand === "none") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "currentVehicleAgeBand"],
        message: "For upgrades or replacements, tell us what stage your current car is in."
      });
    }

    if (
      value.answers.testDriveReadiness === "scheduled_soon" &&
      value.answers.variantClarity === "open"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers", "variantClarity"],
        message: "If you want a test drive soon, narrow the shortlist beyond an open variant search."
      });
    }

    if (!value.consent.dealerContactConsent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consent", "dealerContactConsent"],
        message: "Please confirm that we may connect you with relevant dealers or partners."
      });
    }
  });

export type ConsumerDemandFormValues = z.infer<typeof consumerDemandFormSchema>;

export interface ConsumerDemandApiRequest extends ConsumerDemandFormValues {
  behaviouralMetrics: {
    totalCompletionSeconds: number;
    timePerStepSeconds: Record<string, number>;
    backtracks: number;
    answerEdits: number;
    idlePauses: number;
    tabSwitches: number;
    scrollDepthPercent: number;
    completionRatePercent: number;
  };
}
