import { z } from "zod";

const behaviouralMetricsSchema = z.object({
  totalCompletionSeconds: z.number().int().positive().max(3600),
  timePerStepSeconds: z.record(z.number().int().positive().max(600)),
  backtracks: z.number().int().min(0).max(30),
  answerEdits: z.number().int().min(0).max(60),
  idlePauses: z.number().int().min(0).max(30),
  tabSwitches: z.number().int().min(0).max(30),
  scrollDepthPercent: z.number().int().min(0).max(100),
  completionRatePercent: z.number().int().min(0).max(100)
});

export const consumerDemandProxySchema = z.object({
  answers: z.record(z.unknown()),
  routing: z.object({
    pincode: z.string(),
    city: z.string(),
    locality: z.string(),
    addressLine: z.string().optional()
  }),
  consent: z.object({
    dealerContactConsent: z.boolean()
  }),
  behaviouralMetrics: behaviouralMetricsSchema
});

function inferChannel(userAgent: string | null) {
  if (!userAgent) {
    return "web";
  }

  return /Android|iPhone|iPad|Mobile/i.test(userAgent) ? "mobile_web" : "web";
}

export function getApiBaseUrl() {
  return process.env.ICS_API_BASE_URL ?? "http://localhost:4000";
}

export function buildBackendSubmissionPayload(
  payload: z.infer<typeof consumerDemandProxySchema>,
  requestHeaders: Headers
) {
  const sessionId = requestHeaders.get("x-ics-session-id") || `sess_${crypto.randomUUID()}`;
  const campaign = requestHeaders.get("x-ics-campaign") || undefined;

  return {
    industry: "auto" as const,
    answers: payload.answers,
    behaviouralMetrics: payload.behaviouralMetrics,
    routing: {
      ...payload.routing,
      addressLine: payload.routing.addressLine || undefined
    },
    consent: {
      dealerContactConsent: true,
      consentedAt: new Date().toISOString(),
      privacyNoticeVersion: "consumer-web-1.0",
      consentSource: "consumer_web"
    },
    metadata: {
      source: "consumer_web",
      campaign,
      formId: "public_auto_demand_journey",
      sessionId,
      channel: inferChannel(requestHeaders.get("user-agent")),
      sdkVersion: "consumer-web-1.0"
    }
  };
}
