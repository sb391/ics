import { describe, expect, it } from "vitest";

import { AUTO_SAMPLE_PAYLOAD } from "../../src/modules/scoring/industries/auto/auto.constants";
import { submissionPayloadSchema } from "../../src/modules/submissions/submission.schemas";
import { buildAutoPayload } from "../helpers/auto-payload";

describe("score payload validation", () => {
  it("accepts the anonymous sample payload", () => {
    expect(() => submissionPayloadSchema.parse(AUTO_SAMPLE_PAYLOAD)).not.toThrow();
  });

  it("accepts payloads without metadata when only declaration answers are provided", () => {
    expect(() =>
      submissionPayloadSchema.parse(
        buildAutoPayload({
          metadata: {
            source: undefined,
            campaign: undefined,
            formId: undefined,
            sessionId: undefined,
            channel: undefined,
            sdkVersion: undefined
          }
        })
      )
    ).not.toThrow();
  });

  it("requires enough answered fields for a meaningful anonymous score", () => {
    expect(() =>
      submissionPayloadSchema.parse({
        industry: "auto",
        answers: {
          budgetRange: "12_20_lakh",
          purchaseTimeline: "30_days",
          purchaseReason: "upgrade",
          currentVehicleAgeBand: "4_7_years",
          variantClarity: "trim_shortlist"
        },
        behaviouralMetrics: {
          timePerStepSeconds: {}
        }
      })
    ).toThrow(/At least six answered fields/i);
  });

  it("requires at least two demand anchors", () => {
    expect(() =>
      submissionPayloadSchema.parse(
        buildAutoPayload({
          answers: {
            purchaseTimeline: undefined,
            purchaseReason: undefined,
            bodyStyle: undefined,
            variantClarity: "open",
            testDriveReadiness: undefined
          }
        })
      )
    ).toThrow(/at least two demand anchors/i);
  });

  it("rejects step timing for unanswered questions", () => {
    const payload = buildAutoPayload({
      answers: {
        monthlyEmiComfortBand: undefined
      }
    });

    payload.behaviouralMetrics.timePerStepSeconds.monthlyEmiComfortBand = 12;

    expect(() =>
      submissionPayloadSchema.parse(payload)
    ).toThrow(/requires the matching answer/i);
  });

  it("rejects impossible step totals versus completion time", () => {
    expect(() =>
      submissionPayloadSchema.parse(
        buildAutoPayload({
          behaviouralMetrics: {
            totalCompletionSeconds: 30,
            timePerStepSeconds: {
              budgetRange: 15,
              purchaseTimeline: 18,
              financePreference: 12
            }
          }
        })
      )
    ).toThrow(/unrealistically larger/i);
  });

  it("rejects inconsistent vehicle-history combinations", () => {
    expect(() =>
      submissionPayloadSchema.parse(
        buildAutoPayload({
          answers: {
            purchaseReason: "first_car",
            currentVehicleAgeBand: "4_7_years"
          }
        })
      )
    ).toThrow(/should be 'none' when purchaseReason is 'first_car'/i);
  });

  it("rejects scheduled test drives without shortlist clarity", () => {
    expect(() =>
      submissionPayloadSchema.parse(
        buildAutoPayload({
          answers: {
            variantClarity: "open",
            testDriveReadiness: "scheduled_soon"
          }
        })
      )
    ).toThrow(/scheduled-soon test drive should have at least trim-level clarity/i);
  });
});
