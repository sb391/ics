import { NextResponse } from "next/server";
import { z } from "zod";

import { buildBackendSubmissionPayload, consumerDemandProxySchema, getApiBaseUrl } from "@/lib/backend-client";
import { consumerDemandFormSchema } from "@/lib/form-schema";

const consumerDemandRequestSchema = consumerDemandFormSchema.and(
  z.object({
  behaviouralMetrics: consumerDemandProxySchema.shape.behaviouralMetrics
  })
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = consumerDemandRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CONSUMER_DEMAND_FORM",
          message: "Please review the highlighted demand fields and try again.",
          details: parsed.error.flatten()
        }
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/consumer/demands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify(buildBackendSubmissionPayload(parsed.data, request.headers))
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        payload ?? {
          error: {
            code: "ICS_BACKEND_ERROR",
            message: "The scoring service could not record the demand right now."
          }
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "ICS_BACKEND_UNAVAILABLE",
          message: "The scoring service is currently unavailable."
        }
      },
      { status: 502 }
    );
  }
}
