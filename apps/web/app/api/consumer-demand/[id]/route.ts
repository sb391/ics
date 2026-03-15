import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/backend-client";

export async function GET(
  _request: Request,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/consumer/demands/${context.params.id}`, {
      method: "GET",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        payload ?? {
          error: {
            code: "DEMAND_STATUS_UNAVAILABLE",
            message: "We could not load the demand status."
          }
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
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
